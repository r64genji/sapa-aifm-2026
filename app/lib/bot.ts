import { createTelegramAdapter } from "@chat-adapter/telegram";
import { createMemoryState } from "@chat-adapter/state-memory";
import { PermissionError } from "@chat-adapter/shared";
import { Chat, type CardElement } from "chat";
import { stopPerson } from "@/lib/directory";
import { handle, type Input, type Outcome } from "@/lib/engine";
import { send } from "@/lib/telegram";
import { packs } from "@/lib/packs";

export const bot = new Chat({
  userName: process.env.TELEGRAM_BOT_USERNAME!,
  adapters: { telegram: createTelegramAdapter({ mode: "webhook" }) },
  state: createMemoryState(),
  concurrency: "queue",
});

async function setMenu(chatId: number, language: keyof typeof packs) {
  const base = process.env.TELEGRAM_API_BASE_URL ?? "https://api.telegram.org";
  await fetch(`${base}/bot${process.env.TELEGRAM_BOT_TOKEN}/setMyCommands`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      commands: Object.values(packs[language].commands).map(({ name, description }) => ({
        command: name,
        description,
      })),
      scope: { type: "chat", chat_id: chatId },
    }),
  });
}

async function respond(
  post: (message: string | { card: CardElement }) => Promise<unknown>,
  threadId: string,
  input: Input,
) {
  const chatId = Number(threadId.split(":")[1]);
  const outcome: Outcome = await handle(chatId, input);
  try {
    for (const reply of outcome.replies) {
      if (reply.phone) {
        await send(chatId, reply);
        continue;
      }
      await post(
        reply.buttons
          ? {
              card: {
                type: "card",
                children: [
                  { type: "text", content: reply.text },
                  {
                    type: "actions",
                    children: reply.buttons.map((b) => ({ type: "button", ...b })),
                  },
                ],
              },
            }
          : reply.text,
      );
    }
  } catch (error) {
    if (error instanceof PermissionError) return stopPerson(chatId);
    throw error;
  }
  if (outcome.menu) await setMenu(chatId, outcome.menu);
}

bot.onSlashCommand((event) =>
  respond((m) => event.channel.post(m), event.channel.id, {
    kind: "text",
    text: `${event.command} ${event.text}`,
  }),
);

bot.onDirectMessage((thread, message) =>
  respond((m) => thread.post(m), thread.id, { kind: "text", text: message.text }),
);

bot.onAction((event) =>
  respond((m) => event.thread!.post(m), event.threadId, {
    kind: "button",
    id: event.actionId,
    value: event.value ?? "",
  }),
);
