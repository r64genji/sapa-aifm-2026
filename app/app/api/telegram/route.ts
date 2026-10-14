import { after } from "next/server";
import { bot } from "@/lib/bot";
import { now } from "@/lib/clock";
import { matchesSecret } from "@/lib/secret";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  if (
    !matchesSecret(
      request.headers.get("x-telegram-bot-api-secret-token"),
      process.env.TELEGRAM_WEBHOOK_SECRET_TOKEN,
    )
  ) {
    return new Response("Unauthorized", { status: 401 });
  }
  const { update_id, ...update } = await request.json();
  const { data, error } = await createAdminClient()
    .from("inbound_updates")
    .upsert(
      {
        platform: "telegram",
        update_id,
        received_at: (await now()).toISOString(),
      },
      { onConflict: "platform,update_id", ignoreDuplicates: true },
    )
    .select();
  if (error) throw error;
  if (data.length === 0) return new Response("OK");
  return bot.webhooks.telegram(
    new Request(request.url, {
      method: "POST",
      headers: request.headers,
      body: JSON.stringify(update),
    }),
    { waitUntil: (task) => after(() => task) },
  );
}
