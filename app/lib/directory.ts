import { randomBytes } from "node:crypto";
import { now } from "@/lib/clock";
import { type Language } from "@/lib/packs";
import { audit } from "@/lib/signal";
import { createAdminClient } from "@/lib/supabase/admin";
import { allDays, tracksOf } from "@/lib/tracks";

const INVITE_DAYS = 14;

export type Person = {
  id: string;
  organisation_id: string;
  language: Language;
  state: "invited" | "consent_shown" | "declined" | "active" | "stopped" | "left" | "deleted";
  telegram_chat_id: number | null;
  intake_id: string | null;
  team: string | null;
};

const personColumns =
  "id, organisation_id, language, state, telegram_chat_id, intake_id, team";

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
  return { invite_link: joinLink(token) };
}

export const joinLink = (token: string) => `https://t.me/${process.env.TELEGRAM_BOT_USERNAME}?start=${token}`;

export async function listHires(organisationId: string) {
  const { data, error } = await createAdminClient()
    .from("people")
    .select("team, start_date, invite_used_at")
    .eq("organisation_id", organisationId)
    .order("start_date");
  if (error) throw error;
  return data.map(({ start_date, invite_used_at, ...hire }) => ({ ...hire, intake: String(start_date).slice(0, 7), invite_used: invite_used_at !== null }));
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

export async function redeemInvite(token: string, chatId: number) {
  const at = await now();
  const { data, error } = await createAdminClient()
    .from("people")
    .update({ telegram_chat_id: chatId, invite_used_at: at.toISOString() })
    .eq("invite_token", token)
    .is("invite_used_at", null)
    .gt("invite_expires_at", at.toISOString())
    .neq("state", "left")
    .select(personColumns)
    .maybeSingle<Person>();
  if (error) throw error;
  return data;
}

type IntakeTeam = { team: string; manager_id: string; join_token: string };

export async function joinIntake(token: string, chatId: number) {
  const db = createAdminClient();
  const at = await now();
  const { data: intake, error } = await db
    .from("intakes")
    .select("id, organisation_id, start_date, teams")
    .filter("teams", "cs", JSON.stringify([{ join_token: token }]))
    .gt("expires_at", at.toISOString())
    .maybeSingle<{ id: string; organisation_id: string; start_date: string; teams: IntakeTeam[] }>();
  if (error) throw error;
  const team = intake?.teams.find((row) => row.join_token === token);
  if (!intake || !team) return null;
  const { data: organisation, error: organisationError } = await db
    .from("organisations")
    .select("time_zone")
    .eq("id", intake.organisation_id)
    .single<{ time_zone: string }>();
  if (organisationError) throw organisationError;
  const { data, error: insertError } = await db
    .from("people")
    .insert({
      organisation_id: intake.organisation_id,
      intake_id: intake.id,
      code_name: `Hire ${randomBytes(3).toString("hex").toUpperCase()}`,
      team: team.team,
      manager_id: team.manager_id,
      start_date: intake.start_date,
      joined_on: at.toLocaleDateString("en-CA", { timeZone: organisation.time_zone }),
      language: "en",
      telegram_chat_id: chatId,
      invite_used_at: at.toISOString(),
    })
    .select(personColumns)
    .single<Person>();
  if (insertError) throw insertError;
  return data;
}

export async function teamLinks(organisationId: string) {
  const { data, error } = await createAdminClient()
    .from("intakes")
    .select("label, teams")
    .eq("organisation_id", organisationId)
    .order("start_date", { ascending: false })
    .limit(1)
    .single<{ label: string; teams: IntakeTeam[] }>();
  if (error) throw error;
  const { data: managers, error: managersError } = await createAdminClient()
    .from("managers")
    .select("id, display_name, bind_token, telegram_chat_id, revoked_at")
    .eq("organisation_id", organisationId);
  if (managersError) throw managersError;
  const lead = new Map(managers.map((row) => [row.id, row]));
  return {
    intake: data.label,
    teams: data.teams.map((row) => {
      const manager = lead.get(row.manager_id);
      return {
        team: row.team,
        lead: manager?.display_name ?? "",
        link: joinLink(row.join_token),
        lead_link: manager?.bind_token && !manager.revoked_at ? joinLink(manager.bind_token) : null,
        lead_linked: Boolean(manager?.telegram_chat_id) && !manager?.revoked_at,
      };
    }),
  };
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
  const { data, error } = await createAdminClient()
    .from("people")
    .update({ state: "stopped", stopped_at: at })
    .eq("telegram_chat_id", chatId)
    .neq("state", "stopped")
    .select("id");
  if (error) throw error;
  for (const row of data) await audit("new_hire", "stop", row.id);
}

export async function setLanguage(person: Person, language: Language) {
  const { error } = await createAdminClient().from("people").update({ language }).eq("id", person.id);
  if (error) throw error;
}

export async function recordConsent(person: Person, textVersion: string) {
  const { error } = await createAdminClient().from("consents").insert({
    organisation_id: person.organisation_id,
    person_id: person.id,
    text_version: textVersion,
    granted_at: (await now()).toISOString(),
  });
  if (error) throw error;
  await audit("new_hire", "grant_consent", person.id);
}

export async function passPackTest(organisationId: string, language: string, resultsFile: string) {
  const { data, error } = await createAdminClient()
    .from("language_packs")
    .update({ test_passed_on: (await now()).toISOString().slice(0, 10), test_results_file: resultsFile })
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

export async function upcomingCheckins(organisationId: string, days = 21) {
  const db = createAdminClient();
  const { data: organisation, error: orgError } = await db.from("organisations").select("time_zone, holidays").eq("id", organisationId).single<{ time_zone: string; holidays: string[] }>();
  if (orgError) throw orgError;
  const { data: people, error } = await db
    .from("people")
    .select("start_date, joined_on")
    .eq("organisation_id", organisationId)
    .neq("state", "left")
    .is("stopped_at", null)
    .is("deleted_at", null);
  if (error) throw error;
  const today = (await now()).toLocaleDateString("en-CA", { timeZone: organisation.time_zone });
  const last = new Date(Date.parse(`${today}T00:00:00Z`) + days * 86400000).toISOString().slice(0, 10);
  const working = (start: string, add: number) => {
    const d = new Date(Date.parse(`${start}T00:00:00Z`) + add * 86400000);
    while ([0, 6].includes(d.getUTCDay()) || organisation.holidays.includes(d.toISOString().slice(0, 10))) d.setUTCDate(d.getUTCDate() + 1);
    return d.toISOString().slice(0, 10);
  };
  const due = new Map<string, { date: string; touchpoint: number; people: number }>();
  const touchpoints = allDays(await tracksOf(organisationId));
  for (const { start_date, joined_on } of people) {
    for (const touchpoint of touchpoints) {
      const date = working(joined_on ?? start_date, touchpoint);
      if (date < today || date > last) continue;
      const key = `${date}:${touchpoint}`;
      due.set(key, { date, touchpoint, people: (due.get(key)?.people ?? 0) + 1 });
    }
  }
  return [...due.values()].sort((a, b) => a.date.localeCompare(b.date) || a.touchpoint - b.touchpoint);
}
