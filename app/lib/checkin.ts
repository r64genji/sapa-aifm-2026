import { now } from "@/lib/clock";
import { encrypt } from "@/lib/crypto";
import type { Person } from "@/lib/directory";
import type { Reply } from "@/lib/engine";
import { packs } from "@/lib/packs";
import { createAdminClient } from "@/lib/supabase/admin";

type Open = { id: string; progress: number };

export function questionReply(person: Pick<Person, "language">, progress: number): Reply {
  const { checkin } = packs[person.language];
  const question = checkin.questions.find((q) => q.id === checkin.sequence[progress])!;
  if (question.type !== "scale") return { text: question.text };
  return {
    text: question.text,
    buttons: [1, 2, 3, 4, 5].map((n) => ({ label: String(n), id: "ans", value: `${progress}.${n}` })),
  };
}

export function checkinStart(person: Pick<Person, "language">): Reply[] {
  return [{ text: packs[person.language].checkin.intro }, questionReply(person, 0)];
}

export function checkinReminder(person: Pick<Person, "language">, progress: number): Reply[] {
  return [{ text: packs[person.language].checkin.reminder }, questionReply(person, progress)];
}

async function openCheckin(person: Person) {
  const { data, error } = await createAdminClient()
    .from("checkin_schedule")
    .select("id, progress")
    .eq("person_id", person.id)
    .in("status", ["sent", "reminded"])
    .order("due_at", { ascending: false })
    .limit(1)
    .maybeSingle<Open>();
  if (error) throw error;
  return data;
}

async function store(person: Person, open: Open, scale: number | null, text: string | null) {
  const { checkin } = packs[person.language];
  const db = createAdminClient();
  const at = (await now()).toISOString();
  const last = open.progress === checkin.sequence.length - 1;
  const { data, error } = await db
    .from("checkin_schedule")
    .update({ progress: open.progress + 1, ...(last ? { status: "answered" } : {}) })
    .eq("id", open.id)
    .eq("progress", open.progress)
    .select("id");
  if (error) throw error;
  if (data.length === 0) return false;
  const { error: insertError } = await db.from("responses").insert({
    organisation_id: person.organisation_id,
    person_id: person.id,
    schedule_id: open.id,
    question_id: checkin.sequence[open.progress],
    scale_value: scale,
    text_encrypted: text === null ? null : encrypt(text),
    language: person.language,
    created_at: at,
  });
  if (insertError) throw insertError;
  return true;
}

export async function checkinButton(person: Person, value: string): Promise<Reply[] | null> {
  const open = await openCheckin(person);
  if (!open) return null;
  const { checkin } = packs[person.language];
  const [index, scale] = value.split(".").map(Number);
  const question = checkin.questions.find((q) => q.id === checkin.sequence[open.progress])!;
  if (index !== open.progress || question.type !== "scale" || !(scale >= 1 && scale <= 5)) {
    return [questionReply(person, open.progress)];
  }
  if (!(await store(person, open, scale, null))) return null;
  return [questionReply(person, open.progress + 1)];
}

export async function checkinText(person: Person, text: string): Promise<Reply[] | null> {
  const open = await openCheckin(person);
  if (!open) return null;
  const { checkin } = packs[person.language];
  const question = checkin.questions.find((q) => q.id === checkin.sequence[open.progress])!;
  if (question.type !== "open") return [questionReply(person, open.progress)];
  if (!(await store(person, open, null, text))) return null;
  return [{ text: checkin.thanks }];
}
