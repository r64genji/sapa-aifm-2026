import { stopPerson } from "@/lib/directory";
import type { Reply } from "@/lib/engine";

export async function send(chatId: number, reply: Reply) {
  const base = process.env.TELEGRAM_API_BASE_URL ?? "https://api.telegram.org";
  const keys = (reply.buttons ?? []).map((b) => ({ text: b.label, callback_data: `chat:${JSON.stringify({ a: b.id, v: b.value })}` }));
  const res = await fetch(`${base}/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: reply.text,
      ...(reply.phone && {
        reply_markup: { keyboard: [[{ text: reply.phone, request_contact: true }]], one_time_keyboard: true, resize_keyboard: true },
      }),
      ...(reply.buttons && {
        reply_markup: {
          inline_keyboard: reply.buttons.every((b) => b.id === "ans") ? keys.map((key) => [key]) : [keys],
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

export async function typing(chatId: number) {
  const base = process.env.TELEGRAM_API_BASE_URL ?? "https://api.telegram.org";
  await fetch(`${base}/bot${process.env.TELEGRAM_BOT_TOKEN}/sendChatAction`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, action: "typing" }),
  }).catch(() => {});
}
