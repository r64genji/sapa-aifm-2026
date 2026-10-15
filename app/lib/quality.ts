import { now } from "@/lib/clock";
import { createAdminClient } from "@/lib/supabase/admin";

const WINDOW_DAYS = 30;

export async function queueSpotChecks() {
  const { data, error } = await createAdminClient().rpc("queue_spot_checks", { at: (await now()).toISOString() });
  if (error) throw error;
  return data as number;
}

export async function setHoldNewTags(organisationId: string, value: boolean) {
  const { error } = await createAdminClient()
    .from("organisations")
    .update({ hold_new_tags: value })
    .eq("id", organisationId);
  if (error) throw error;
}

type Entry = {
  driver: string;
  language: string;
  state: string | null;
  reason: string | null;
  spot_checks: number;
  changed: number;
  challenges: number;
};

export async function qualityPanel(organisationId: string) {
  const db = createAdminClient();
  const since = new Date((await now()).getTime() - WINDOW_DAYS * 86400000).toISOString();
  const [checks, challenges, holds] = await Promise.all([
    db.from("spot_checks").select("driver, language, changed").eq("organisation_id", organisationId).gte("at", since),
    db
      .from("ai_tags")
      .select("drivers, responses!inner(language)")
      .eq("organisation_id", organisationId)
      .gte("challenged_at", since),
    db.from("quality_holds").select("driver, language, state, reason").eq("organisation_id", organisationId),
  ]);
  for (const result of [checks, challenges, holds]) if (result.error) throw result.error;
  const rows = new Map<string, Entry>();
  const row = (driver: string, language: string) => {
    const key = `${driver}|${language}`;
    if (!rows.has(key)) rows.set(key, { driver, language, state: null, reason: null, spot_checks: 0, changed: 0, challenges: 0 });
    return rows.get(key)!;
  };
  for (const hold of holds.data!) Object.assign(row(hold.driver, hold.language), { state: hold.state, reason: hold.reason });
  for (const check of checks.data!) {
    const entry = row(check.driver, check.language);
    entry.spot_checks += 1;
    if (check.changed) entry.changed += 1;
  }
  for (const tag of challenges.data as unknown as { drivers: string[]; responses: { language: string } }[]) {
    for (const driver of tag.drivers) row(driver, tag.responses.language).challenges += 1;
  }
  return [...rows.values()]
    .sort((a, b) => a.driver.localeCompare(b.driver) || a.language.localeCompare(b.language))
    .map((entry) => ({ ...entry, changed_share: entry.spot_checks ? entry.changed / entry.spot_checks : null }));
}
