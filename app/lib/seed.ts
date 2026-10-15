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
import { createAdminClient } from "@/lib/supabase/admin";

async function seedUsers() {
  const admin = createAdminClient().auth.admin;
  const password = process.env.SEED_USER_PASSWORD!;
  const { data, error } = await admin.listUsers({ perPage: 1000 });
  if (error) throw error;
  for (const { email, app_metadata, agency } of users) {
    const existing = data.users.find((user) => user.email === email);
    const { data: saved, error } = existing
      ? await admin.updateUserById(existing.id, { password, app_metadata })
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

export async function resetDemo() {
  const { error } = await createAdminClient().rpc("reset_demo", {
    seed: { organisations, language_packs, managers, people, consents, checkin_schedule, responses, ai_tags, quality_holds, handbook_pages, question_groups, asked_questions, theme_snapshots, action_library, actions, intake_outcomes },
  });
  if (error) throw error;
  await seedUsers();
}
