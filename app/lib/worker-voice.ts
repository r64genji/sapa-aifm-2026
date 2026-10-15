import { dueAt } from "@/lib/escalations";
import { audit } from "@/lib/signal";
import { createAdminClient } from "@/lib/supabase/admin";
import { themeCards } from "@/lib/themes";

export async function workerVoiceExport(organisationId: string, actor: string, intake: string) {
  const db = createAdminClient();
  const { data: org, error } = await db
    .from("organisations")
    .select("min_group_size, time_zone")
    .eq("id", organisationId)
    .single();
  if (error) throw error;
  const first = `${intake}-01`;
  const [year, month] = intake.split("-").map(Number);
  const next = new Date(Date.UTC(year, month, 1)).toISOString().slice(0, 10);
  const fewer = (n: number) => (n >= org.min_group_size ? n : `fewer than ${org.min_group_size}`);

  const { cards } = await themeCards(organisationId, 14, first);
  const themes = cards.map((card) =>
    "n" in card ? { driver: card.driver, enough: true, n: card.n, m: card.m } : { driver: card.driver, enough: false, message: card.message },
  );

  const { data: asked, error: askedError } = await db
    .from("asked_questions")
    .select("person_id, question_groups!inner(text), people!inner(start_date)")
    .eq("organisation_id", organisationId)
    .gte("people.start_date", first)
    .lt("people.start_date", next);
  if (askedError) throw askedError;
  const topics = new Map<string, Set<string>>();
  for (const row of asked as unknown as { person_id: string; question_groups: { text: string } }[]) {
    const askers = topics.get(row.question_groups.text) ?? new Set<string>();
    askers.add(row.person_id);
    topics.set(row.question_groups.text, askers);
  }
  const question_topics = [...topics.entries()]
    .filter(([, askers]) => askers.size >= org.min_group_size)
    .map(([topic, askers]) => ({ topic, n: askers.size }))
    .sort((a, b) => b.n - a.n);

  const { data: concerns, error: concernError } = await db
    .from("escalations")
    .select("created_at, acknowledged_at, responses!inner(people!inner(start_date))")
    .eq("organisation_id", organisationId)
    .gte("responses.people.start_date", first)
    .lt("responses.people.start_date", next);
  if (concernError) throw concernError;
  const acknowledged = concerns.filter(
    (row) => row.acknowledged_at && new Date(row.acknowledged_at) <= dueAt(new Date(row.created_at), org.time_zone),
  );

  await audit(actor, "export_worker_voice", intake);
  return {
    intake,
    themes,
    question_topics,
    serious_concerns: {
      received: fewer(concerns.length),
      acknowledged_within_1_working_day: fewer(acknowledged.length),
    },
  };
}
