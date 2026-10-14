import { now } from "@/lib/clock";
import { createAdminClient } from "@/lib/supabase/admin";

export async function signal(organisationId: string, scope: "cohort" | "queue" | "action") {
  const { error } = await createAdminClient()
    .from("change_signals")
    .insert({ organisation_id: organisationId, scope, at: (await now()).toISOString() });
  if (error) throw error;
}

export async function audit(actor: string, action: string, target: string) {
  const { error } = await createAdminClient()
    .from("audit_log")
    .insert({ actor, action, target, at: (await now()).toISOString() });
  if (error) throw error;
}
