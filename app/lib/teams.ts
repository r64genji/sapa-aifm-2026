import { createAdminClient } from "@/lib/supabase/admin";
import { themeCards } from "@/lib/themes";

const MARGIN = 2;

type Snapshot = { respondents: number; suppressed: boolean; counts: Record<string, { n: number; avg?: number | null }> | null };
type Lead = { id: string; name: string };
export type Row = { kind: "team" | "tower"; name: string; teams: string[]; n: number; m: number; avg: number | null; leads: Lead[] };

export async function teamList(organisationId: string, driver: string) {
  const db = createAdminClient();
  const [cards, org, latest] = await Promise.all([
    themeCards(organisationId, 14, null),
    db.from("organisations").select("min_group_size").eq("id", organisationId).single(),
    db.from("theme_snapshots").select("week").eq("organisation_id", organisationId).eq("touchpoint", 14).order("week", { ascending: false }).limit(1),
  ]);
  for (const { error } of [org, latest]) if (error) throw error;
  const card = cards.cards.find((c) => c.driver === driver)!;
  const week = latest.data![0]?.week as string | undefined;
  if (!("n" in card) || !week) return { enough: false as const };
  const [teams, towers, people] = await Promise.all([
    db.from("theme_snapshots").select("team, respondents, suppressed, counts").eq("organisation_id", organisationId).eq("touchpoint", 14).eq("week", week),
    db.from("tower_snapshots").select("tower, teams, respondents, suppressed, counts").eq("organisation_id", organisationId).eq("touchpoint", 14).eq("week", week),
    db.from("people").select("team, manager_id, managers(display_name, revoked_at)").eq("organisation_id", organisationId).not("team", "is", null),
  ]);
  for (const { error } of [teams, towers, people]) if (error) throw error;

  const leads = (names: string[]) => {
    const found = new Map<string, string>();
    for (const p of people.data as unknown as { team: string; manager_id: string | null; managers: { display_name: string; revoked_at: string | null } | null }[]) {
      if (names.includes(p.team) && p.manager_id && p.managers && !p.managers.revoked_at) found.set(p.manager_id, p.managers.display_name);
    }
    return [...found].map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
  };
  const row = (kind: Row["kind"], name: string, names: string[], s: Snapshot): Row => ({ kind, name, teams: names, n: s.counts?.[driver]?.n ?? 0, m: s.respondents, avg: s.counts?.[driver]?.avg ?? null, leads: leads(names) });

  const teamRows = teams.data as (Snapshot & { team: string })[];
  const eligible = teamRows.filter((s) => !s.suppressed).map((s) => row("team", s.team, [s.team], s));
  const pooled = (towers.data as (Snapshot & { tower: string; teams: string[] })[]).filter((s) => !s.suppressed).map((s) => row("tower", s.tower, s.teams, s));
  const rate = card.n / card.m;
  const shown = [...eligible, ...pooled].filter((r) => r.n >= r.m * rate + MARGIN);

  const minimum = org.data!.min_group_size as number;
  const total = teamRows.reduce((sum, s) => sum + s.respondents, 0);
  const outside = () => total - shown.reduce((sum, r) => sum + r.m, 0);
  let safety = 0;
  while (shown.length && outside() > 0 && outside() < minimum) {
    shown.splice(shown.indexOf(shown.reduce((a, b) => (b.m < a.m ? b : a))), 1);
    safety++;
  }
  const inTowers = new Set(pooled.flatMap((r) => r.teams));
  const listedTeams = shown.filter((r) => r.kind === "team").length;
  return {
    enough: true as const,
    week,
    company: { n: card.n, m: card.m, avg: card.avg },
    verdict: shown.length === 0 ? ("none" as const) : listedTeams * 2 > eligible.length ? ("most" as const) : ("some" as const),
    rows: shown.sort((a, b) => a.name.localeCompare(b.name)),
    eligible: eligible.length,
    small: teamRows.filter((s) => s.suppressed && !inTowers.has(s.team)).length,
    safety,
  };
}
