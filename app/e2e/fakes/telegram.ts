import { createServer } from "node:http";

type Call = { method: string; body: Record<string, unknown> };

const calls: Call[] = [];
let messageId = 0;

function result(method: string, body: Record<string, unknown>) {
  if (method === "getMe") {
    return { id: 1000000001, is_bot: true, first_name: "Sapa", username: process.env.TELEGRAM_BOT_USERNAME };
  }
  if (method === "sendMessage") {
    messageId += 1;
    return {
      message_id: messageId,
      date: Math.floor(Date.now() / 1000),
      chat: { id: body.chat_id, type: "private" },
      text: body.text,
    };
  }
  return true;
}

createServer(async (req, res) => {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString();
  res.setHeader("content-type", "application/json");
  if (req.url === "/calls") {
    if (req.method === "DELETE") calls.length = 0;
    res.end(JSON.stringify(calls));
    return;
  }
  const method = req.url?.split("/").pop() ?? "";
  const body = raw ? JSON.parse(raw) : {};
  calls.push({ method, body });
  res.end(JSON.stringify({ ok: true, result: result(method, body) }));
}).listen(Number(process.env.FAKE_TELEGRAM_PORT), "127.0.0.1");
