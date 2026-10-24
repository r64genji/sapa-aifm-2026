import { now } from "@/lib/clock";
import { createAdminClient } from "@/lib/supabase/admin";

export const ALL_DAYS = 0;
export const DRIVERS = ["ROLE_CLARITY", "MANAGER_SUPPORT", "BELONGING", "ONBOARDING", "TRAINING", "WORKLOAD"];
const CONTEXT = ["PAY_BENEFITS", "GROWTH", "COMMUTE_LOGISTICS"];

export type Counts = {
  respondents: number;
  min_group_size: number;
  enough: boolean;
  drivers?: Record<string, { n: number; reviewed: number; ai_confident: number; score_only: number; avg: number | null }>;
  context?: Record<string, number>;
};

const running = new Map<string, Promise<Counts>>();

export function counts(
  organisationId: string,
  touchpoint: number,
  month: string | null,
  team: string | null = null,
  role: string | null = null,
  firstJob: boolean | null = null,
) {
  const key = JSON.stringify([organisationId, touchpoint, month, team, role, firstJob]);
  const found = running.get(key);
  if (found) return found;
  const result = fetchCounts(organisationId, touchpoint, month, team, role, firstJob).finally(() => running.delete(key));
  running.set(key, result);
  return result;
}

async function fetchCounts(organisationId: string, touchpoint: number, month: string | null, team: string | null, role: string | null, firstJob: boolean | null) {
  const { data, error } = await createAdminClient().rpc("theme_counts", {
    org: organisationId,
    touch: touchpoint,
    month,
    at: (await now()).toISOString(),
    agency: null,
    team,
    person_role: role,
    first_job: firstJob,
  });
  if (error) throw error;
  return data as Counts;
}

export async function themeCards(organisationId: string, touchpoint: number, month: string | null, team: string | null = null) {
  const c = await counts(organisationId, touchpoint, month, team);
  if (!c.enough) {
    const message = `Not enough people yet (${c.respondents} of ${c.min_group_size} needed)`;
    return {
      touchpoint,
      cards: DRIVERS.map((driver) => ({ driver, enough: false, message })),
      context: CONTEXT.map((theme) => ({ theme, hr_only: true, enough: false, message })),
    };
  }
  const { data: held, error } = await createAdminClient()
    .from("quality_holds")
    .select("driver, language, reason")
    .eq("organisation_id", organisationId)
    .eq("state", "held");
  if (error) throw error;
  return {
    touchpoint,
    cards: DRIVERS.map((driver) => ({
      driver,
      enough: true,
      n: c.drivers![driver]?.n ?? 0,
      m: c.respondents,
      reviewed: c.drivers![driver]?.reviewed ?? 0,
      ai_confident: c.drivers![driver]?.ai_confident ?? 0,
      score_only: c.drivers![driver]?.score_only ?? 0,
      avg: c.drivers![driver]?.avg ?? null,
      ...(held.some((hold) => hold.driver === driver) && {
        held: held.filter((hold) => hold.driver === driver).map(({ language, reason }) => ({ language, reason })),
      }),
    })),
    context: CONTEXT.map((theme) => ({
      theme,
      hr_only: true,
      enough: true,
      n: c.context![theme] ?? 0,
      m: c.respondents,
    })),
  };
}

export async function setMinGroupSize(organisationId: string, size: number) {
  const { error } = await createAdminClient()
    .from("organisations")
    .update({ min_group_size: size })
    .eq("id", organisationId);
  if (error) throw error;
}
