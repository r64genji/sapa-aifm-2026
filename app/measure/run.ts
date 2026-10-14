import { randomUUID } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { complete, providers, request } from "@/lib/ai";
import { classify, evidenceHolds, parse, PROMPT_VERSION } from "@/lib/classify";
import { mask } from "@/lib/mask";
import { generate, groundedPage, prompt } from "@/lib/qa";
import { detect } from "@/lib/safety";
import { createAdminClient } from "@/lib/supabase/admin";
import { fraction, kappa, share } from "./stats.ts";

const FALLBACK_CAP = 1.5;
const DRIVERS = ["ROLE_CLARITY", "MANAGER_SUPPORT", "BELONGING", "ONBOARDING_TRAINING", "WORKLOAD"] as const;
const LANGUAGES = ["ms", "en", "zh", "manglish"];
const sets = new URL("../../eval/sets/", import.meta.url);
const results = new URL("../../eval/results/", import.meta.url);

const read = (name: string) =>
  readFileSync(new URL(name, sets), "utf8")
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line));

const args = process.argv.slice(2);
const models = args.flatMap((arg, i) => (arg === "--model" ? [args[i + 1]] : []));
const [command] = args;
if (models.length !== 1 || !["gemini", "deepseek"].includes(models[0]) || !["classify", "qa", "reliability"].includes(command)) {
  console.error("Usage: run.ts classify|qa|reliability --model gemini|deepseek [--split dev|test]. Name exactly one model; there is no fallback.");
  process.exit(2);
}
const modelName = models[0] as "gemini" | "deepseek";
const splitArg = args.indexOf("--split") >= 0 ? args[args.indexOf("--split") + 1] : "test";
const organisation = process.env.EVAL_ORGANISATION_ID;
const runId = randomUUID();

const usage = { calls: 0, failed: 0, input: 0, output: 0, cost: 0 };
let queue = Promise.resolve();

function caller(trail: (string | null)[]): typeof complete {
  return async (_organisationId, callType, system, user, schema) => {
    if (modelName === "deepseek" && usage.cost > FALLBACK_CAP) throw new Error("DeepSeek spend passed the R37 cap");
    const provider = providers(schema, false).find((p) => p.name === modelName)!;
    const reply = await request(provider, system, user);
    trail.push(reply.content);
    usage.calls++;
    usage.failed += reply.content === null ? 1 : 0;
    usage.input += reply.input;
    usage.output += reply.output;
    usage.cost += reply.cost;
    if (organisation) {
      queue = queue.then(async () => {
        const { error } = await createAdminClient().from("ai_usage").insert({
          organisation_id: organisation,
          provider: provider.name,
          model: provider.model,
          call_type: callType,
          input_tokens: reply.input,
          cached_input_tokens: reply.cached,
          output_tokens: reply.output,
          cost: reply.cost,
          ok: reply.content !== null,
          eval_run_id: runId,
          at: new Date().toISOString(),
        });
        if (error) throw error;
      });
    }
    return reply.content === null ? null : { content: reply.content, model: provider.model, latencyMs: reply.latencyMs };
  };
}

async function pool<T, R>(items: T[], work: (item: T) => Promise<R>) {
  const out: R[] = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: 4 }, async () => {
      while (next < items.length) {
        const i = next++;
        out[i] = await work(items[i]);
      }
    }),
  );
  return out;
}

type Gold = { id: string; lang: string; text: string; drivers: string[]; escalate: boolean; category?: string; follow_up?: boolean; group?: string };

async function classifyAll(items: Gold[]) {
  return pool(items, async (item) => {
    const trail: (string | null)[] = [];
    const result = await classify("eval", item.text, caller(trail));
    const first = trail[0] === null || trail[0] === undefined ? null : parse(trail[0]);
    const firstValid = Boolean(first?.success && evidenceHolds(mask(item.text), first.data.evidence_quote));
    return { item, result, firstValid, calls: trail.length };
  });
}

type Classified = Awaited<ReturnType<typeof classifyAll>>[number];

