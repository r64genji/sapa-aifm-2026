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
