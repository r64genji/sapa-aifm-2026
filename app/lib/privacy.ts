import { now } from "@/lib/clock";
import { decrypt } from "@/lib/crypto";
import { notReceiving, reachable, type Person } from "@/lib/directory";
import type { Reply } from "@/lib/engine";
import { packs, type Language } from "@/lib/packs";
import { signal } from "@/lib/signal";
import { send } from "@/lib/telegram";
import { createAdminClient } from "@/lib/supabase/admin";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MY_ANSWERS = 10;
const MESSAGE_MAX = 4000;

type Stored = {
  id: string;
  question_id: string;
  scale_value: number | null;
  text_encrypted: string | null;
  created_at: string;
  ai_tags: {
    status: string;
    drivers: string[];
    context_tags: string[];
    summary: string | null;
    changed_by_hr: boolean | null;
  } | null;
  escalations: { id: string } | null;
};

export function deletePrompt(language: Language): Reply {
  const { delete: text } = packs[language];
  return {
    text: text.confirm,
    buttons: [
      { label: text.yes, id: "delete", value: "yes" },
      { label: text.no, id: "delete", value: "no" },
    ],
  };
}

export async function confirmDelete(person: Person, value: string): Promise<Reply[]> {
  const { delete: text } = packs[person.language];
  if (value !== "yes") return [{ text: text.kept }];
  const { error } = await createAdminClient().rpc("delete_person", {
    person: person.id,
    at: (await now()).toISOString(),
  });
  if (error) throw error;
  await signal(person.organisation_id, "cohort");
  await signal(person.organisation_id, "queue");
  return [{ text: text.done }];
}

async function timeZone(organisationId: string) {
  const { data, error } = await createAdminClient()
    .from("organisations")
    .select("time_zone")
    .eq("id", organisationId)
    .single();
  if (error) throw error;
  return data.time_zone as string;
}

const day = (at: string, zone: string) => new Intl.DateTimeFormat("en-CA", { timeZone: zone }).format(new Date(at));

function labels(language: Language, tags: string[]) {
  const names = packs[language].labels as Record<string, string>;
  return tags.length > 0 ? tags.map((tag) => names[tag] ?? tag).join(", ") : packs[language].myAnswers.noLabels;
}

async function stored(personId: string, limit?: number) {
  let query = createAdminClient()
    .from("responses")
    .select(
      "id, question_id, scale_value, text_encrypted, created_at, ai_tags(status, drivers, context_tags, summary, changed_by_hr), escalations(id)",
    )
    .eq("person_id", personId)
    .order("created_at", { ascending: false });
  if (limit) query = query.not("text_encrypted", "is", null).limit(limit);
  const { data, error } = await query;
  if (error) throw error;
  return (data as unknown as Stored[]).reverse();
}

function entry(language: Language, row: Stored, zone: string) {
  const { myAnswers } = packs[language];
  const lines = [day(row.created_at, zone)];
  if (row.text_encrypted) lines.push(decrypt(row.text_encrypted));
  if (row.escalations) return { text: lines.join("\n"), tagged: false };
  const tag = row.ai_tags;
  if (!tag || tag.status === "awaiting_ai") return { text: [...lines, myAnswers.pending].join("\n"), tagged: false };
  lines.push(`${tag.changed_by_hr ? myAnswers.changedByHr : myAnswers.aiReading}: ${tag.summary ?? ""}`.trim());
  lines.push(`${myAnswers.labels}: ${labels(language, [...tag.drivers, ...tag.context_tags])}`);
  return { text: lines.join("\n"), tagged: true };
}

export async function myAnswers(person: Person): Promise<Reply[]> {
  const rows = await stored(person.id, MY_ANSWERS);
  const { myAnswers: text } = packs[person.language];
  if (rows.length === 0) return [{ text: text.none }];
  const zone = await timeZone(person.organisation_id);
  return rows.map((row) => {
    const shown = entry(person.language, row, zone);
    return shown.tagged
      ? { text: shown.text, buttons: [{ label: text.wrong, id: "wrong", value: row.id }] }
      : { text: shown.text };
  });
}