function classifyMetrics(rows: Classified[]) {
  const done = rows.filter((r) => r.result.status !== "awaiting_ai");
  const tag = (r: Classified) => (r.result.status === "awaiting_ai" ? null : r.result.tag);
  const escalations = rows.filter((r) => r.item.escalate);
  const calm = rows.filter((r) => !r.item.escalate);
  const followUps = rows.filter((r) => r.item.escalate || r.item.follow_up);
  const perDriver = Object.fromEntries(
    DRIVERS.map((driver) => {
      const counted = done.filter((r) => r.result.status === "ok" && tag(r)!.drivers.includes(driver));
      return [
        driver,
        {
          kappa: kappa(done.map((r) => [(r.item.drivers as string[]).includes(driver), tag(r)!.drivers.includes(driver)])),
          precision_counted: fraction(counted.filter((r) => (r.item.drivers as string[]).includes(driver)).length, counted.length),
        },
      ];
    }),
  );
  const kappas = Object.values(perDriver).flatMap((d) => (d.kappa === null ? [] : [d.kappa]));
  const counted = done.filter((r) => r.result.status === "ok").flatMap((r) => tag(r)!.drivers.map((d) => (r.item.drivers as string[]).includes(d)));
  const flagged = (r: Classified) => tag(r)?.escalate === true;
  const alarms = (group: string) => fraction(calm.filter((c) => c.item.group === group && flagged(c)).length, calm.filter((c) => c.item.group === group).length);
  return {
    items: rows.length,
    failed_calls: rows.length - done.length,
    kappa_mean: kappas.length ? share(kappas.reduce((a, b) => a + b, 0), kappas.length) : null,
    drivers: perDriver,
    precision_counted_all_drivers: fraction(counted.filter(Boolean).length, counted.length),
    sent_to_review: fraction(done.filter((r) => r.result.status === "needs_review").length, done.length),
    follow_up_recall: fraction(followUps.filter((r) => flagged(r) || tag(r)?.concern_level === "needs_follow_up").length, followUps.length),
    escalation_recall: fraction(escalations.filter(flagged).length, escalations.length),
    forced_labour_recall: fraction(
      escalations.filter((r) => r.item.category === "forced_labour_indicator" && flagged(r)).length,
      escalations.filter((r) => r.item.category === "forced_labour_indicator").length,
    ),
    false_alarms: fraction(calm.filter(flagged).length, calm.length),
    false_alarms_hyperbole: alarms("hyperbole"),
    false_alarms_deduction: alarms("deduction"),
    baseline_keywords: {
      escalation_recall: fraction(escalations.filter((r) => detect(r.item.text)).length, escalations.length),
      false_alarms: fraction(calm.filter((r) => detect(r.item.text)).length, calm.length),
    },
    model_or_keywords_escalation_recall: fraction(escalations.filter((r) => flagged(r) || detect(r.item.text)).length, escalations.length),
  };
}

const byLanguage = <T extends { item: { lang: string } }>(rows: T[]) =>
  Object.fromEntries([["all", rows], ...LANGUAGES.map((l) => [l, rows.filter((r) => r.item.lang === l)] as const)]);

function brief(r: Classified) {
  return {
    id: r.item.id,
    lang: r.item.lang,
    text: r.item.text,
    gold: { drivers: r.item.drivers, escalate: r.item.escalate, category: r.item.category, group: r.item.group },
    status: r.result.status,
    out: r.result.status === "awaiting_ai" ? null : r.result.tag,
    calls: r.calls,
  };
}

async function runClassify() {
  const items = (read("classify.jsonl") as (Gold & { split: string })[]).filter((i) => splitArg === "both" || i.split === splitArg);
  const rows = await classifyAll(items);
  const grouped = byLanguage(rows);
  return {
    split: splitArg,
    metrics: Object.fromEntries(Object.entries(grouped).map(([lang, r]) => [lang, classifyMetrics(r)])),
    records: rows.map(brief),
  };
}

type Question = { id: string; handbook: string; style: string; text: string; expect: string; page: string };

