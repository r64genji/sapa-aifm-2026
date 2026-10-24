import { now } from "@/lib/clock";
import { decrypt, encrypt } from "@/lib/crypto";
import type { Person } from "@/lib/directory";
import { createAdminClient } from "@/lib/supabase/admin";

const THRESHOLD = 3;
const DAY_MS = 24 * 3600 * 1000;
const WINDOW_MS = 30 * DAY_MS;
const MEMORY_MS = 10 * 60 * 1000;
const MEMORY_MAX = 6;

export type Outcome = "answered" | "unknown" | "important";
type Group = { id: string; text: string };

export async function groupList(organisationId: string) {
  const { data, error } = await createAdminClient()
    .from("question_groups")
    .select("id, text")
    .eq("organisation_id", organisationId)
    .order("created_at");
  if (error) throw error;
  return data as Group[];
}

export async function memory(person: Person) {
  const since = new Date((await now()).getTime() - MEMORY_MS).toISOString();
  const { data, error } = await createAdminClient()
    .from("asked_questions")
    .select("text_encrypted, answer_encrypted")
    .eq("person_id", person.id)
    .not("text_encrypted", "is", null)
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(MEMORY_MAX);
  if (error) throw error;
  return data.reverse().map((row) => ({
    question: decrypt(row.text_encrypted!),
    answer: row.answer_encrypted ? decrypt(row.answer_encrypted) : null,
  }));
}

async function forwardIfThree(groupId: string, at: Date) {
  const db = createAdminClient();
  const since = new Date(at.getTime() - WINDOW_MS).toISOString();
  const { data, error } = await db
    .from("asked_questions")
    .select("person_id")
    .eq("group_id", groupId)
    .gte("created_at", since);
  if (error) throw error;
  if (new Set(data.map((row) => row.person_id)).size < THRESHOLD) return;
  const { error: updateError } = await db
    .from("question_groups")
    .update({ forwarded_at: at.toISOString() })
    .eq("id", groupId)
    .is("forwarded_at", null);
  if (updateError) throw updateError;
}

export async function recordQuestion(
  person: Person,
  known: Group[],
  row: {
    text: string;
    outcome: Outcome;
    topic?: string;
    cited?: string;
    answer?: string;
    group?: Group;
  },
) {
  const db = createAdminClient();
  const at = await now();
  let groupId: string | null = null;
  if (row.group) {
    groupId = known.find((g) => g.id === row.group!.id)?.id ?? null;
    if (!groupId) {
      const { data, error } = await db
        .from("question_groups")
        .insert({
          organisation_id: person.organisation_id,
          text: row.group.text.trim() || "Other question",
          created_at: at.toISOString(),
        })
        .select("id")
        .single();
      if (error) throw error;
      groupId = data.id as string;
    }
  }
  const { error } = await db.from("asked_questions").insert({
    organisation_id: person.organisation_id,
    person_id: person.id,
    group_id: groupId,
    important_topic: row.topic ?? null,
    text_encrypted: encrypt(row.text),
    answer_encrypted: row.answer ? encrypt(row.answer) : null,
    language: person.language,
    outcome: row.outcome,
    cited_path: row.cited ?? null,
    created_at: at.toISOString(),
  });
  if (error) throw error;
  if (!groupId) return;
  if (row.cited) {
    const { error: pathError } = await db.from("question_groups").update({ handbook_path: row.cited }).eq("id", groupId);
    if (pathError) throw pathError;
  }
  await forwardIfThree(groupId, at);
}

export async function listQuestions(organisationId: string) {
  const db = createAdminClient();
  const since = new Date((await now()).getTime() - WINDOW_MS).toISOString();
  const [{ data: groups, error }, { data: rows, error: rowsError }] = await Promise.all([
    db
      .from("question_groups")
      .select("id, text, forwarded_at, handbook_path")
      .eq("organisation_id", organisationId)
      .order("created_at"),
    db
      .from("asked_questions")
      .select("group_id, person_id, important_topic, outcome")
      .eq("organisation_id", organisationId)
      .gte("created_at", since),
  ]);
  if (error) throw error;
  if (rowsError) throw rowsError;
  const forwarded = new Set(
    groups
      .filter((g) => g.forwarded_at || rows.some((r) => r.group_id === g.id && r.outcome === "unknown"))
      .map((g) => g.id),
  );
  const shown = groups
    .filter((g) => forwarded.has(g.id))
    .map((g) => {
      const mine = rows.filter((r) => r.group_id === g.id);
      return {
        id: g.id,
        text: g.text,
        askers: new Set(mine.map((r) => r.person_id)).size,
        answered: mine.filter((r) => r.outcome === "answered").length,
        unknown: mine.filter((r) => r.outcome === "unknown").length,
        handbook_path: g.handbook_path,
      };
    });
  const others = rows.filter((r) => r.group_id && !forwarded.has(r.group_id)).length;
  const topics = [...new Set(rows.flatMap((r) => (r.important_topic ? [r.important_topic] : [])))]
    .map((topic) => ({
      topic,
      askers: new Set(rows.filter((r) => r.important_topic === topic).map((r) => r.person_id)).size,
    }))
    .filter((t) => t.askers >= THRESHOLD);
  const all = groups
    .filter((g) => rows.some((r) => r.group_id === g.id))
    .map((g) => {
      const askers = new Set(rows.filter((r) => r.group_id === g.id).map((r) => r.person_id)).size;
      return { id: g.id, text: g.text, askers: askers >= THRESHOLD ? askers : null };
    });
  return {
    groups: shown,
    all,
    other: { questions: others, text: `${others} other question${others === 1 ? "" : "s"} from fewer than ${THRESHOLD} people` },
    topics,
  };
}