export async function challenge(person: Person, responseId: string): Promise<Reply[] | null> {
  if (!UUID.test(responseId)) return null;
  const db = createAdminClient();
  const { data, error } = await db
    .from("responses")
    .select("id, ai_tags(status), escalations(id)")
    .eq("id", responseId)
    .eq("person_id", person.id)
    .maybeSingle();
  if (error) throw error;
  const row = data as unknown as Pick<Stored, "id" | "escalations"> & { ai_tags: { status: string } | null } | null;
  if (!row?.ai_tags || row.escalations || row.ai_tags.status === "awaiting_ai") return null;
  const { error: updateError } = await db
    .from("ai_tags")
    .update({ status: "needs_review", challenged_at: (await now()).toISOString(), challenge_resolved_at: null })
    .eq("response_id", responseId);
  if (updateError) throw updateError;
  await signal(person.organisation_id, "cohort");
  await signal(person.organisation_id, "queue");
  return [{ text: packs[person.language].myAnswers.challenged }];
}

export async function resolveChallenge(responseId: string) {
  const db = createAdminClient();
  const { data, error } = await db
    .from("ai_tags")
    .update({ challenge_resolved_at: (await now()).toISOString() })
    .eq("response_id", responseId)
    .not("challenged_at", "is", null)
    .is("challenge_resolved_at", null)
    .select("drivers, context_tags, responses!inner(person_id)")
    .maybeSingle();
  if (error) throw error;
  if (!data) return;
  const person = await reachable((data as unknown as { responses: { person_id: string } }).responses.person_id);
  if (!person) return;
  const { myAnswers: text } = packs[person.language];
  await send(person.telegram_chat_id!, {
    text: `${text.resolved} ${labels(person.language, [...data.drivers, ...data.context_tags])}`,
  });
}

function chunks(parts: string[]) {
  const messages: string[] = [];
  for (const part of parts) {
    const last = messages.at(-1);
    if (last !== undefined && last.length + part.length + 2 <= MESSAGE_MAX) messages[messages.length - 1] = `${last}\n\n${part}`;
    else messages.push(part.slice(0, MESSAGE_MAX));
  }
  return messages;
}

export async function exportPerson(organisationId: string, actor: string, codeName: string, reason: string) {
  const db = createAdminClient();
  const { data: people, error } = await db
    .from("people")
    .select("id")
    .eq("organisation_id", organisationId)
    .eq("code_name", codeName)
    .neq("state", "deleted");
  if (error) throw error;
  if (people.length !== 1) return { error: "Not found", code: 404 };
  const person = await reachable(people[0].id);
  if (!person) return { error: notReceiving, code: 409 };
  const language = person.language;
  const pack = packs[language];
  const zone = await timeZone(organisationId);
  const { data: consents, error: consentError } = await db
    .from("consents")
    .select("scope")
    .eq("person_id", person.id)
    .is("withdrawn_at", null);
  if (consentError) throw consentError;
  const { data: questions, error: questionError } = await db
    .from("asked_questions")
    .select("text_encrypted, answer_encrypted, created_at")
    .eq("person_id", person.id)
    .order("created_at");
  if (questionError) throw questionError;
  const parts = [pack.export.intro];
  for (const consent of consents) {
    parts.push(`${pack.export.visibility} ${consent.scope === "share_with_manager" ? pack.visibilityHrManager : pack.visibilityHrOnly}`);
  }
  for (const row of await stored(person.id)) {
    if (row.scale_value !== null) {
      const question = pack.checkin.questions.find((q) => q.id === row.question_id);
      parts.push(`${day(row.created_at, zone)}\n${question?.text ?? row.question_id}\n${row.scale_value}`);
    } else {
      parts.push(entry(language, row, zone).text);
    }
  }
  for (const question of questions) {
    const lines = [day(question.created_at, zone)];
    if (question.text_encrypted) lines.push(`${pack.export.question} ${decrypt(question.text_encrypted)}`);
    if (question.answer_encrypted) lines.push(`${pack.export.answer} ${decrypt(question.answer_encrypted)}`);
    parts.push(lines.join("\n"));
  }
  for (const text of chunks(parts)) {
    if (!(await send(person.telegram_chat_id!, { text }))) return { error: notReceiving, code: 409 };
  }
  const { error: auditError } = await db
    .from("audit_log")
    .insert({ actor, action: "export_person_data", target: person.id, reason, at: (await now()).toISOString() });
  if (auditError) throw auditError;
  return { sent: true };
}

export async function purgeRawText() {
  const { data, error } = await createAdminClient().rpc("purge_raw_text", { at: (await now()).toISOString() });
  if (error) throw error;
  return data as number;
}
