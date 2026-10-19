import { randomBytes } from "node:crypto";
import organisations from "@/data/seed/organisations.json";
import language_packs from "@/data/seed/language_packs.json";
import managers from "@/data/seed/managers.json";
import intakes from "@/data/seed/intakes.json";
import people from "@/data/seed/people.json";
import consents from "@/data/seed/consents.json";
import checkin_schedule from "@/data/seed/checkin_schedule.json";
import responses from "@/data/seed/responses.json";
import ai_tags from "@/data/seed/ai_tags.json";
import quality_holds from "@/data/seed/quality_holds.json";
import spot_checks from "@/data/seed/spot_checks.json";
import intake_outcomes from "@/data/seed/intake_outcomes.json";
import handbook_pages from "@/data/seed/handbook_pages.json";
import question_groups from "@/data/seed/question_groups.json";
import asked_questions from "@/data/seed/asked_questions.json";
import theme_snapshots from "@/data/seed/theme_snapshots.json";
import team_towers from "@/data/seed/team_towers.json";
import tower_snapshots from "@/data/seed/tower_snapshots.json";
import action_library from "@/data/seed/action_library.json";
import actions from "@/data/seed/actions.json";
import users from "@/data/seed/users.json";
import escalations from "@/data/seed/escalations.json";
import milestone_nudges from "@/data/seed/milestone_nudges.json";
import demo_history from "@/data/seed/demo_history.json";
import fix_follow_up from "@/data/seed/fix_follow_up.json";
import demo_open_fixes from "@/data/seed/demo_open_fixes.json";
import { encrypt } from "@/lib/crypto";
import { joinLink } from "@/lib/directory";
import { MANAGER_TOKEN_PREFIX } from "@/lib/managers";
import { createAdminClient } from "@/lib/supabase/admin";

async function seedUsers() {
  const admin = createAdminClient().auth.admin;
  const password = process.env.SEED_USER_PASSWORD!;
  const { data, error } = await admin.listUsers({ perPage: 1000 });
  if (error) throw error;
  for (const { email, app_metadata, agency } of users) {
    const existing = data.users.find((user) => user.email === email);
    const { data: saved, error } = existing
      ? await admin.updateUserById(existing.id, { app_metadata })
      : await admin.createUser({ email, password, email_confirm: true, app_metadata });
    if (error) throw error;
    if (agency) {
      const { error: grantError } = await createAdminClient().from("agency_grants").upsert({
        user_id: saved.user.id,
        organisation_id: app_metadata.organisation_id,
        agency,
        granted_by: "seed",
        granted_at: "2026-10-01T01:00:00Z",
      });
      if (grantError) throw grantError;
    }
  }
}

const DAY_MS = 86400000;

function liveDates(timeZone: string) {
  if (process.env.SAPA_TEST === "1") return {};
  const start = new Date(Date.now() - 13 * DAY_MS).toLocaleDateString("en-CA", { timeZone });
  return { start_date: start, expires_at: new Date(Date.parse(start) + 26 * DAY_MS).toISOString() };
}

const RAJ = "6f1c2a3e-0000-4000-8000-000000000101";
const JOB_SCOPE = "6f1c2a3e-0000-4000-8000-000000000501";

function demoActions() {
  if (process.env.SAPA_TEST === "1") return actions;
  const owned = actions.map((a) =>
    a.id === JOB_SCOPE ? { ...a, owner_type: "manager", owner_manager_id: RAJ, outcome_note: "Gave each new hire the written job scope and went through it at the Monday huddle." } : a,
  );
  const shift = Math.round((Date.now() - Date.parse("2026-10-19T00:00:00Z")) / DAY_MS) * DAY_MS;
  const open = demo_open_fixes.map((a) =>
    Object.fromEntries(
      Object.entries(a).map(([key, value]) =>
        key.endsWith("_at") ? [key, new Date(Date.parse(value as string) + shift).toISOString()] : key.endsWith("_on") ? [key, new Date(Date.parse(value as string) + shift).toISOString().slice(0, 10)] : [key, value],
      ),
    ),
  );
  return [...owned, ...demo_history, ...open];
}

const UNSURE = ["6f1c2a3e-0000-4000-8000-000000040021", "6f1c2a3e-0000-4000-8000-000000040056", "6f1c2a3e-0000-4000-8000-000000040287"];
const HELD_TAG = "6f1c2a3e-0000-4000-8000-000000040070";

function demoTags() {
  if (process.env.SAPA_TEST === "1") return ai_tags;
  return ai_tags.map((t) =>
    UNSURE.includes(t.id) ? { ...t, status: "needs_review", confidence: "low", uncertain: true } : t.id === HELD_TAG ? { ...t, counted: false } : t,
  );
}

