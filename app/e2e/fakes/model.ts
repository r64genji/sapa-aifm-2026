import { createServer } from "node:http";

type Script =
  | { kind: "json"; content: unknown; usage?: { prompt_tokens: number; completion_tokens: number } }
  | { kind: "text"; content: string; usage?: { prompt_tokens: number; completion_tokens: number } }
  | { kind: "error"; status: number }
  | { kind: "timeout" };

type Call = { provider: string; body: Record<string, unknown> };

const calls: Call[] = [];
const scripts: Record<string, Script[]> = {};

createServer(async (req, res) => {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString();
  res.setHeader("content-type", "application/json");
  if (req.url === "/calls") {
    if (req.method === "DELETE") {
      calls.length = 0;
      for (const key of Object.keys(scripts)) delete scripts[key];
    }
    res.end(JSON.stringify(calls));
    return;
  }
  const provider = req.url?.split("/")[1] ?? "";
  if (req.url === `/${provider}/script`) {
    scripts[provider] = JSON.parse(raw);
    res.end("{}");
    return;
  }
  const body = JSON.parse(raw);
  calls.push({ provider, body });
  const script = scripts[provider]?.shift() ?? { kind: "error", status: 503 };
  if (script.kind === "timeout") return;
  if (script.kind === "error") {
    res.statusCode = script.status;
    res.end(JSON.stringify({ error: { message: "scripted failure" } }));
    return;
  }
  const content = script.kind === "json" ? JSON.stringify(script.content) : script.content;
  res.end(
    JSON.stringify({
      id: `chatcmpl-${calls.length}`,
      object: "chat.completion",
      created: Math.floor(Date.now() / 1000),
      model: body.model,
      choices: [{ index: 0, message: { role: "assistant", content }, finish_reason: "stop" }],
      usage: script.usage ?? { prompt_tokens: 100, completion_tokens: 50, total_tokens: 150 },
    }),
  );
}).listen(Number(process.env.FAKE_MODEL_PORT), "127.0.0.1");
