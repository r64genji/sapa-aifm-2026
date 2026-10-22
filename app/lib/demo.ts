import { providers } from "@/lib/ai";
import { createAdminClient } from "@/lib/supabase/admin";

const AI_CHECK_MS = process.env.SAPA_TEST === "1" ? 1000 : 4000;
const AI_CACHE_MS = 30000;
const FALLBACK_CAP = 1.5;

let cached: { at: number; value: Awaited<ReturnType<typeof checkModels>> } | null = null;

async function ping(provider: ReturnType<typeof providers>[number]) {
  const started = Date.now();
  try {
    const res = await fetch(provider.url, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${provider.key}` },
      body: JSON.stringify({ model: provider.model, messages: [{ role: "user", content: "ping" }], max_tokens: 8 }),
      signal: AbortSignal.timeout(AI_CHECK_MS),
    });
    return { reachable: res.ok, ms: Date.now() - started };
  } catch {
    return { reachable: false, ms: Date.now() - started };
  }
}

async function checkModels() {
  const [main, fallback] = providers({}, false);
  const [mainAi, fallbackAi] = await Promise.all([ping(main), ping(fallback)]);
  return { checked_at: new Date().toISOString(), main: mainAi, fallback: fallbackAi };
}

async function models() {
  if (!cached || Date.now() - cached.at > AI_CACHE_MS) cached = { at: Date.now(), value: await checkModels() };
  return cached.value;
}

async function telegram() {
  const base = process.env.TELEGRAM_API_BASE_URL ?? "https://api.telegram.org";
  let info: { url?: string; pending_update_count?: number; last_error_message?: string; last_error_date?: number } = {};
  let reachable = false;
  try {
    const res = await fetch(`${base}/bot${process.env.TELEGRAM_BOT_TOKEN}/getWebhookInfo`, {
      signal: AbortSignal.timeout(AI_CHECK_MS),
    });
    const body = await res.json();
    reachable = res.ok && body.ok === true;
    if (reachable && typeof body.result === "object") info = body.result;
  } catch {
    reachable = false;
  }
  const { data, error } = await createAdminClient()
    .from("inbound_updates")
    .select("received_at")
    .eq("platform", "telegram")
    .order("received_at", { ascending: false })
    .limit(1);
  if (error) throw error;
  return {
    reachable,
    webhook_set: Boolean(info.url),
    pending_updates: info.pending_update_count ?? 0,
    last_error: info.last_error_message ?? null,
    last_error_at: info.last_error_date ? new Date(info.last_error_date * 1000).toISOString() : null,
    last_update_at: data[0]?.received_at ?? null,
  };
}

export async function demoIntake(organisationId: string) {
  const { data, error } = await createAdminClient()
    .from("intakes")
    .select("id, start_date")
    .eq("organisation_id", organisationId)
    .order("start_date", { ascending: false })
    .limit(1)
    .single();
  if (error) throw error;
  return data;
}

export async function liveHire(organisationId: string) {
  const intake = await demoIntake(organisationId);
  const { data, error } = await createAdminClient()
    .from("people")
    .select("id, language, start_date, joined_on, telegram_chat_id, managers(telegram_chat_id, revoked_at)")
    .eq("intake_id", intake.id)
    .order("invite_used_at")
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function demoStatus(organisationId: string) {
  const db = createAdminClient();
  const { data: org, error } = await db
    .from("organisations")
    .select("demo_mode")
    .eq("id", organisationId)
    .single();
  if (error) throw error;
  if (!org.demo_mode) return { error: "Demo mode is off" };
  const live = await liveHire(organisationId);
  const { data: next, error: nextError } = live
    ? await db
        .from("checkin_schedule")
        .select("touchpoint, due_at")
        .eq("person_id", live.id)
        .eq("status", "scheduled")
        .order("due_at")
    : { data: [], error: null };
  if (nextError) throw nextError;
  const stage = next.find((row) => row.touchpoint >= 14) ?? next[0];
  const { data: spend, error: spendError } = await db.from("ai_usage").select("cost").eq("provider", "deepseek");
  if (spendError) throw spendError;
  const manager = live?.managers as unknown as { telegram_chat_id: number | null; revoked_at: string | null } | null;
  const [ai, tg] = await Promise.all([models(), telegram()]);
  return {
    live_hire: {
      next_check_in: stage
        ? { touchpoint: stage.touchpoint, due_at: stage.due_at }
        : null,
      scheduled: next.map((row) => row.touchpoint),
    },
    main_ai: ai.main,
    fallback_ai: {
      ...ai.fallback,
      spend: Number(spend.reduce((sum, row) => sum + Number(row.cost), 0).toFixed(4)),
      cap: FALLBACK_CAP,
    },
    ai_checked_at: ai.checked_at,
    telegram: tg,
    phones: {
      live_hire_bound: Boolean(live?.telegram_chat_id),
      demo_manager_bound: Boolean(manager?.telegram_chat_id) && !manager?.revoked_at,
    },
  };
}
