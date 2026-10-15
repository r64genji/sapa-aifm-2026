import { now } from "@/lib/clock";
import { milestoneShare } from "@/lib/milestones";
import { libraryWithEvidence, members, pooled, type Resolvable, scoreOf } from "@/lib/resolution";
import { audit } from "@/lib/signal";
import { createAdminClient } from "@/lib/supabase/admin";
import { themeCards } from "@/lib/themes";

const POOL = 30;
const TREND = "This shows a trend, not proof that Sapa caused it";
const DAY_MS = 86400000;

export async function saveBaseline(organisationId: string, actor: string, kept: number, of: number) {
  const { error } = await createAdminClient()
    .from("organisations")
    .update({ retention_baseline_kept: kept, retention_baseline_of: of })
    .eq("id", organisationId);
  if (error) throw error;
  await audit(actor, "change_setting", "retention_baseline");
}

export async function saveOutcome(
  organisationId: string,
  actor: string,
  input: { intake: string; agency: string | null; hired: number; employed: number },
) {
  const at = await now();
  const [year, month] = input.intake.split("-").map(Number);
  if (at < new Date(Date.UTC(year, month + 6, 1))) return { error: "This intake has not passed Month 6 yet", code: 409 };
  const db = createAdminClient();
  const lookup = db.from("intake_outcomes").select("id").eq("organisation_id", organisationId).eq("intake", input.intake);
  const { data: existing, error } = await (input.agency ? lookup.eq("agency", input.agency) : lookup.is("agency", null)).maybeSingle();
  if (error) throw error;
  const figures = { hired: input.hired, employed: input.employed, entered_by: actor, entered_at: at.toISOString() };
  const { error: writeError } = existing
    ? await db.from("intake_outcomes").update(figures).eq("id", existing.id)
    : await db.from("intake_outcomes").insert({ organisation_id: organisationId, intake: input.intake, agency: input.agency, ...figures });
  if (writeError) throw writeError;
  await audit(actor, "enter_intake_outcome", `${input.intake}${input.agency ? `/${input.agency}` : ""}`);
  return { saved: true };
}

const median = (values: number[]) => {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = sorted.length >> 1;
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};

export async function retention(organisationId: string, agency: string | null = null) {
  const db = createAdminClient();
  const { data: org, error } = await db
    .from("organisations")
    .select("retention_baseline_kept, retention_baseline_of")
    .eq("id", organisationId)
    .single();
  if (error) throw error;
  const query = db.from("intake_outcomes").select("hired, employed").eq("organisation_id", organisationId);
  const { data: outcomes, error: outcomesError } = await (agency ? query.eq("agency", agency) : query);
  if (outcomesError) throw outcomesError;
  const n = outcomes.reduce((sum, row) => sum + row.hired, 0);
  const k = outcomes.reduce((sum, row) => sum + row.employed, 0);
  const against =
    agency || org.retention_baseline_of === null
      ? ""
      : `, against a usual ${org.retention_baseline_kept} of ${org.retention_baseline_of}`;
  return n >= POOL
    ? { enough: true, k, n, text: `${k} of ${n} still employed at Month 6${against}`, note: TREND }
    : { enough: false, message: `Too few to tell yet (${n} of ${POOL})`, note: TREND };
}

export async function impact(organisationId: string) {
  const db = createAdminClient();
  const at = await now();
  const { data: org, error } = await db
    .from("organisations")
    .select("min_group_size")
    .eq("id", organisationId)
    .single();
  if (error) throw error;
  const { data: sent, error: sentError } = await db
    .from("checkin_schedule")
    .select("person_id, status, people!inner(start_date)")
    .eq("organisation_id", organisationId)
    .in("status", ["sent", "reminded", "answered", "skipped"]);
  if (sentError) throw sentError;
  const { data: done, error: doneError } = await db
    .from("actions")
    .select("*, responses!actions_source_response_id_fkey(created_at, people(start_date))")
    .eq("organisation_id", organisationId)
    .eq("status", "done")
    .eq("hiring_side", false)
    .not("scope_type", "is", null);
  if (doneError) throw doneError;
  type Score = Awaited<ReturnType<typeof scoreOf>>;
  const groups = new Map<string, { people: Set<string>; sent: number; answered: number; days: number[]; scores: Score[] }>();
  const group = (intake: string) => {
    if (!groups.has(intake)) groups.set(intake, { people: new Set(), sent: 0, answered: 0, days: [], scores: [] });
    return groups.get(intake)!;
  };
  for (const row of sent as unknown as { person_id: string; status: string; people: { start_date: string } }[]) {
    const entry = group(row.people.start_date.slice(0, 7));
    entry.people.add(row.person_id);
    entry.sent += 1;
    if (row.status === "answered") entry.answered += 1;
  }
  for (const row of done as unknown as (Resolvable & {
    created_at: string;
    responses: { created_at: string; people: { start_date: string } } | null;
  })[]) {
    const reply = row.responses?.people ? row.responses : null;
    const started = reply?.created_at ?? row.created_at;
    const days = (new Date(row.done_at!).getTime() - new Date(started).getTime()) / DAY_MS;
    const score = await scoreOf(row);
    const intakeMonths = reply
      ? [reply.people.start_date.slice(0, 7)]
      : [...new Set((await members(row, false)).map((person) => person.start_date.slice(0, 7)))];
    for (const intake of intakeMonths) {
      const entry = group(intake);
      entry.days.push(days);
      entry.scores.push(score);
    }
  }
  const intakes = [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([intake, entry]) =>
      entry.people.size < org.min_group_size
        ? { intake, enough: false, message: "Not enough people yet" }
        : {
            intake,
            enough: true,
            response_rate: Math.round((entry.answered / entry.sent) * 100) / 100,
            median_days_reply_to_done: entry.days.length ? Math.round(median(entry.days) * 10) / 10 : null,
            score_change_against_others: (() => {
              const { difference } = pooled(entry.scores);
              return difference === null ? null : Math.round(difference * 10) / 10;
            })(),
          },
    );

  const fixes = (await libraryWithEvidence(organisationId))
    .filter((entry) => entry.difference !== null)
    .slice(0, 3)
    .map(({ id, driver, title, difference, evidence }) => ({ id, driver, title, difference, evidence }));

  const { data: exits, error: exitError } = await db
    .from("responses")
    .select("question_id")
    .eq("organisation_id", organisationId)
    .eq("kind", "exit")
    .like("question_id", "exit.%")
    .gte("created_at", new Date(at.getTime() - 365 * DAY_MS).toISOString());
  if (exitError) throw exitError;
  const reasons = new Map<string, number>();
  for (const row of exits) {
    const driver = row.question_id.slice("exit.".length);
    reasons.set(driver, (reasons.get(driver) ?? 0) + 1);
  }
  const leavers =
    exits.length < org.min_group_size
      ? { enough: false, message: `Not enough answers yet (${exits.length} of ${org.min_group_size} needed)` }
      : {
          enough: true,
          total: exits.length,
          top_reasons: [...reasons.entries()].sort((a, b) => b[1] - a[1]).map(([driver, count]) => ({ driver, n: count })),
          top_themes: (await themeCards(organisationId, 14, null)).cards
            .flatMap((card) => ("n" in card ? [{ driver: card.driver, n: card.n, m: card.m }] : []))
            .sort((a, b) => b.n - a.n),
        };

  return { retention: await retention(organisationId), intakes, fixes, fixes_note: TREND, milestones: await milestoneShare(organisationId), leavers };
}
