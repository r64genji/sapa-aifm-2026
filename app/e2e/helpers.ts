import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

export const appUrl = process.env.APP_URL!;
export const telegramUrl = process.env.TELEGRAM_API_BASE_URL!;

export const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
  { auth: { persistSession: false } },
);

export async function resetDemo() {
  const res = await fetch(`${appUrl}/api/demo/reset`, {
    method: "POST",
    headers: { authorization: `Bearer ${process.env.DISPATCH_SECRET}` },
  });
  if (!res.ok) throw new Error(`demo reset failed: ${res.status}`);
  await fetch(`${telegramUrl}/calls`, { method: "DELETE" });
}

export async function freezeClock(iso: string) {
  const { error } = await db.from("test_clock").upsert({ id: true, now: iso });
  if (error) throw error;
}

let updateId = 731450100;

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

export async function hrToken() {
  const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { auth: { persistSession: false } },
  );
  const { data, error } = await client.auth.signInWithPassword({
    email: "hr@contoh.test",
    password: process.env.SEED_USER_PASSWORD!,
  });
  if (error) throw error;
  return data.session.access_token;
}

export async function addHire(fields: Record<string, string>) {
  const res = await fetch(`${appUrl}/api/hr/hires`, {
    method: "POST",
    headers: { authorization: `Bearer ${await hrToken()}`, "content-type": "application/json" },
    body: JSON.stringify({
      code_name: "New hire",
      team: "Production",
      manager_id: "6f1c2a3e-0000-4000-8000-000000000101",
      start_date: "2026-10-14",
      role: "Production operator",
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
