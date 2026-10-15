import { now } from "@/lib/clock";
import { packs } from "@/lib/packs";
import { createAdminClient } from "@/lib/supabase/admin";

const text = packs.en.action;
const ENOUGH = 5;

type Side = { n: number; before: number; after: number };
type Score = { scope: Side; other: Side };

export type Resolvable = {
  id: string;
  organisation_id: string;
  driver: string;
  scope_type: "person" | "team" | "intake" | null;
  scope_person_id: string | null;
  scope_team: string | null;
  scope_intake: string | null;
  notes: Record<string, string> | null;
  done_at: string | null;
  score_change: Score | null;
};

const fill = (template: string, values: Record<string, string | number>) =>
  Object.entries(values).reduce((out, [key, value]) => out.replaceAll(`{${key}}`, String(value)), template);
const label = (driver: string) => {
  const name = text.drivers[driver as keyof typeof text.drivers];
  return name[0].toUpperCase() + name.slice(1);
};
const signed = (value: number) => `${value < 0 ? "-" : "+"}${Math.abs(value).toFixed(1)}`;
const change = (side: Side) => side.after - side.before;

export async function members(action: Resolvable, eligible: boolean) {
  const db = createAdminClient();
  let query = db.from("people").select("id, language").eq("organisation_id", action.organisation_id);
  if (action.scope_type === "person") query = query.eq("id", action.scope_person_id!);
  if (action.scope_type === "team") query = query.eq("team", action.scope_team!);
  if (action.scope_type === "intake") {
    const next = new Date(Date.parse(action.scope_intake!) + 31 * 86400000).toISOString().slice(0, 7) + "-01";
    query = query.gte("start_date", action.scope_intake!).lt("start_date", next);
  }
  if (eligible) query = query.eq("state", "active").eq("synthetic", false).not("telegram_chat_id", "is", null);
  const { data, error } = await query;
  if (error) throw error;
  if (!eligible) return data;
  const { data: consents, error: consentError } = await db
    .from("consents")
    .select("person_id")
    .in("person_id", data.map((person) => person.id))
    .is("withdrawn_at", null);
  if (consentError) throw consentError;
  const consenting = new Set(consents.map((row) => row.person_id));
  return data.filter((person) => consenting.has(person.id));
}

export async function queueResolution(action: Resolvable) {
  const db = createAdminClient();
  const people = await members(action, true);
  if (people.length === 0) return;
  const at = (await now()).toISOString();
  if (action.notes) {
    const { error } = await db.from("notices").upsert(
      people.map((person) => ({
        organisation_id: action.organisation_id,
        action_id: action.id,
        person_id: person.id,
        language: person.language,
        queued_at: at,
      })),
      { onConflict: "action_id,person_id", ignoreDuplicates: true },
    );
    if (error) throw error;
  }
  const { error } = await db.rpc("recheck_queue", {
    action: action.id,
    drv: action.driver,
    people_ids: people.map((person) => person.id),
  });
  if (error) throw error;
}

const side = (pairs: { before: number; after: number }[]): Side => ({
  n: pairs.length,
  before: pairs.reduce((sum, pair) => sum + pair.before, 0) / (pairs.length || 1),
  after: pairs.reduce((sum, pair) => sum + pair.after, 0) / (pairs.length || 1),
});

async function liveScore(action: Resolvable): Promise<Score> {
  const { data, error } = await createAdminClient()
    .from("responses")
    .select("person_id, scale_value, created_at, action_id")
    .eq("organisation_id", action.organisation_id)
    .eq("question_id", action.driver)
    .not("scale_value", "is", null)
    .order("created_at");
  if (error) throw error;
  const doneAt = Date.parse(action.done_at!);
  const inScope = new Set((await members(action, false)).map((person) => person.id));
  const byPerson = new Map<string, typeof data>();
  for (const row of data) byPerson.set(row.person_id, [...(byPerson.get(row.person_id) ?? []), row]);
  const scope: { before: number; after: number }[] = [];
  const other: { before: number; after: number }[] = [];
  let end = -Infinity;
  for (const rows of byPerson.values()) {
    const answer = rows.find((row) => row.action_id === action.id);
    const earlier = rows.filter((row) => Date.parse(row.created_at) < doneAt).at(-1);
    if (!answer || !earlier) continue;
    scope.push({ before: earlier.scale_value, after: answer.scale_value });
    end = Math.max(end, Date.parse(answer.created_at));
  }
  if (scope.length === 0) end = Infinity;
  for (const [person, rows] of byPerson) {
    if (inScope.has(person) || rows.some((row) => row.action_id === action.id)) continue;
    const earlier = rows.filter((row) => Date.parse(row.created_at) < doneAt).at(-1);
    const later = rows.find((row) => Date.parse(row.created_at) >= doneAt && Date.parse(row.created_at) <= end);
    if (earlier && later) other.push({ before: earlier.scale_value, after: later.scale_value });
  }
  return { scope: side(scope), other: side(other) };
}

