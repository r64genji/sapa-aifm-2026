import { tagReply } from "@/lib/classify";
import { now } from "@/lib/clock";
import { encrypt } from "@/lib/crypto";
import type { Person } from "@/lib/directory";
import type { Reply } from "@/lib/engine";
import { escalate } from "@/lib/escalations";
import { packs, type Language } from "@/lib/packs";
import { detect } from "@/lib/safety";
import type { Input, Turn } from "@/lib/chat";
import { createAdminClient } from "@/lib/supabase/admin";

type Chat = {
  open: boolean;
  at: string;
  topic: Input["topic"];
  taps: Input["taps"];
  focus: string | null;
  turns: Turn[];
  asked: number;
  no_detail: number;
  response_id: string | null;
  remarks?: boolean;
};

export type Schedule = {
  id: string;
  progress: number;
  touchpoint: number;
  questions: string[] | null;
  recheck_action_id: string | null;
  recheck_driver: string | null;
  chat: Chat | null;
  actions: { notes: Record<string, string> | null } | null;
};

export const SCHEDULE = "id, progress, touchpoint, questions, recheck_action_id, recheck_driver, chat, actions!recheck_action_id(notes)";

const CHAT_WINDOW_MS = 48 * 3600 * 1000;
const DRIVERS = ["ROLE_CLARITY", "MANAGER_SUPPORT", "BELONGING", "ONBOARDING", "TRAINING", "WORKLOAD"];

const followUp = (schedule: Schedule) => !!schedule.recheck_action_id && !!schedule.actions?.notes;

const sequenceOf = (language: Language, schedule: Schedule) => {
  const tail = followUp(schedule) ? ["FIX_CHANGE"] : [];
  const base: string[] = schedule.questions ?? packs[language].checkin.sequence;
  const asked = base.includes("OPEN") ? base.flatMap((id) => (id === "OPEN" ? [...tail, id] : [id])) : [...base, ...tail];
  return schedule.recheck_driver ? [schedule.recheck_driver, ...asked.filter((id) => id !== schedule.recheck_driver)] : asked;
};

const questionOf = (language: Language, id: string) =>
  packs[language].checkin.questions.find((q) => q.id === id) as { id: string; type: string; text: string; labels?: string[] };

export const fillTopic = (language: Language, text: string, driver: string | null) =>
  text.replace("{topic}", (packs[language].checkin.topics as Record<string, string>)[driver ?? ""] ?? "");

const doneButton = (language: Language) => ({ label: packs[language].checkin.chat.done, id: "ans", value: "done" });

export function questionReply(person: Pick<Person, "language">, schedule: Schedule, progress: number): Reply {
  const id = sequenceOf(person.language, schedule)[progress];
  const question = questionOf(person.language, id);
  if (id === "OPEN") return { text: schedule.chat?.turns[0]?.text ?? question.text, buttons: [doneButton(person.language)] };
  if (question.type !== "scale") return { text: question.text };
  return {
    text: fillTopic(person.language, question.text, schedule.recheck_driver),
    buttons: question.labels!.map((label, i) => ({ label, id: "ans", value: `${progress}.${i + 1}` })),
  };
}

export function checkinStart(person: Pick<Person, "language" | "name" | "anonymous">, schedule: Schedule): Reply[] {
  const { checkin } = packs[person.language];
  const intro = person.anonymous ? checkin.introAnonymous : person.name ? checkin.introNamed.replace("{name}", person.name) : checkin.intro;
  const question = questionReply(person, schedule, 0);
  return [{ ...question, text: `${intro}\n\n${question.text}` }];
}

export function checkinReminder(person: Pick<Person, "language">, schedule: Schedule): Reply[] {
  const question = questionReply(person, schedule, schedule.progress);
  return [{ ...question, text: `${packs[person.language].checkin.reminder}\n\n${question.text}` }];
}

async function openCheckin(person: Person) {
  const { data, error } = await createAdminClient()
    .from("checkin_schedule")
    .select(SCHEDULE)
    .eq("person_id", person.id)
    .in("status", ["sent", "reminded"])
    .order("due_at", { ascending: false })
    .limit(1)
    .maybeSingle<Schedule>();
  if (error) throw error;
  return data;
}

export async function skipCheckin(person: Person) {
  const open = await openCheckin(person);
  if (!open) return false;
  const { data, error } = await createAdminClient()
    .from("checkin_schedule")
    .update({ status: "skipped" })
    .eq("id", open.id)
    .in("status", ["sent", "reminded"])
    .select("id");
  if (error) throw error;
  return data.length === 1;
}

