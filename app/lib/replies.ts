import { tagReply } from "@/lib/classify";
import { now } from "@/lib/clock";
import { decrypt } from "@/lib/crypto";
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
