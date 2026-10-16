import { tagReply } from "@/lib/classify";
import { now } from "@/lib/clock";
import { encrypt } from "@/lib/crypto";
import type { Person } from "@/lib/directory";
import type { Reply } from "@/lib/engine";
import { escalate } from "@/lib/escalations";
import { packs, type Language } from "@/lib/packs";
import { detect } from "@/lib/safety";
import { createAdminClient } from "@/lib/supabase/admin";

type Open = {
  id: string;
  progress: number;
  touchpoint: number;
  probes_used: number;
  recheck_action_id: string | null;
  recheck_driver: string | null;
};

const probeCap = (touchpoint: number) => (touchpoint <= 7 ? 1 : 2);
const PROBE_WINDOW_MS = 48 * 3600 * 1000;

const sequenceOf = (language: Language, recheckDriver: string | null, touchpoint: number) => {
  const { sequence } = packs[language].checkin;
  const asked = touchpoint === 14 ? sequence.flatMap((id) => (id === "OPEN" ? ["JOB_MATCH", id] : [id])) : sequence;
  return recheckDriver ? [recheckDriver, ...asked.filter((id) => id !== recheckDriver)] : asked;
};

export function questionReply(person: Pick<Person, "language">, progress: number, recheckDriver: string | null, touchpoint: number): Reply {
  const { checkin } = packs[person.language];
  const question = checkin.questions.find((q) => q.id === sequenceOf(person.language, recheckDriver, touchpoint)[progress])!;
  if (question.type !== "scale") return { text: question.text };
  return {
    text: question.text,
    buttons: [1, 2, 3, 4, 5].map((n) => ({ label: String(n), id: "ans", value: `${progress}.${n}` })),
  };
}

export function checkinStart(person: Pick<Person, "language">, recheckDriver: string | null, touchpoint: number): Reply[] {
  return [{ text: packs[person.language].checkin.intro }, questionReply(person, 0, recheckDriver, touchpoint)];
}

export function checkinReminder(person: Pick<Person, "language">, progress: number, recheckDriver: string | null, touchpoint: number): Reply[] {
  return [{ text: packs[person.language].checkin.reminder }, questionReply(person, progress, recheckDriver, touchpoint)];
}

async function openCheckin(person: Person) {
  const { data, error } = await createAdminClient()
    .from("checkin_schedule")
    .select("id, progress, touchpoint, probes_used, recheck_action_id, recheck_driver")
    .eq("person_id", person.id)
    .in("status", ["sent", "reminded"])
    .order("due_at", { ascending: false })
    .limit(1)
    .maybeSingle<Open>();
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

async function store(person: Person, open: Open, scale: number | null, text: string | null) {
  const sequence = sequenceOf(person.language, open.recheck_driver, open.touchpoint);
  const last = open.progress === sequence.length - 1;
  const { data, error } = await createAdminClient()
    .from("checkin_schedule")
    .update({ progress: open.progress + 1, ...(last ? { status: "answered" } : {}) })
    .eq("id", open.id)
    .eq("progress", open.progress)
    .select("id");
  if (error) throw error;
  if (data.length === 0) return null;
  return insertResponse(person, open.id, sequence[open.progress], scale, text, "checkin", open.progress === 0 ? open.recheck_action_id : null);
}

async function openProbe(person: Person) {
  const { data, error } = await createAdminClient()
    .from("checkin_schedule")
    .select("id, progress, touchpoint, probes_used, probe_id, probe_at")
    .eq("person_id", person.id)
    .eq("status", "answered")
    .not("probe_id", "is", null)
    .order("due_at", { ascending: false })
    .limit(1)
    .maybeSingle<Open & { probe_id: string; probe_at: string }>();
  if (error) throw error;
  if (!data || Date.parse(data.probe_at) + PROBE_WINDOW_MS <= (await now()).getTime()) return null;
  return data;
}

async function conclude(person: Person, open: Open, responseId: string, text: string): Promise<Reply[]> {
  const { checkin } = packs[person.language];
  const keyword = detect(text);
  if (keyword) await escalate(person, responseId, keyword, null);
  const result = await tagReply(person.organisation_id, responseId, text).catch((error) => {
    console.error(error);
    return { status: "awaiting_ai" as const };
  });
  const model = result.status !== "awaiting_ai" && result.tag.escalate ? result.tag.escalate_category : null;
  if (keyword || model) return [await escalate(person, responseId, keyword, model)];
  if (result.status === "awaiting_ai") return [{ text: checkin.gotIt }];
  const probe =
    result.status === "ok" && open.probes_used < probeCap(open.touchpoint)
      ? checkin.probes.find((p) => p.id === result.tag.probe_id)
      : undefined;
  if (!probe) return [{ text: checkin.thanks }];
  const { error } = await createAdminClient()
    .from("checkin_schedule")
    .update({ probe_id: probe.id, probe_at: (await now()).toISOString(), probes_used: open.probes_used + 1 })
    .eq("id", open.id);
  if (error) throw error;
  return [{ text: probe.text }];
}

export async function checkinButton(person: Person, value: string): Promise<Reply[] | null> {
  const open = await openCheckin(person);
  if (!open) return null;
  const { checkin } = packs[person.language];
  const [index, scale] = value.split(".").map(Number);
  const question = checkin.questions.find((q) => q.id === sequenceOf(person.language, open.recheck_driver, open.touchpoint)[open.progress])!;
  if (index !== open.progress || question.type !== "scale" || !(scale >= 1 && scale <= 5)) {
    return [questionReply(person, open.progress, open.recheck_driver, open.touchpoint)];
  }
  if (!(await store(person, open, scale, null))) return null;
  return [questionReply(person, open.progress + 1, open.recheck_driver, open.touchpoint)];
}

export async function checkinText(person: Person, text: string): Promise<Reply[] | null> {
  const open = await openCheckin(person);
  if (!open) return answerProbe(person, text);
  const { checkin } = packs[person.language];
  const question = checkin.questions.find((q) => q.id === sequenceOf(person.language, open.recheck_driver, open.touchpoint)[open.progress])!;
  if (question.type !== "open") {
    const keyword = detect(text);
    if (!keyword) return [questionReply(person, open.progress, open.recheck_driver, open.touchpoint)];
    const unprompted = await insertResponse(person, null, "QA", null, text, "unprompted");
    return [await escalate(person, unprompted, keyword, null)];
  }
  const responseId = await store(person, open, null, text);
  if (!responseId) return null;
  return conclude(person, open, responseId, text);
}

async function answerProbe(person: Person, text: string): Promise<Reply[] | null> {
  const open = await openProbe(person);
  if (!open) return null;
  const { data, error } = await createAdminClient()
    .from("checkin_schedule")
    .update({ probe_id: null })
    .eq("id", open.id)
    .eq("probe_id", open.probe_id)
    .select("id");
  if (error) throw error;
  if (data.length === 0) return null;
  const responseId = await insertResponse(person, open.id, open.probe_id, null, text);
  return conclude(person, open, responseId, text);
}
