import { insertResponse } from "@/lib/checkin";
import { tagReply } from "@/lib/classify";
import { now } from "@/lib/clock";
import type { Person } from "@/lib/directory";
import type { Reply } from "@/lib/engine";
import { escalate } from "@/lib/escalations";
import { packs, type Language } from "@/lib/packs";
import { detect } from "@/lib/safety";
import { audit } from "@/lib/signal";
import { createAdminClient } from "@/lib/supabase/admin";

export function exitTickPrompt(language: Language): Reply {
  const pack = packs[language];
  return {
    text: pack.exitPrompt,
    buttons: [
      { label: pack.exitYes, id: "exitok", value: "yes" },
      { label: pack.exitNo, id: "exitok", value: "no" },
    ],
  };
}

export function exitQuestion(language: Language): Reply {
  const { exit } = packs[language];
  return {
    text: exit.question,
    buttons: Object.entries(exit.drivers).map(([value, label]) => ({ label, id: "exit", value })),
  };
}

export async function needsExitTick(person: Person) {
  const { data, error } = await createAdminClient()
    .from("people")
    .select("exit_ok")
    .eq("id", person.id)
    .single();
  if (error) throw error;
  return data.exit_ok === null;
}

export async function setExitTick(person: Person, value: string): Promise<Reply[] | null> {
  if (value !== "yes" && value !== "no") return null;
  const { data, error } = await createAdminClient()
    .from("people")
    .update({ exit_ok: value === "yes" })
    .eq("id", person.id)
    .is("exit_ok", null)
    .select("id");
  if (error) throw error;
  return data.length === 1 ? [{ text: packs[person.language].exitSaved }] : null;
}

export async function markLeft(organisationId: string, actor: string, codeName: string, reason: string) {
  const db = createAdminClient();
  const { data, error } = await db
    .from("people")
    .select("id")
    .eq("organisation_id", organisationId)
    .eq("code_name", codeName)
    .maybeSingle();
  if (error) throw error;
  if (!data) return { error: "Not found", code: 404 };
  const { data: marked, error: markError } = await db.rpc("mark_left", {
    person: data.id,
    reason,
    at: (await now()).toISOString(),
  });
  if (markError) throw markError;
  if (!marked) return { error: "Already marked as left", code: 409 };
  await audit(actor, "mark_left", data.id);
  return { left: reason };
}

async function exitAnswers(person: Person) {
  const { data, error } = await createAdminClient()
    .from("responses")
    .select("question_id")
    .eq("person_id", person.id)
    .eq("kind", "exit");
  if (error) throw error;
  const ids = data.map((row) => row.question_id as string);
  return { driver: ids.some((id) => id.startsWith("exit.")), open: ids.includes("exit_open") };
}

async function asked(person: Person) {
  const { data, error } = await createAdminClient()
    .from("people")
    .select("exit_asked_at")
    .eq("id", person.id)
    .single();
  if (error) throw error;
  return data.exit_asked_at !== null;
}

export async function exitButton(person: Person, value: string): Promise<Reply[] | null> {
  const { exit } = packs[person.language];
  if (!(await asked(person)) || !(value in exit.drivers)) return null;
  const answers = await exitAnswers(person);
  if (answers.driver || answers.open) return null;
  await insertResponse(person, null, `exit.${value}`, null, null, "exit");
  return [{ text: exit.open }];
}

export async function exitText(person: Person, text: string): Promise<Reply[] | null> {
  if (!(await asked(person))) return null;
  const answers = await exitAnswers(person);
  if (answers.open) return null;
  if (!answers.driver) return [exitQuestion(person.language)];
  const responseId = await insertResponse(person, null, "exit_open", null, text, "exit");
  const keyword = detect(text);
  const result = await tagReply(person.organisation_id, responseId, text).catch((error) => {
    console.error(error);
    return { status: "awaiting_ai" as const };
  });
  const model = result.status !== "awaiting_ai" && result.tag.escalate ? result.tag.escalate_category : null;
  if (keyword || model) return [{ text: await escalate(person, responseId, keyword, model) }];
  return [{ text: packs[person.language].exit.thanks }];
}
