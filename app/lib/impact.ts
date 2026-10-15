import { now } from "@/lib/clock";
import { milestoneShare, milestoneSteps } from "@/lib/milestones";
import { packs } from "@/lib/packs";
import { libraryWithEvidence } from "@/lib/resolution";
import { audit } from "@/lib/signal";
import { createAdminClient } from "@/lib/supabase/admin";
import { themeCards } from "@/lib/themes";

const POOL = 30;
const TREND = "This shows a trend, not proof that Sapa caused it";
const DAY_MS = 86400000;
const TARGET = 85;
const WORKED = 0.5;

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
    .select("min_group_size, retention_baseline_kept, retention_baseline_of")
    .eq("id", organisationId)
    .single();
  if (error) throw error;
  const { data: sent, error: sentError } = await db
    .from("checkin_schedule")
    .select("person_id, touchpoint, status, people!inner(start_date)")
    .eq("organisation_id", organisationId)
    .in("status", ["sent", "reminded", "answered"]);
  if (sentError) throw sentError;
  const { data: done, error: doneError } = await db
    .from("actions")
    .select("done_at, responses!actions_source_response_id_fkey(created_at, people(start_date))")
    .eq("organisation_id", organisationId)
    .eq("status", "done")
    .not("source_response_id", "is", null);
  if (doneError) throw doneError;
  const { data: outcomes, error: outcomesError } = await db
    .from("intake_outcomes")
    .select("intake, hired, employed")
    .eq("organisation_id", organisationId);
  if (outcomesError) throw outcomesError;
  const kept = new Map<string, { hired: number; employed: number }>();
  for (const row of outcomes) {
    const entry = kept.get(row.intake) ?? { hired: 0, employed: 0 };
    kept.set(row.intake, { hired: entry.hired + row.hired, employed: entry.employed + row.employed });
  }
  const groups = new Map<string, { people: Set<string>; sent: number; answered: number; days: number[] }>();
  const group = (intake: string) => {
    if (!groups.has(intake)) groups.set(intake, { people: new Set(), sent: 0, answered: 0, days: [] });
    return groups.get(intake)!;
  };
  const day14 = { sent: 0, answered: 0 };
  for (const row of sent as unknown as { person_id: string; touchpoint: number; status: string; people: { start_date: string } }[]) {
    if (row.touchpoint === 14) {
      day14.sent += 1;
      if (row.status === "answered") day14.answered += 1;
    }
    const entry = group(row.people.start_date.slice(0, 7));
    entry.people.add(row.person_id);
    entry.sent += 1;
    if (row.status === "answered") entry.answered += 1;
  }
  for (const row of done as unknown as { done_at: string; responses: { created_at: string; people: { start_date: string } } | null }[]) {
    if (row.responses?.people) {
      group(row.responses.people.start_date.slice(0, 7)).days.push(
        (new Date(row.done_at).getTime() - new Date(row.responses.created_at).getTime()) / DAY_MS,
      );
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
            hired: kept.get(intake)?.hired ?? null,
            employed: kept.get(intake)?.employed ?? null,
            response_rate: Math.round((entry.answered / entry.sent) * 100) / 100,
            median_days_reply_to_done: entry.days.length ? Math.round(median(entry.days) * 10) / 10 : null,
          },
    );

  const timed = intakes.filter((entry) => entry.enough && entry.median_days_reply_to_done !== null);
  const enoughIntakes = new Set(intakes.filter((entry) => entry.enough).map((entry) => entry.intake));
  const allDays = [...groups.entries()].filter(([intake]) => enoughIntakes.has(intake)).flatMap(([, entry]) => entry.days);
  const speed = timed.length
    ? {
        median: Math.round(median(allDays) * 10) / 10,
        first_intake: timed[0].intake,
        change: Math.round((timed[0].median_days_reply_to_done! - timed.at(-1)!.median_days_reply_to_done!) * 10) / 10,
      }
    : null;

  const fixes = (await libraryWithEvidence(organisationId))
    .filter((entry) => entry.used > 0)
    .map(({ id, driver, title, used, difference, evidence, scope, other }) => ({
      id,
      driver,
      title,
      used,
      difference,
      evidence,
      result: difference === null ? "too_early" : difference >= WORKED ? "worked" : "no_clear_change",
      with_fix: { n: scope.n, before: scope.before, after: scope.after },
      others: { n: other.n, before: other.before, after: other.after },
    }));

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

  return {
    retention: await retention(organisationId),
    baseline: org.retention_baseline_of === null ? null : { kept: org.retention_baseline_kept, of: org.retention_baseline_of },
    target: TARGET,
    intakes,
    day14: day14.sent < org.min_group_size ? null : { answered: day14.answered, of: day14.sent },
    speed,
    fixes,
    fixes_note: TREND,
    fixes_line: packs.en.action.scoreNote,
    milestones: await milestoneShare(organisationId),
    milestone_steps: await milestoneSteps(organisationId),
    leavers,
  };
}
