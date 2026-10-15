import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

export const appUrl = process.env.APP_URL!;
export const telegramUrl = process.env.TELEGRAM_API_BASE_URL!;

export const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
  { auth: { persistSession: false } },
);

export let liveInvite = "";

export async function resetSeed() {
  await db.from("organisations").update({ demo_mode: true }).neq("id", "00000000-0000-0000-0000-000000000000");
  const res = await fetch(`${appUrl}/api/demo/reset`, {
    method: "POST",
    headers: { authorization: `Bearer ${process.env.DEMO_RESET_SECRET}` },
  });
  if (!res.ok) throw new Error(`demo reset failed: ${res.status}`);
  await db.from("ai_usage").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  const { invites } = await res.json();
  liveInvite = String(invites.find((invite: { code_name: string }) => invite.code_name === "Live hire").invite_link).split("?start=")[1];
  await fetch(`${telegramUrl}/calls`, { method: "DELETE" });
  await fetch(`${modelUrl}/calls`, { method: "DELETE" });
}

export async function resetDemo() {
  await resetSeed();
  await db.from("language_packs").update({ test_passed_on: "2026-10-15" }).in("language", ["en", "ms"]);
}

export const modelUrl = `http://127.0.0.1:${process.env.FAKE_MODEL_PORT}`;

type ModelScript = { kind: "json"; content: unknown } | { kind: "text"; content: string } | { kind: "error"; status: number } | { kind: "timeout" };

export async function scriptModel(provider: "omniroute" | "deepseek", scripts: ModelScript[]) {
  await fetch(`${modelUrl}/${provider}/script`, { method: "POST", body: JSON.stringify(scripts) });
}

export async function modelCalls(provider: "omniroute" | "deepseek") {
  const res = await fetch(`${modelUrl}/calls`);
  const calls: { provider: string; body: { messages: { content: string }[] } }[] = await res.json();
  return calls.filter((call) => call.provider === provider);
}

export const classifierTag = (fields: Record<string, unknown> = {}) => ({
  drivers: ["ROLE_CLARITY"],
  context_tags: [],
  positive: false,
  concern_level: "needs_follow_up",
  escalate: false,
  escalate_category: "none",
  evidence_quote: "tak tahu mana nak buat dulu",
  summary: "The employee does not know which task to do first.",
  confidence: "high",
  uncertain: false,
  probe_id: "none",
  ...fields,
});

export async function freezeClock(iso: string) {
  const { error } = await db.from("test_clock").upsert({ id: true, now: iso });
  if (error) throw error;
}

let updateId = Date.now();

export function update(name: string, vars: Record<string, string | number> = {}) {
  updateId += 1;
  const all = { update_id: updateId, ...vars };
  return Object.entries(all).reduce(
    (text, [key, value]) => text.replaceAll(`"{{${key}}}"`, JSON.stringify(value)).replaceAll(`{{${key}}}`, String(value)),
    readFileSync(new URL(`updates/${name}.json`, import.meta.url), "utf8"),
  );
}

export function postUpdate(body: string) {
  return fetch(`${appUrl}/api/telegram`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-telegram-bot-api-secret-token": process.env.TELEGRAM_WEBHOOK_SECRET_TOKEN!,
    },
    body,
  });
}

export async function telegramCalls(method: string) {
  const res = await fetch(`${telegramUrl}/calls`);
  const calls: { method: string; body: Record<string, unknown> }[] = await res.json();
  return calls.filter((call) => call.method === method).map((call) => call.body);
}

export async function settle(ms = 1500) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

export async function blockChat(chatId: number) {
  await fetch(`${telegramUrl}/block/${chatId}`, { method: "POST" });
}

export async function failChat(chatId: number) {
  await fetch(`${telegramUrl}/fail/${chatId}`, { method: "POST" });
}

export async function hrToken(email = "hr@contoh.test") {
  const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { auth: { persistSession: false } },
  );
  const { data, error } = await client.auth.signInWithPassword({
    email,
    password: process.env.SEED_USER_PASSWORD!,
  });
  if (error) throw error;
  return data.session.access_token;
}

export async function sessionClient(email: string) {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    auth: { persistSession: false },
    global: { headers: { authorization: `Bearer ${await hrToken(email)}` } },
  });
}

export async function addHire(fields: Record<string, string>) {
  const res = await fetch(`${appUrl}/api/hr/hires`, {
    method: "POST",
    headers: { authorization: `Bearer ${await hrToken()}`, "content-type": "application/json" },
    body: JSON.stringify({
      code_name: "New hire",
      team: "Accounts Payable Asia",
      manager_id: "6f1c2a3e-0000-4000-8000-000000000101",
      start_date: "2026-10-14",
      role: "Accounts payable analyst",
      language: "en",
      ...fields,
    }),
  });
  const body = await res.json();
  return { status: res.status, token: String(body.invite_link).split("?start=")[1] };
}

export async function link(chatId: number, token: string) {
  await postUpdate(update("start-link", { chat_id: chatId, token }));
  await settle(800);
}

export async function say(chatId: number, text: string) {
  const command = text.startsWith("/");
  await postUpdate(
    command
      ? update("command", { chat_id: chatId, text, length: text.split(" ")[0].length })
      : update("text", { chat_id: chatId, text }),
  );
  await settle(800);
}

export async function sentTo(chatId: number) {
  return (await telegramCalls("sendMessage"))
    .filter((m) => String(m.chat_id) === String(chatId))
    .map((m) =>
      m.parse_mode === "MarkdownV2" ? { ...m, text: String(m.text).replace(/\\(.)/g, "$1") } : m,
    );
}

export async function tap(chatId: number, label: string) {
  const buttons = (await sentTo(chatId))
    .flatMap((m) => (m.reply_markup as { inline_keyboard: { text: string; callback_data: string }[][] } | undefined)?.inline_keyboard.flat() ?? []);
  const button = buttons.findLast((b) => b.text === label);
  if (!button) throw new Error(`no button "${label}" was shown`);
  await tapData(chatId, button.callback_data);
}

export async function tapData(chatId: number, data: string) {
  await postUpdate(update("button", { chat_id: chatId, data: data }));
  await settle(800);
}

export async function dispatch() {
  return fetch(`${appUrl}/api/dispatch`, {
    method: "POST",
    headers: { authorization: `Bearer ${process.env.DISPATCH_SECRET}` },
  });
}

export async function hrRequest(path: string, method: string, body?: Record<string, unknown>) {
  return fetch(`${appUrl}${path}`, {
    method,
    headers: { authorization: `Bearer ${await hrToken()}`, "content-type": "application/json" },
    body: body && JSON.stringify(body),
  });
}

export async function joined(chat: number, startDate: string) {
  const { token } = await addHire({ code_name: `Hire ${chat}`, start_date: startDate });
  await link(chat, token);
  await tap(chat, "English");
  await tap(chat, "I agree");
}