async function runQa() {
  const handbook = JSON.parse(readFileSync(new URL("../data/seed/handbook_pages.json", import.meta.url), "utf8")) as {
    path: string;
    language: string;
    body: string;
    status: string;
  }[];
  const rows = await pool(read("qa.jsonl") as Question[], async (q) => {
    const pages = handbook.filter((p) => p.language === q.handbook && p.status === "published");
    if (detect(q.text)) return { q, outcome: "important", via: "keywords", page: "", answer: "", quote: "" };
    const { system, user } = prompt(pages, [], [], q.text);
    const trail: (string | null)[] = [];
    const result = await generate("eval", system, user, caller(trail));
    if (!result) return { q, outcome: "failed", via: "none", page: "", answer: "", quote: "" };
    if (result.important_topic !== "none") return { q, outcome: "important", via: "model", page: "", answer: result.answer, quote: "" };
    if (result.kind === "feedback") return { q, outcome: "feedback", via: "model", page: "", answer: result.answer, quote: "" };
    const page = groundedPage(pages, result);
    return page
      ? { q, outcome: "answered", via: "model", page: page.path, answer: result.answer, quote: result.supporting_quote }
      : { q, outcome: "unknown", via: "model", page: result.cited_path, answer: result.answer, quote: result.supporting_quote };
  });
  const of = (expect: string) => rows.filter((r) => r.q.expect === expect);
  const metric = (subset: typeof rows) => ({
    important_answered: of("important").filter((r) => subset.includes(r) && r.outcome === "answered").length,
    answerable_grounded: fraction(of("answerable").filter((r) => subset.includes(r) && r.outcome === "answered" && r.page === r.q.page).length, of("answerable").filter((r) => subset.includes(r)).length),
    uncovered_unknown: fraction(of("uncovered").filter((r) => subset.includes(r) && r.outcome === "unknown").length, of("uncovered").filter((r) => subset.includes(r)).length),
    failed_calls: subset.filter((r) => r.outcome === "failed").length,
  });
  return {
    split: "all",
    metrics: {
      all: metric(rows),
      ms: metric(rows.filter((r) => r.q.handbook === "ms")),
      en: metric(rows.filter((r) => r.q.handbook === "en")),
      manglish: metric(rows.filter((r) => r.q.style === "manglish")),
      baseline_always_unknown: { important_answered: 0, answerable_grounded: fraction(0, of("answerable").length), uncovered_unknown: fraction(of("uncovered").length, of("uncovered").length) },
    },
    records: rows.map((r) => ({ id: r.q.id, expect: r.q.expect, text: r.q.text, outcome: r.outcome, via: r.via, expected_page: r.q.page, page: r.page, answer: r.answer, quote: r.quote })),
  };
}

async function runReliability() {
  const all = read("classify.jsonl") as Gold[];
  const runs = Array.from({ length: 100 }, (_, i) => all[Math.floor((i * all.length) / 100)]);
  const rows = await classifyAll(runs);
  const adversarial = await pool(read("reliability-adversarial.jsonl") as (Gold & { kind: string })[], async (item) => {
    const trail: (string | null)[] = [];
    const result = await classify("eval", item.text, caller(trail));
    const out = result.status === "awaiting_ai" ? null : result.tag;
    const safe = out !== null && out.escalate === item.escalate && [...out.drivers].sort().join() === [...item.drivers].sort().join();
    return { id: item.id, kind: item.kind, text: item.text, status: result.status, gold: { drivers: item.drivers, escalate: item.escalate }, out, safe };
  });
  const kinds = [...new Set(adversarial.map((a) => a.kind))];
  return {
    split: "100 runs over classify.jsonl",
    metrics: {
      first_try_valid: fraction(rows.filter((r) => r.firstValid).length, rows.length),
      final_valid: fraction(rows.filter((r) => r.result.status !== "awaiting_ai").length, rows.length),
      adversarial_safe: Object.fromEntries([["all", fraction(adversarial.filter((a) => a.safe).length, adversarial.length)], ...kinds.map((k) => [k, fraction(adversarial.filter((a) => a.kind === k && a.safe).length, adversarial.filter((a) => a.kind === k).length)])]),
    },
    records: { runs: rows.map(brief), adversarial },
  };
}

const started = new Date().toISOString();
const body = await { classify: runClassify, qa: runQa, reliability: runReliability }[command as "classify"]();
await queue;
if (usage.failed === usage.calls) {
  console.error("Every model call failed; no results file written.");
  process.exit(1);
}
mkdirSync(results, { recursive: true });
const modelId = providers({}, false).find((p) => p.name === modelName)!.model;
const file = new URL(`${started.replace(/[:.]/g, "-")}-${modelName}-${command}-${body.split.replace(/\W+/g, "")}.json`, results);
writeFileSync(file, JSON.stringify({ run_id: runId, command, model: modelName, model_id: modelId, prompt_version: PROMPT_VERSION, started, usage: { ...usage, cost: Math.round(usage.cost * 1e5) / 1e5 }, ...body }, null, 1));
console.log(JSON.stringify({ file: file.pathname, usage, metrics: body.metrics }, null, 1));
