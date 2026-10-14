import { Tag, tagReply } from "@/lib/classify";
import { now } from "@/lib/clock";
import { decrypt } from "@/lib/crypto";
import { audit, signal } from "@/lib/signal";
import { createAdminClient } from "@/lib/supabase/admin";

export async function readReplies(organisationId: string, actor: string) {
  const db = createAdminClient();
  const { data, error } = await db
    .from("responses")
    .select("id, question_id, text_encrypted, created_at")
    .eq("organisation_id", organisationId)
    .not("text_encrypted", "is", null)
    .order("created_at");
  if (error) throw error;
  const at = (await now()).toISOString();
  const { error: auditError } = await db
    .from("audit_log")
    .insert(data.map((row) => ({ actor, action: "read_reply_text", target: row.id, at })));
  if (auditError) throw auditError;
  return data.map((row) => ({
    id: row.id,
    question_id: row.question_id,
    text: decrypt(row.text_encrypted!),
    created_at: row.created_at,
  }));
}

export async function retryReply(organisationId: string, responseId: string) {
  const db = createAdminClient();
  const { data, error } = await db
    .from("responses")
    .select("text_encrypted")
    .eq("organisation_id", organisationId)
    .eq("id", responseId)
    .maybeSingle();
  if (error) throw error;
  if (!data?.text_encrypted) return { error: "Not found", code: 404 };
  const { data: tag, error: tagError } = await db
    .from("ai_tags")
    .select("status")
    .eq("response_id", responseId)
    .maybeSingle();
  if (tagError) throw tagError;
  if (tag?.status !== "awaiting_ai" && tag?.status !== "needs_review") {
    return { error: "Nothing to retry", code: 409 };
  }
  return { status: (await tagReply(organisationId, responseId, decrypt(data.text_encrypted))).status };
}

const waiting = "New labels wait for HR during calibration";

export async function readQueue(organisationId: string, actor: string) {
  const db = createAdminClient();
  const { data, error } = await db
    .from("ai_tags")
    .select(
      "response_id, status, drivers, context_tags, concern_level, escalate, escalate_category, evidence_quote, summary, confidence, counted, created_at, responses!inner(text_encrypted)",
    )
    .eq("organisation_id", organisationId)
    .or(
      "escalate.eq.true,concern_level.eq.needs_follow_up,status.in.(awaiting_ai,needs_review),and(status.eq.ok,counted.eq.false)",
    )
    .order("escalate", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  const rows = data as unknown as ((typeof data)[number] & { responses: { text_encrypted: string | null } })[];
  for (const row of rows) {
    if (row.responses.text_encrypted) await audit(actor, "read_reply_text", row.response_id);
  }
  return rows.map(({ responses, counted, response_id, ...row }) => ({
    id: response_id,
    ...row,
    text: responses.text_encrypted ? decrypt(responses.text_encrypted) : null,
    note: row.status === "ok" && !counted ? waiting : null,
  }));
}

async function ownTag(organisationId: string, responseId: string) {
  const { data, error } = await createAdminClient()
    .from("ai_tags")
    .select("status")
    .eq("organisation_id", organisationId)
    .eq("response_id", responseId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function reviewReply(
  organisationId: string,
  actor: string,
  responseId: string,
  change: { drivers?: Tag["drivers"]; context_tags?: Tag["context_tags"] },
) {
  const tag = await ownTag(organisationId, responseId);
  if (!tag) return { error: "Not found", code: 404 };
  if (tag.status === "awaiting_ai") return { error: "Nothing to review", code: 409 };
  const at = (await now()).toISOString();
  const { error } = await createAdminClient()
    .from("ai_tags")
    .update({ ...change, status: "reviewed", reviewed_by: actor, reviewed_at: at })
    .eq("response_id", responseId);
  if (error) throw error;
  await audit(actor, change.drivers || change.context_tags ? "change_tag" : "confirm_tag", responseId);
  await signal(organisationId, "cohort");
  await signal(organisationId, "queue");
  return { status: "reviewed" };
}

export async function setFollowUp(organisationId: string, actor: string, responseId: string, value: boolean) {
  if (!(await ownTag(organisationId, responseId))) return { error: "Not found", code: 404 };
  const { error } = await createAdminClient()
    .from("ai_tags")
    .update({ concern_level: value ? "needs_follow_up" : "none" })
    .eq("response_id", responseId);
  if (error) throw error;
  await audit(actor, value ? "set_follow_up" : "clear_follow_up", responseId);
  await signal(organisationId, "queue");
  return { follow_up: value };
}