export async function insertResponse(
  person: Person,
  scheduleId: string | null,
  questionId: string,
  scale: number | null,
  text: string | null,
  kind = "checkin",
  actionId: string | null = null,
) {
  const { data, error } = await createAdminClient()
    .from("responses")
    .insert({
      organisation_id: person.organisation_id,
      person_id: person.id,
      schedule_id: scheduleId,
      question_id: questionId,
      scale_value: scale,
      text_encrypted: text === null ? null : encrypt(text),
      language: person.language,
      kind,
      action_id: actionId,
      created_at: (await now()).toISOString(),
    })
    .select("id")
    .single();
  if (error) throw error;
  return data.id as string;
}

async function store(person: Person, open: Schedule, scale: number | null, text: string | null) {
  const sequence = sequenceOf(person.language, open);
  const id = sequence[open.progress];
  const last = open.progress === sequence.length - 1;
  const { data, error } = await createAdminClient()
    .from("checkin_schedule")
    .update({ progress: open.progress + 1, ...(last ? { status: "answered" } : {}) })
    .eq("id", open.id)
    .eq("progress", open.progress)
    .select("id");
  if (error) throw error;
  if (data.length === 0) return null;
  const linked = open.progress === 0 || id === "FIX_CHANGE" || (id === "OPEN" && followUp(open));
  return insertResponse(person, open.id, id, scale, text, "checkin", linked ? open.recheck_action_id : null);
}

async function saveChat(scheduleId: string, chat: Chat) {
  const { error } = await createAdminClient()
    .from("checkin_schedule")
    .update({ chat: { ...chat, at: (await now()).toISOString() } })
    .eq("id", scheduleId);
  if (error) throw error;
}

async function proceed(person: Person, open: Schedule, progress: number) {
  return sequenceOf(person.language, open)[progress] === "OPEN" ? startChat(person, open) : questionReply(person, open, progress);
}

async function startChat(person: Person, open: Schedule) {
  const { checkin } = packs[person.language];
  const { data, error } = await createAdminClient()
    .from("responses")
    .select("question_id, scale_value")
    .eq("schedule_id", open.id)
    .not("scale_value", "is", null)
    .order("created_at");
  if (error) throw error;
  const label = (id: string, score: number) => questionOf(person.language, id).labels![score - 1];
  const taps = data
    .filter((row) => DRIVERS.includes(row.question_id))
    .map((row) => ({
      driver: row.question_id,
      question: questionOf(person.language, row.question_id).text,
      answer: label(row.question_id, row.scale_value),
      score: row.scale_value as number,
    }));
  const change = data.find((row) => row.question_id === "FIX_CHANGE");
  const low = taps.reduce<(typeof taps)[number] | null>(
    (min, tap) => (tap.score <= 3 && (!min || tap.score < min.score) ? tap : min),
    null,
  );
  const [topic, focus, fallback]: [Input["topic"], string | null, string] = change
    ? ["fix_follow_up", open.recheck_driver, change.scale_value >= 4 ? checkin.chat.changed : checkin.chat.stillNot]
    : low
      ? ["low_tap", low.driver, (checkin.probe.topics as Record<string, { open: string }>)[low.driver].open]
      : ["light", null, checkin.chat.light];
  let text = fallback;
  if (!change) {
    const context = low
      ? checkin.chat.context.replace("{taps}", checkin.chat.tap.replace("{label}", low.answer).replace("{topic}", fillTopic(person.language, "{topic}", low.driver)))
      : checkin.chat.good;
    text = `${context}\n\n${fallback}\n\n${checkin.chat.optional}`;
  }
  const chat: Chat = { open: true, at: "", topic, taps, focus, turns: [{ from: "bot", text }], asked: 1, no_detail: 0, response_id: null };
  await saveChat(open.id, chat);
  return { text, buttons: [doneButton(person.language)] };
}

async function openChat(person: Person) {
  const { data, error } = await createAdminClient()
    .from("checkin_schedule")
    .select("id, chat")
    .eq("person_id", person.id)
    .eq("status", "answered")
    .eq("chat->>open", "true")
    .order("due_at", { ascending: false })
    .limit(1)
    .maybeSingle<{ id: string; chat: Chat }>();
  if (error) throw error;
  if (!data || Date.parse(data.chat.at) + CHAT_WINDOW_MS <= (await now()).getTime()) return null;
  return data;
}

const saidIn = (turns: Turn[]) => turns.filter((turn) => turn.from === "new_hire").map((turn) => turn.text);
const wordsOf = (chat: Chat) => saidIn(chat.turns).join("\n");

async function askRemarks(person: Person, scheduleId: string, chat: Chat | null): Promise<Reply[]> {
  const base: Chat = chat ?? { open: true, at: "", topic: "light", taps: [], focus: null, turns: [], asked: 0, no_detail: 0, response_id: null };
  await saveChat(scheduleId, { ...base, open: true, remarks: true });
  return [{ text: packs[person.language].checkin.chat.remarks, buttons: [doneButton(person.language)] }];
}

async function remarksTurn(person: Person, scheduleId: string, chat: Chat, text: string): Promise<Reply[]> {
  await saveChat(scheduleId, { ...chat, open: false });
  return conclude(person, await insertResponse(person, scheduleId, "REMARKS", null, text), text, null);
}

