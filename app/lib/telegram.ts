import { stopPerson } from "@/lib/directory";
import type { Reply } from "@/lib/engine";

export async function send(chatId: number, reply: Reply) {
  const base = process.env.TELEGRAM_API_BASE_URL ?? "https://api.telegram.org";
  const res = await fetch(`${base}/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: reply.text,
      ...(reply.buttons && {
        reply_markup: {
          inline_keyboard: [
            reply.buttons.map((b) => ({
              text: b.label,
              callback_data: `chat:${JSON.stringify({ a: b.id, v: b.value })}`,
            })),
          ],
        },
      }),
    }),
  });
  if (res.status === 403) {
    await stopPerson(chatId);
    return false;
  }
  if (!res.ok) throw new Error(`sendMessage failed: ${res.status}`);
  return true;
}
