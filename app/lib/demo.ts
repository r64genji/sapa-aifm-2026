import { now } from "@/lib/clock";
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

export async function demoStatus(organisationId: string) {
  const db = createAdminClient();
  const { data: org, error } = await db
    .from("organisations")
    .select("demo_mode, demo_offset_days, time_zone")
    .eq("id", organisationId)
    .single();
  if (error) throw error;
  if (!org.demo_mode) return { error: "Demo mode is off" };
  const { data: live, error: liveError } = await db
    .from("people")
    .select("id, start_date, telegram_chat_id, managers(telegram_chat_id, revoked_at)")
    .eq("organisation_id", organisationId)
    .eq("synthetic", false)
    .order("start_date")
    .limit(1)
    .single();
  if (liveError) throw liveError;
  const { data: next, error: nextError } = await db
    .from("checkin_schedule")
    .select("touchpoint, due_at")
    .eq("person_id", live.id)
    .eq("status", "scheduled")
    .order("due_at")
    .limit(1);
  if (nextError) throw nextError;
  const { data: spend, error: spendError } = await db.from("ai_usage").select("cost").eq("provider", "deepseek");
  if (spendError) throw spendError;
  const today = Date.parse((await now()).toLocaleDateString("en-CA", { timeZone: org.time_zone }));
  const manager = live.managers as unknown as { telegram_chat_id: number | null; revoked_at: string | null } | null;
  const [ai, tg] = await Promise.all([models(), telegram()]);
  return {
    live_hire: {
      day: Math.round((today - Date.parse(live.start_date)) / 86400000) + org.demo_offset_days,
      next_check_in: next[0]
        ? { touchpoint: next[0].touchpoint, due_at: next[0].due_at }
        : null,
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
      live_hire_bound: live.telegram_chat_id !== null,
      demo_manager_bound: Boolean(manager?.telegram_chat_id) && !manager?.revoked_at,
    },
  };
}