async function endChat(person: Person, scheduleId: string, chat: Chat, model: string | null = null): Promise<Reply[]> {
  await saveChat(scheduleId, { ...chat, open: false });
  if (chat.remarks) return [{ text: packs[person.language].checkin.thanks }];
  const remarks = () => askRemarks(person, scheduleId, chat);
  if (!chat.response_id) return remarks();
  const text = wordsOf(chat);
  const { error } = await createAdminClient().from("responses").update({ text_encrypted: encrypt(text) }).eq("id", chat.response_id);
  if (error) throw error;
  return conclude(person, chat.response_id, text, model, remarks);
}

async function chatTurn(person: Person, scheduleId: string, before: Chat, text: string): Promise<Reply[]> {
  if (before.remarks) return remarksTurn(person, scheduleId, before, text);
  return endChat(person, scheduleId, { ...before, turns: [...before.turns, { from: "new_hire", text }] });
}

async function conclude(person: Person, responseId: string, text: string, chatModel: string | null, then: (() => Promise<Reply[]>) | null = null): Promise<Reply[]> {
  const { checkin } = packs[person.language];
  const keyword = detect(text);
  if (keyword || chatModel) await escalate(person, responseId, keyword, chatModel);
  const result = await tagReply(person.organisation_id, responseId, text).catch((error) => {
    console.error(error);
    return { status: "awaiting_ai" as const };
  });
  const model = chatModel ?? (result.status !== "awaiting_ai" && result.tag.escalate ? result.tag.escalate_category : null);
  if (keyword || model) return [await escalate(person, responseId, keyword, model)];
  if (then) return then();
  return [{ text: result.status === "awaiting_ai" ? checkin.gotIt : checkin.thanks }];
}

async function chatDone(person: Person): Promise<Reply[] | null> {
  const open = await openCheckin(person);
  if (open && sequenceOf(person.language, open)[open.progress] === "OPEN") {
    const { data, error } = await createAdminClient()
      .from("checkin_schedule")
      .update({ progress: open.progress + 1, status: "answered", chat: open.chat && { ...open.chat, open: false } })
      .eq("id", open.id)
      .eq("progress", open.progress)
      .select("id");
    if (error) throw error;
    if (data.length !== 1) return null;
    return askRemarks(person, open.id, open.chat);
  }
  const chat = await openChat(person);
  return chat ? endChat(person, chat.id, chat.chat) : null;
}

export async function checkinButton(person: Person, value: string): Promise<Reply[] | null> {
  if (value === "done") return chatDone(person);
  const open = await openCheckin(person);
  if (!open) return null;
  const sequence = sequenceOf(person.language, open);
  const [index, scale] = value.split(".").map(Number);
  const question = questionOf(person.language, sequence[open.progress]);
  if (index !== open.progress) return [];
  if (question.type !== "scale" || !(scale >= 1 && scale <= 5)) {
    return [questionReply(person, open, open.progress)];
  }
  if (!(await store(person, open, scale, null))) return null;
  return [await proceed(person, open, open.progress + 1)];
}

const typedScale = (language: Language, id: string, text: string) => {
  const said = text.normalize("NFKC").trim().toLowerCase();
  const digit = said.match(/^\D{0,15}?\b([1-5])(?:\s*\/\s*5)?\b\D{0,15}$/);
  if (digit) return Number(digit[1]);
  const index = [language, "en" as const].map((pack) => (questionOf(pack, id).labels ?? []).findIndex((label) => label.toLowerCase() === said)).find((i) => i >= 0);
  return index === undefined ? null : index + 1;
};

export async function checkinText(person: Person, text: string): Promise<Reply[] | null> {
  const open = await openCheckin(person);
  if (!open) return answerChat(person, text);
  const id = sequenceOf(person.language, open)[open.progress];
  const question = questionOf(person.language, id);
  if (question.type !== "open") {
    const keyword = detect(text);
    const typed = question.type === "scale" ? typedScale(person.language, id, text) : null;
    if (!keyword && typed) return checkinButton(person, `${open.progress}.${typed}`);
    if (!keyword) return [questionReply(person, open, open.progress)];
    const unprompted = await insertResponse(person, null, "QA", null, text, "unprompted");
    return [await escalate(person, unprompted, keyword, null)];
  }
  const responseId = await store(person, open, null, text);
  if (!responseId) return null;
  const chat = open.chat ?? { open: true, at: "", topic: "light" as const, taps: [], focus: null, turns: [], asked: 1, no_detail: 0, response_id: null };
  return chatTurn(person, open.id, { ...chat, response_id: responseId }, text);
}

async function answerChat(person: Person, text: string): Promise<Reply[] | null> {
  const open = await openChat(person);
  if (!open) return null;
  return chatTurn(person, open.id, open.chat, text);
}
