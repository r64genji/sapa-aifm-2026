import { counts, DRIVERS, themeCards, type Counts } from "@/lib/themes";
import { now } from "@/lib/clock";
import { createAdminClient } from "@/lib/supabase/admin";

export { DRIVERS };

const WEEKS = 5;

const share = (c: Counts, driver: string) =>
  c.enough
    ? { enough: true, n: c.drivers![driver]?.n ?? 0, m: c.respondents, reviewed: c.drivers![driver]?.reviewed ?? 0, ai_confident: c.drivers![driver]?.ai_confident ?? 0, score_only: c.drivers![driver]?.score_only ?? 0 }
    : { enough: false, have: c.respondents, need: c.min_group_size };

export function themeTeam(request: Request) {
  const teams = new URL(request.url).searchParams.getAll("team");
  if (teams.length > 1 || teams.some((team) => team.includes(","))) return { error: "One team at a time" };
  return { team: teams[0] ?? null };
}

export async function themeDetail(organisationId: string, driver: string, touchpoint: number, team: string | null) {
  const db = createAdminClient();
  const [people, schedule, snapshots, cards] = await Promise.all([
    db.from("people").select("role, start_date").eq("organisation_id", organisationId),
    db.from("checkin_schedule").select("touchpoint").eq("organisation_id", organisationId),
    db
      .from("theme_snapshots")
      .select("week, team, respondents, suppressed, counts")
      .eq("organisation_id", organisationId)
      .eq("touchpoint", touchpoint)
      .match(team === null ? {} : { team })
      .order("week", { ascending: false }),
    themeCards(organisationId, touchpoint, null, null, team),
  ]);
  for (const result of [people, schedule, snapshots]) if (result.error) throw result.error;
  const base = await counts(organisationId, touchpoint, null, null, team);
  const found = cards.cards.find((candidate) => candidate.driver === driver)!;
  const card = base.enough ? found : { ...found, have: base.respondents, need: base.min_group_size };
  const minimum = base.min_group_size;

  const weeks = [...new Set(snapshots.data!.map((row) => row.week as string))].slice(0, WEEKS).sort();
  const weekly = weeks.map((week) => {
    const rows = snapshots.data!.filter((row) => row.week === week && !row.suppressed);
    const m = rows.reduce((sum, row) => sum + row.respondents, 0);
    if (m < minimum) return { week, enough: false, have: m, need: minimum };
    return { week, enough: true, n: rows.reduce((sum, row) => sum + (row.counts?.[driver]?.n ?? 0), 0), m };
  });

  const touchpoints = [...new Set(schedule.data!.map((row) => row.touchpoint as number))].sort((a, b) => a - b);
  const intakes = team ? [] : [...new Set(people.data!.map((row) => String(row.start_date).slice(0, 7)))].sort();
  const roles = team ? [] : [...new Set(people.data!.map((row) => row.role as string))].sort();
  const [days, byIntake, byRole, byExperience] = await Promise.all([
    Promise.all(touchpoints.map(async (day) => ({ day, c: await counts(organisationId, day, null, null, team) }))),
    Promise.all(intakes.map(async (intake) => ({ intake, c: await counts(organisationId, touchpoint, `${intake}-01`, null, team) }))),
    Promise.all(roles.map(async (role) => ({ role, c: await counts(organisationId, touchpoint, null, null, team, role) }))),
    team ? [] : Promise.all([true, false].map(async (firstJob) => ({ group: firstJob ? "First job" : "Experienced", c: await counts(organisationId, touchpoint, null, null, team, null, firstJob) }))),
  ]);

  return {
    touchpoint,
    driver,
    team,
    as_of: (await now()).toISOString(),
    card,
    weekly,
    by_day: days.map(({ day, c }) => ({ touchpoint: day, ...share(c, driver) })),
    by_intake: byIntake.filter(({ c }) => c.respondents > 0).map(({ intake, c }) => ({ intake, ...share(c, driver) })),
    by_role: byRole.filter(({ c }) => c.respondents > 0).map(({ role, c }) => ({ role, ...share(c, driver) })),
    by_experience: byExperience.filter(({ c }) => c.respondents > 0).map(({ group, c }) => ({ group, ...share(c, driver) })),
  };
}