export const scoreOf = (action: Resolvable) => action.score_change ?? liveScore(action);

async function scopeLabel(action: Resolvable) {
  const db = createAdminClient();
  if (action.scope_type === "intake") {
    const month = new Date(action.scope_intake!).toLocaleString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });
    return `${month} intake`;
  }
  if (action.scope_type === "person") {
    const { data, error } = await db.from("people").select("code_name").eq("id", action.scope_person_id!).single();
    if (error) throw error;
    return data.code_name as string;
  }
  const { data, error } = await db
    .from("people")
    .select("manager_id, managers(display_name)")
    .eq("organisation_id", action.organisation_id)
    .eq("team", action.scope_team!);
  if (error) throw error;
  const names = [...new Set(data.map((row) => (row.managers as unknown as { display_name: string } | null)?.display_name))];
  return names.length === 1 && names[0] ? `${names[0]}'s team` : `${action.scope_team} team`;
}

export async function scoreCard(action: Resolvable) {
  const score = await scoreOf(action);
  const headline =
    score.scope.n < ENOUGH
      ? `${text.notEnoughAnswers} ${fill(text.ofFive, { n: score.scope.n })}`
      : score.other.n < ENOUGH
        ? `${text.notEnoughComparison} ${fill(text.ofFive, { n: score.other.n })}`
        : fill(text.scoreHeadline, {
            driver: label(action.driver),
            scope: await scopeLabel(action),
            change: signed(change(score.scope)),
            other: signed(change(score.other)),
          });
  const detail =
    score.scope.n < ENOUGH
      ? null
      : fill(text.scoreDetail, {
          before: score.scope.before.toFixed(1),
          after: score.scope.after.toFixed(1),
          n: score.scope.n,
        });
  return { headline, detail, note: text.scoreNote };
}

export async function libraryWithEvidence(organisationId: string, driver?: string) {
  const db = createAdminClient();
  let query = db
    .from("action_library")
    .select("id, driver, title, text, created_by")
    .eq("organisation_id", organisationId)
    .is("deleted_at", null);
  if (driver) query = query.eq("driver", driver);
  const { data: entries, error } = await query;
  if (error) throw error;
  const { data: done, error: doneError } = await db
    .from("actions")
    .select("*")
    .eq("organisation_id", organisationId)
    .eq("status", "done")
    .not("library_entry_id", "is", null);
  if (doneError) throw doneError;
  const ranked = await Promise.all(
    entries.map(async (entry) => {
      const used = done.filter((action) => action.library_entry_id === entry.id);
      const scores = await Promise.all(used.map((action) => scoreOf(action as Resolvable)));
      const total = (pick: (score: Score) => Side) => {
        const n = scores.reduce((sum, score) => sum + pick(score).n, 0);
        const moved = scores.reduce((sum, score) => sum + pick(score).n * change(pick(score)), 0);
        return { n, change: moved / (n || 1) };
      };
      const scope = total((score) => score.scope);
      const other = total((score) => score.other);
      const difference = scope.n >= ENOUGH && other.n >= ENOUGH ? scope.change - other.change : null;
      const verdict =
        scope.n < ENOUGH
          ? text.notEnoughEvidence
          : difference === null
            ? text.notEnoughComparison
            : fill(text.evidenceRise, {
                driver: label(entry.driver),
                diff: Math.abs(difference).toFixed(1),
                direction: difference < 0 ? "less" : "more",
                n: scope.n,
              });
      const evidence =
        used.length === 0
          ? text.notEnoughEvidence
          : `${fill(text.evidenceUsed, { times: `${used.length} ${used.length === 1 ? "time" : "times"}` })} ${verdict}`;
      const times = `${used.length} ${used.length === 1 ? "time" : "times"}`;
      const result =
        used.length === 0
          ? entry.created_by
            ? "New · no result yet"
            : "Not used here yet"
          : difference === null
            ? `Used ${times} here · no result yet`
            : `Used ${times} here. ${signed(difference)} vs other teams, ${scope.n} people`;
      const { created_by, ...shown } = entry;
      return { ...shown, custom: created_by !== null, used: used.length, difference, evidence, result };
    }),
  );
  return ranked.sort(
    (a, b) => (b.difference ?? -Infinity) - (a.difference ?? -Infinity) || a.id.localeCompare(b.id),
  );
}
