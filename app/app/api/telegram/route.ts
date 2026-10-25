import { after } from "next/server";
import { bot } from "@/lib/bot";
import { now } from "@/lib/clock";
import { personByChat } from "@/lib/directory";
import { savePhone } from "@/lib/escalations";
import { packs } from "@/lib/packs";
import { matchesSecret } from "@/lib/secret";
import { send } from "@/lib/telegram";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  if (process.env.SAPA_TEST !== "1" || !request.headers.has("x-sapa-test-wait")) return handle(request, after);
  const tasks: Promise<unknown>[] = [];
  const response = await handle(request, (task) => tasks.push(typeof task === "function" ? task() : task));
  await Promise.allSettled(tasks);
  return response;
}

async function handle(request: Request, defer: (task: Promise<unknown> | (() => Promise<unknown>)) => void) {
  if (
    !matchesSecret(
      request.headers.get("x-telegram-bot-api-secret-token"),
      process.env.TELEGRAM_WEBHOOK_SECRET_TOKEN,
    )
  ) {
    return new Response("Unauthorized", { status: 401 });
  }
  void bot.initialize();
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
  const message = update.message;
  if (message?.contact) {
    if (message.contact.user_id === message.from?.id) {
      defer(async () => {
        for (const reply of await savePhone(message.chat.id, message.contact.phone_number)) await send(message.chat.id, reply);
      });
    }
    return new Response("OK");
  }
  if (message && message.text === undefined) {
    defer(async () => {
      const person = await personByChat(message.chat.id);
      if (person && ["declined", "stopped", "left", "deleted"].includes(person.state)) return;
      await send(message.chat.id, { text: packs[person?.language ?? "en"].typeInstead });
    });
    return new Response("OK");
  }
  return bot.webhooks.telegram(
    new Request(request.url, {
      method: "POST",
      headers: request.headers,
      body: JSON.stringify(update),
    }),
    { waitUntil: defer },
  );
}
