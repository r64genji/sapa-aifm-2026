import { now } from "@/lib/clock";
import { createAdminClient } from "@/lib/supabase/admin";

const TIMEOUT_MS = 8000;
const FALLBACK_CAP = 1.5;

type CallType = "classify" | "answer" | "narrative" | "draft";

const providers = (schema: object) => [
  {
    name: "gemini" as const,
    url: `${process.env.OMNIROUTE_BASE_URL}/chat/completions`,
    key: process.env.OMNIROUTE_API_KEY!,
    model: process.env.GEMINI_MODEL_ID!,
    price: { input: 0.75, output: 3.75 },
    extra: { response_format: { type: "json_schema", json_schema: { name: "output", strict: true, schema } } },
  },
  {
    name: "deepseek" as const,
    url: `${process.env.DEEPSEEK_BASE_URL}/chat/completions`,
    key: process.env.DEEPSEEK_API_KEY!,
    model: process.env.DEEPSEEK_MODEL_ID!,
    price: { input: 0.3, output: 1.2 },
    extra: { response_format: { type: "json_object" }, thinking: { type: "disabled" } },
  },
];

async function fallbackSpend(organisationId: string) {
  const { data, error } = await createAdminClient()
    .from("ai_usage")
    .select("cost")
    .eq("organisation_id", organisationId)
    .eq("provider", "deepseek");
  if (error) throw error;
  return data.reduce((sum, row) => sum + Number(row.cost), 0);
}

export async function complete(
  organisationId: string,
  callType: CallType,
  system: string,
  user: string,
  schema: object,
) {
  for (const provider of providers(schema)) {
    if (provider.name === "deepseek" && (await fallbackSpend(organisationId)) > FALLBACK_CAP) continue;
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
    const cached = usage.prompt_tokens_details?.cached_tokens ?? 0;
    const { error } = await createAdminClient()
      .from("ai_usage")
      .insert({
        organisation_id: organisationId,
        provider: provider.name,
        model: provider.model,
        call_type: callType,
        input_tokens: input,
        cached_input_tokens: cached,
        output_tokens: usage.completion_tokens,
        cost: (input * provider.price.input + usage.completion_tokens * provider.price.output) / 1e6,
        ok: content !== null,
        at: (await now()).toISOString(),
      });
    if (error) throw error;
    if (content !== null) return { content, model: provider.model, latencyMs: Date.now() - started };
  }
  return null;
}
