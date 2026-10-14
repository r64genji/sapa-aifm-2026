import { createTelegramAdapter } from "@chat-adapter/telegram";
import { createMemoryState } from "@chat-adapter/state-memory";
import { Chat } from "chat";
import en from "@/data/packs/en.json";

export const bot = new Chat({
  userName: process.env.TELEGRAM_BOT_USERNAME!,
  adapters: { telegram: createTelegramAdapter({ mode: "webhook" }) },
  state: createMemoryState(),
});

bot.onSlashCommand("/start", async (event) => {
  await event.channel.post(en.start);
});
