import { randomBytes } from "node:crypto";
import { now } from "@/lib/clock";
import { packs, type Language } from "@/lib/packs";
import { createAdminClient } from "@/lib/supabase/admin";

const INVITE_DAYS = 14;

export type Person = {
  id: string;
  organisation_id: string;
  language: Language;
  state: "invited" | "consent_shown" | "declined" | "active" | "stopped" | "left" | "deleted";
  telegram_chat_id: number | null;
  invite_expires_at: string;
  invite_used_at: string | null;
};

const personColumns =
  "id, organisation_id, language, state, telegram_chat_id, invite_expires_at, invite_used_at";

export async function addHire(
  organisationId: string,
  hire: {
    code_name: string;
    team: string;
    manager_id: string;
    start_date: string;
    role: string;
    language: string;
  },
) {
  const token = randomBytes(16).toString("base64url");
  const expires = new Date(await now());
  expires.setUTCDate(expires.getUTCDate() + INVITE_DAYS);
  const { error } = await createAdminClient()
    .from("people")
    .insert({
      organisation_id: organisationId,
      code_name: hire.code_name,
      team: hire.team,
      manager_id: hire.manager_id,
      start_date: hire.start_date,
      role: hire.role,
      language: hire.language,
      invite_token: token,
      invite_expires_at: expires.toISOString(),
    });
  if (error) return { error: error.message };
  return { invite_link: `https://t.me/${process.env.TELEGRAM_BOT_USERNAME}?start=${token}` };
}

export async function listHires(organisationId: string) {
  const { data, error } = await createAdminClient()
    .from("people")
    .select("code_name, team, start_date, role, invite_used_at")
    .eq("organisation_id", organisationId)
    .order("start_date");
  if (error) throw error;
  return data.map(({ invite_used_at, ...hire }) => ({ ...hire, invite_used: invite_used_at !== null }));
}

export async function personByChat(chatId: number) {
  const { data, error } = await createAdminClient()
    .from("people")
    .select(personColumns)
    .eq("telegram_chat_id", chatId)
    .maybeSingle<Person>();
  if (error) throw error;
  return data;
}

export async function personByToken(token: string) {
  const { data, error } = await createAdminClient()
    .from("people")
    .select(personColumns)
    .eq("invite_token", token)
    .maybeSingle<Person>();
  if (error) throw error;
  return data;
}

export async function redeemInvite(token: string, chatId: number) {
  const { data, error } = await createAdminClient()
    .from("people")
    .update({ telegram_chat_id: chatId, invite_used_at: (await now()).toISOString() })
    .eq("invite_token", token)
    .is("invite_used_at", null)
    .select(personColumns)
    .maybeSingle<Person>();
  if (error) throw error;
  return data;
}

export async function moveState(person: Person, from: Person["state"], to: Person["state"]) {
  const { data, error } = await createAdminClient()
    .from("people")
    .update({ state: to })
    .eq("id", person.id)
    .eq("state", from)
    .select("id");
  if (error) throw error;
  return data.length === 1;
}

export async function stopPerson(chatId: number) {
  const at = (await now()).toISOString();
  const { error } = await createAdminClient()
    .from("people")
    .update({ state: "stopped", stopped_at: at })
    .eq("telegram_chat_id", chatId)
    .neq("state", "stopped");
  if (error) throw error;
}

export async function setLanguage(person: Person, language: Language) {
  const { error } = await createAdminClient().from("people").update({ language }).eq("id", person.id);
  if (error) throw error;
}

export async function liveLanguages(organisationId: string) {
  const { data, error } = await createAdminClient()
    .from("language_packs")
    .select("language")
    .eq("organisation_id", organisationId)
    .not("checker_name", "is", null);
  if (error) throw error;
  return data.map((row) => row.language).filter((language): language is Language => language in packs);
}

export async function recordConsent(person: Person, textVersion: string) {
  const { error } = await createAdminClient().from("consents").insert({
    organisation_id: person.organisation_id,
    person_id: person.id,
    text_version: textVersion,
    granted_at: (await now()).toISOString(),
  });
  if (error) throw error;
}

export async function setScope(person: Person, scope: "hr_only" | "share_with_manager", textVersion: string) {
  const db = createAdminClient();
  const at = (await now()).toISOString();
  const { data, error } = await db
    .from("consents")
    .select("id, scope")
    .eq("person_id", person.id)
    .is("withdrawn_at", null);
  if (error) throw error;
  if (data.some((row) => row.scope === scope)) return;
  const { error: withdrawError } = await db
    .from("consents")
    .update({ withdrawn_at: at })
    .in("id", data.map((row) => row.id));
  if (withdrawError) throw withdrawError;
  const { error: insertError } = await db.from("consents").insert({
    organisation_id: person.organisation_id,
    person_id: person.id,
    text_version: textVersion,
    scope,
    granted_at: at,
  });
  if (insertError) throw insertError;
}

export async function activatePack(organisationId: string, language: string, checker: string) {
  const { data, error } = await createAdminClient()
    .from("language_packs")
    .update({ checker_name: checker, checked_on: (await now()).toISOString().slice(0, 10) })
    .eq("organisation_id", organisationId)
    .eq("language", language)
    .select("language");
  if (error) throw error;
  return data.length === 1;
}

export const notReceiving = "This person is not receiving messages from Sapa now";

export async function reachable(personId: string) {
  const { data, error } = await createAdminClient()
    .from("people")
    .select(personColumns)
    .eq("id", personId)
    .eq("state", "active")
    .eq("synthetic", false)
    .not("telegram_chat_id", "is", null)
    .maybeSingle<Person>();
  if (error) throw error;
  return data;
}
