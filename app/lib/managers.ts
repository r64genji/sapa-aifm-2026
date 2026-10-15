import { randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { now } from "@/lib/clock";
import { decrypt } from "@/lib/crypto";
import { audit } from "@/lib/signal";
import { createAdminClient } from "@/lib/supabase/admin";

export const MANAGER_TOKEN_PREFIX = "mgr-";

const DRIVERS = ["ROLE_CLARITY", "MANAGER_SUPPORT", "BELONGING", "ONBOARDING_TRAINING", "WORKLOAD"];

export async function managerUser(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer /, "");
  if (!token) return null;
  const db = createAdminClient();
  const { data } = await db.auth.getUser(token);
  const metadata = data.user?.app_metadata;
  if (metadata?.role !== "manager") return null;
  const { data: manager, error } = await db
    .from("managers")
    .select("id")
    .eq("id", metadata.manager_id)
    .eq("organisation_id", metadata.organisation_id)
    .is("revoked_at", null)
    .maybeSingle();
  if (error) throw error;
  if (!manager) return null;
  return { token, managerId: manager.id as string, organisationId: metadata.organisation_id as string, actor: data.user!.id };
}

export async function inviteManager(organisationId: string, actor: string, invite: { display_name: string; email: string }) {
  const db = createAdminClient();
  const bindToken = MANAGER_TOKEN_PREFIX + randomBytes(16).toString("base64url");
  const { data: manager, error } = await db
    .from("managers")
    .insert({ organisation_id: organisationId, display_name: invite.display_name, bind_token: bindToken })
    .select("id")
    .single();
  if (error) throw error;
  const { error: userError } = await db.auth.admin.createUser({
    email: invite.email,
    email_confirm: true,
    app_metadata: { role: "manager", organisation_id: organisationId, manager_id: manager.id },
  });
  if (userError) {
    await db.from("managers").delete().eq("id", manager.id);
    return { error: userError.message };
  }
  const { data: link, error: linkError } = await db.auth.admin.generateLink({ type: "magiclink", email: invite.email });
  if (linkError) throw linkError;
  await audit(actor, "invite_manager", manager.id);
  return {
    manager_id: manager.id as string,
    telegram_link: `https://t.me/${process.env.TELEGRAM_BOT_USERNAME}?start=${bindToken}`,
    sign_in_link: link.properties.action_link,
  };
}

export async function linkHires(organisationId: string, actor: string, managerId: string, codeNames: string[]) {
  const db = createAdminClient();
  const { data: manager, error } = await db
    .from("managers")
    .select("id")
    .eq("organisation_id", organisationId)
    .eq("id", managerId)
    .is("revoked_at", null)
    .maybeSingle();
  if (error) throw error;
  if (!manager) return { error: "Not found", code: 404 };
  const { data, error: updateError } = await db
    .from("people")
    .update({ manager_id: managerId })
    .eq("organisation_id", organisationId)
    .in("code_name", codeNames)
    .select("id");
  if (updateError) throw updateError;
  await audit(actor, "link_hires", managerId);
  return { linked: data.length };
}

export async function revokeManager(organisationId: string, actor: string, managerId: string) {
  const { data, error } = await createAdminClient()
    .from("managers")
    .update({ revoked_at: (await now()).toISOString(), telegram_chat_id: null, bind_token: null })
    .eq("organisation_id", organisationId)
    .eq("id", managerId)
    .is("revoked_at", null)
    .select("id");
  if (error) throw error;
  if (data.length === 0) return { error: "Not found", code: 404 };
  await audit(actor, "revoke_manager", managerId);
  return { revoked: true };
}

export async function bindManager(token: string, chatId: number) {
  const { data, error } = await createAdminClient()
    .from("managers")
    .update({ telegram_chat_id: chatId, bind_token: null })
    .eq("bind_token", token)
    .is("revoked_at", null)
    .select("id");
  if (error) throw error;
  return data.length === 1;
}

export async function managerSnapshots(accessToken: string) {
  const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    auth: { persistSession: false },
    global: { headers: { authorization: `Bearer ${accessToken}` } },
  });
  const { data, error } = await client.from("manager_snapshots").select("team, week, respondents, suppressed, drivers").order("team");
  if (error) throw error;
  return data.map((row) =>
    row.suppressed
      ? { team: row.team, week: row.week, enough: false, message: "Not enough people yet" }
      : {
          team: row.team,
          week: row.week,
          enough: true,
          respondents: row.respondents,
          drivers: Object.fromEntries(DRIVERS.map((driver) => [driver, row.drivers[driver] ?? "fewer than 3"])),
        },
  );
}

export async function sharedReplies(managerId: string, actor: string) {
  const db = createAdminClient();
  const { data, error } = await db
    .from("responses")
    .select("id, created_at, text_encrypted, ai_tags!inner(escalate), people!inner(code_name, manager_id, consents!inner(scope, withdrawn_at))")
    .eq("kind", "checkin")
    .not("ai_tags.escalate", "is", true)
    .eq("people.manager_id", managerId)
    .eq("people.consents.scope", "share_with_manager")
    .is("people.consents.withdrawn_at", null)
    .not("text_encrypted", "is", null)
    .neq("kind", "exit")
    .order("created_at");
  if (error) throw error;
  const visible = data as unknown as { id: string; created_at: string; text_encrypted: string; people: { code_name: string } }[];
  for (const row of visible) await audit(actor, "manager_read_reply_text", row.id);
  return visible.map((row) => ({
    id: row.id,
    author: row.people.code_name,
    text: decrypt(row.text_encrypted),
    created_at: row.created_at,
  }));
}
