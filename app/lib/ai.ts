import { now } from "@/lib/clock";
import { createAdminClient } from "@/lib/supabase/admin";

const TIMEOUT_MS = process.env.SAPA_TEST === "1" ? 2000 : 8000;
const FALLBACK_CAP = 1.5;

type CallType = "classify" | "answer" | "draft" | "translate" | "group";

export const providers = (schema: object, medium: boolean) => [
  {
    name: "gemini" as const,
    url: `${process.env.OMNIROUTE_BASE_URL}/chat/completions`,
    key: process.env.OMNIROUTE_API_KEY!,
    model: (medium ? process.env.GEMINI_MODEL_ID_MEDIUM : process.env.GEMINI_MODEL_ID)!,
    price: { input: 0.75, output: 3.75 },
    extra: { response_format: { type: "json_schema", json_schema: { name: "output", strict: true, schema } } },
  },
  {
    name: "deepseek" as const,
    url: `${process.env.DEEPSEEK_BASE_URL ?? "https://api.deepseek.com"}/chat/completions`,
    key: process.env.DEEPSEEK_API_KEY!,
    model: process.env.DEEPSEEK_MODEL_ID!,
    price: { input: 0.3, output: 1.2 },
    extra: { response_format: { type: "json_object" }, thinking: { type: "disabled" } },
  },
];

export async function fallbackSpend() {
  const { data, error } = await createAdminClient()
    .from("ai_usage")
    .select("cost")
    .eq("provider", "deepseek");
  if (error) throw error;
  return data.reduce((sum, row) => sum + Number(row.cost), 0);
}

export async function request(provider: ReturnType<typeof providers>[number], system: string, user: string) {
  const started = Date.now();
  let content: string | null = null;
  let usage = { prompt_tokens: 0, completion_tokens: 0, prompt_tokens_details: { cached_tokens: 0 } };
  try {
    const res = await fetch(provider.url, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${provider.key}` },
      body: JSON.stringify({
        model: provider.model,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        ...provider.extra,
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (res.ok) {
      const body = await res.json();
      content = body.choices?.[0]?.message?.content ?? null;
      usage = { ...usage, ...body.usage };
    }
  } catch {
    content = null;
  }
  const input = usage.prompt_tokens;
  const cost = (input * provider.price.input + usage.completion_tokens * provider.price.output) / 1e6;
  return {
    content,
    input,
    cached: usage.prompt_tokens_details?.cached_tokens ?? 0,
    output: usage.completion_tokens,
    cost,
    latencyMs: Date.now() - started,
  };
}

export async function complete(
  organisationId: string,
  callType: CallType,
  system: string,
  user: string,
  schema: object,
) {
  for (const provider of providers(schema, callType === "draft" || callType === "group")) {
    if (provider.name === "deepseek" && (await fallbackSpend()) > FALLBACK_CAP) continue;
    const { content, input, cached, output, cost, latencyMs } = await request(provider, system, user);
    const { error } = await createAdminClient()
      .from("ai_usage")
      .insert({
        organisation_id: organisationId,
        provider: provider.name,
        model: provider.model,
        call_type: callType,
        input_tokens: input,
        cached_input_tokens: cached,
        output_tokens: output,
        cost,
        ok: content !== null,
        at: (await now()).toISOString(),
      });
    if (error) throw error;
    if (content !== null) return { content, model: provider.model, latencyMs };
  }
  return null;
}