function demoHolds() {
  if (process.env.SAPA_TEST === "1") return quality_holds;
  return quality_holds.map((h) =>
    h.driver === "MANAGER_SUPPORT" && h.language === "ms" ? { ...h, state: "held", reason: "HR changed 3 of 12 spot checks, more than 20%" } : h,
  );
}

async function seedNotices() {
  if (process.env.SAPA_TEST === "1") return;
  const done = demoActions() as { id: string; organisation_id: string; status: string; notes?: object; scope_type: string; scope_team?: string; scope_intake?: string; done_at: string }[];
  const rows = done
    .filter((a) => a.status === "done" && a.notes)
    .flatMap((a) =>
      people
        .filter((p) => p.start_date <= a.done_at && (a.scope_type === "team" ? p.team === a.scope_team : p.start_date.slice(0, 7) === a.scope_intake?.slice(0, 7)))
        .map((p) => ({ organisation_id: a.organisation_id, action_id: a.id, person_id: p.id, language: p.language, queued_at: a.done_at, sent_at: a.done_at })),
    );
  const { error } = await createAdminClient().from("notices").insert(rows);
  if (error) throw error;
}

async function seedSpotChecks() {
  if (process.env.SAPA_TEST === "1") return;
  const rows = spot_checks.flatMap((check) =>
    Array.from({ length: check.done }, (_, i) => ({
      organisation_id: check.organisation_id,
      driver: check.driver,
      language: check.language,
      at: new Date(Date.now() - ((i * 3) % 28) * DAY_MS - DAY_MS).toISOString(),
      changed: i < check.changed,
    })),
  );
  const { error } = await createAdminClient().from("spot_checks").insert(rows);
  if (error) throw error;
}

async function seedFixFollowUp() {
  if (process.env.SAPA_TEST === "1") return;
  const db = createAdminClient();
  const replies = fix_follow_up.responses.map(({ text, ...row }) => (text ? { ...row, text_encrypted: encrypt(text) } : row));
  for (const [table, rows] of [["checkin_schedule", fix_follow_up.checkin_schedule], ["responses", replies], ["ai_tags", fix_follow_up.ai_tags]] as [string, object[]][]) {
    const { error } = await db.from(table).insert(rows);
    if (error) throw error;
  }
}

function passedPacks() {
  if (process.env.SAPA_TEST === "1") return language_packs;
  const results = { test_passed_on: "2026-10-15", test_results_file: "eval/results/2026-10-15T21-54-14-063Z-gemini-classify-test.json" };
  return language_packs.map((pack) => (pack.language === "zh" ? pack : { ...pack, ...results }));
}

export async function resetDemo() {
  const db = createAdminClient();
  const { data: live, error: modeError } = await db.from("organisations").select("id").eq("demo_mode", false).limit(1);
  if (modeError) throw modeError;
  if (live.length > 0) return { error: "Demo mode is off", code: 409 };
  const liveStart = liveDates(organisations[0].time_zone);
  const teams = intakes[0].teams.map((row) => ({ ...row, join_token: randomBytes(16).toString("base64url") }));
  const intake = { ...intakes[0], ...liveStart, teams };
  const replies = responses.map(({ text, ...row }) => (text ? { ...row, text_encrypted: encrypt(text) } : row));
  const leads = process.env.SAPA_TEST === "1" ? managers : managers.map((row) => ({ ...row, bind_token: MANAGER_TOKEN_PREFIX + randomBytes(16).toString("base64url") }));
  const cases = escalations.map(({ phone, ...row }) => ({ ...row, contact_phone_encrypted: phone ? encrypt(phone) : null }));
  const { error } = await db.rpc("reset_demo", {
    seed: { organisations, language_packs: passedPacks(), managers: leads, intakes: [intake], people, consents, checkin_schedule, responses: replies, ai_tags: demoTags(), escalations: cases, quality_holds: demoHolds(), handbook_pages, question_groups, asked_questions, theme_snapshots, team_towers, tower_snapshots, action_library, actions: demoActions(), intake_outcomes, milestone_nudges },
  });
  if (error) throw error;
  await seedSpotChecks();
  await seedFixFollowUp();
  await seedNotices();
  await seedUsers();
  const { data: lead } = await db.from("managers").select("id, display_name");
  const names = new Map(lead!.map((row) => [row.id, row.display_name]));
  return { team_links: teams.map((row) => ({ team: row.team, lead: names.get(row.manager_id) ?? "", link: joinLink(row.join_token) })) };
}
