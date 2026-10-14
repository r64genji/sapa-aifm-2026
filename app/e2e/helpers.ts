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

export function update(name: string) {
  return readFileSync(new URL(`updates/${name}.json`, import.meta.url), "utf8");
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
