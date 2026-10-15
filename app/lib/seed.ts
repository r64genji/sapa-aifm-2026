import { randomBytes } from "node:crypto";
import organisations from "@/data/seed/organisations.json";
import language_packs from "@/data/seed/language_packs.json";
import managers from "@/data/seed/managers.json";
import people from "@/data/seed/people.json";
import consents from "@/data/seed/consents.json";
import checkin_schedule from "@/data/seed/checkin_schedule.json";
import responses from "@/data/seed/responses.json";
import ai_tags from "@/data/seed/ai_tags.json";
import quality_holds from "@/data/seed/quality_holds.json";
import intake_outcomes from "@/data/seed/intake_outcomes.json";
import handbook_pages from "@/data/seed/handbook_pages.json";
import question_groups from "@/data/seed/question_groups.json";
import asked_questions from "@/data/seed/asked_questions.json";
import theme_snapshots from "@/data/seed/theme_snapshots.json";
import action_library from "@/data/seed/action_library.json";
import actions from "@/data/seed/actions.json";
import users from "@/data/seed/users.json";
import escalations from "@/data/seed/escalations.json";
import milestone_nudges from "@/data/seed/milestone_nudges.json";
import { encrypt } from "@/lib/crypto";
import { inviteLink } from "@/lib/directory";
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
  return { start_date: start, invite_expires_at: new Date(Date.parse(start) + 26 * DAY_MS).toISOString() };
}

export async function resetDemo() {
  const db = createAdminClient();
  const { data: live, error: modeError } = await db.from("organisations").select("id").eq("demo_mode", false).limit(1);
  if (modeError) throw modeError;
  if (live.length > 0) return { error: "Demo mode is off", code: 409 };
  const liveStart = liveDates(organisations[0].time_zone);
  const invited = people.map((person) =>
    person.synthetic || person.invite_used_at
      ? person
      : { ...person, ...liveStart, invite_token: randomBytes(16).toString("base64url") },
  );
  const replies = responses.map(({ text, ...row }) => (text ? { ...row, text_encrypted: encrypt(text) } : row));
  const { error } = await db.rpc("reset_demo", {
    seed: { organisations, language_packs, managers, people: invited, consents, checkin_schedule, responses: replies, ai_tags, escalations, quality_holds, handbook_pages, question_groups, asked_questions, theme_snapshots, action_library, actions, intake_outcomes, milestone_nudges },
  });
  if (error) throw error;
  await seedUsers();
  return {
    invites: invited
      .filter((person) => person.invite_token && !person.invite_used_at)
      .map((person) => ({ code_name: person.code_name, invite_link: inviteLink(person.invite_token!) })),
  };
}
