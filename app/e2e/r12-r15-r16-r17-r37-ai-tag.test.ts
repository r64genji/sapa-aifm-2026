import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { before, test } from "node:test";
import {
  classifierTag,
  db,
  freezeClock,
  hrRequest,
  joined,
  link,
  modelCalls,
  resetDemo,
  say,
  scriptModel,
  sentTo,
  tap,
} from "./helpers.ts";

const en = JSON.parse(readFileSync(new URL("../data/packs/en.json", import.meta.url), "utf8"));
const probe = (id: string) => en.checkin.probes.find((p: { id: string }) => p.id === id).text;
const live = 5550000201;
const [wrongTwice, wrongOnce, badJson, down, fallback, capped, spender] = [301, 302, 303, 304, 305, 306, 307].map(
  (n) => 5550000000 + n,
);
const quote = "tak tahu mana nak buat dulu";
const reply = `Boss bagi 3 task semua urgent, ${quote}. Call me 012-345 6789`;
const person = (chat: number) => db.from("people").select("id").eq("telegram_chat_id", chat).single();

async function reachOpenQuestion(chat: number) {
  await tap(chat, "4");
  await tap(chat, "3");
  await tap(chat, "5");
}

async function storedTag(chat: number) {
  const { data: who } = await person(chat);
  const { data: response } = await db
    .from("responses")
    .select("id")
    .eq("person_id", who!.id)
    .eq("question_id", "OPEN")
    .single();
  const { data } = await db.from("ai_tags").select("*").eq("response_id", response!.id).single();
  return { responseId: response!.id as string, tag: data };
}

const lastText = async (chat: number) => (await sentTo(chat)).at(-1)?.text;

before(async () => {
  await resetDemo();
  await freezeClock("2026-10-15T15:00:00.000Z");
  await link(live, "live-hire-invite");
  await tap(live, "English");
  await tap(live, en.agree);
  for (const chat of [wrongTwice, wrongOnce, badJson, down, fallback, capped, spender]) await joined(chat, "2026-10-02");
  const res = await hrRequest("/api/hr/demo/advance", "POST", { day: 14 });
  assert.equal((await res.json()).sent, 8);
});

test("R17, R16, R12: the model gets masked text, extra fields are not stored, and probes stop at the cap", async () => {
  await reachOpenQuestion(live);
  await scriptModel("omniroute", [
    { kind: "json", content: { ...classifierTag({ probe_id: "ROLE_CLARITY" }), emotion: "angry", sentiment_score: -0.8 } },
  ]);
  await say(live, reply);

  const calls = await modelCalls("omniroute");
  assert.equal(calls.length, 1);
  const sent = JSON.stringify(calls[0].body);
  assert.ok(!sent.includes("012-345 6789") && !sent.includes("0123456789"));
  assert.ok(sent.includes(`${quote}. Call me [PHONE]`));
  assert.equal(await lastText(live), probe("ROLE_CLARITY"));

  const { tag } = await storedTag(live);
  assert.equal(tag.status, "ok");
  assert.deepEqual(tag.drivers, ["ROLE_CLARITY"]);
  assert.equal(tag.model, "test-gemini");
  assert.equal(tag.prompt_version, "classify-v1");
  assert.ok(!Object.keys(tag).some((key) => /emotion|sentiment|personality|quit|risk/.test(key)));
  const { data: usage } = await db.from("ai_usage").select("provider, model, call_type, input_tokens, output_tokens, cost, ok");
  assert.deepEqual(usage, [
    { provider: "gemini", model: "test-gemini", call_type: "classify", input_tokens: 100, output_tokens: 50, cost: 0.0002625, ok: true },
  ]);

  await scriptModel("omniroute", [
    { kind: "json", content: classifierTag({ probe_id: "GENERIC_MORE", evidence_quote: "Everything is urgent" }) },
    { kind: "json", content: classifierTag({ probe_id: "GENERIC_HELP", evidence_quote: "Still unclear" }) },
  ]);
  await say(live, "Everything is urgent");
  assert.equal(await lastText(live), probe("GENERIC_MORE"));
  await say(live, "Still unclear");
  assert.equal(await lastText(live), en.checkin.thanks);
  assert.equal((await modelCalls("omniroute")).length, 3);
});

test("R15: a quote that is not in the reply is retried once, then stored as needs review", async () => {
  await reachOpenQuestion(wrongTwice);
  const wrong = classifierTag({ evidence_quote: "I was shouted at", probe_id: "GENERIC_MORE" });
  await scriptModel("omniroute", [
    { kind: "json", content: wrong },
    { kind: "json", content: wrong },
  ]);
  const before = (await modelCalls("omniroute")).length;
  await say(wrongTwice, reply);
  assert.equal((await modelCalls("omniroute")).length - before, 2);
  assert.equal((await storedTag(wrongTwice)).tag.status, "needs_review");
  assert.equal(await lastText(wrongTwice), en.checkin.thanks);

  await reachOpenQuestion(wrongOnce);
  await scriptModel("omniroute", [
    { kind: "json", content: wrong },
    { kind: "json", content: classifierTag() },
  ]);
  await say(wrongOnce, reply);
  assert.equal((await storedTag(wrongOnce)).tag.status, "ok");
});

test("Invalid JSON is retried once", async () => {
  await reachOpenQuestion(badJson);
  await scriptModel("omniroute", [
    { kind: "text", content: "{not json" },
    { kind: "json", content: classifierTag() },
  ]);
  const before = (await modelCalls("omniroute")).length;
  await say(badJson, reply);
  assert.equal((await modelCalls("omniroute")).length - before, 2);
  assert.equal((await storedTag(badJson)).tag.status, "ok");
});

test("R2, R37: with both providers down commands work, the reply waits for AI, HR can retry", async () => {
  await reachOpenQuestion(down);
  await say(down, reply);
  assert.equal(await lastText(down), en.checkin.gotIt);
  const { responseId, tag } = await storedTag(down);
  assert.equal(tag.status, "awaiting_ai");
  await say(down, "/help");
  assert.equal(await lastText(down), en.help);

  await scriptModel("omniroute", [{ kind: "json", content: classifierTag() }]);
  const res = await hrRequest(`/api/hr/replies/${responseId}/retry`, "POST");
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { status: "ok" });
  assert.equal((await storedTag(down)).tag.status, "ok");
});

test("DeepSeek answers when OmniRoute is down, and both calls are recorded", async () => {
  await reachOpenQuestion(fallback);
  await scriptModel("deepseek", [{ kind: "json", content: classifierTag() }]);
  const before = (await db.from("ai_usage").select("id")).data!.length;
  await say(fallback, reply);
  const { tag } = await storedTag(fallback);
  assert.equal(tag.status, "ok");
  assert.equal(tag.model, "test-deepseek");
  const { data } = await db.from("ai_usage").select("provider, ok").order("at");
  assert.deepEqual(data!.slice(before), [
    { provider: "gemini", ok: false },
    { provider: "deepseek", ok: true },
  ]);
});

test("R37: over $1.50 of fallback spend, DeepSeek gets no call", async () => {
  await reachOpenQuestion(spender);
  await scriptModel("deepseek", [{ kind: "json", content: classifierTag(), usage: { prompt_tokens: 5_100_000, completion_tokens: 0 } }]);
  await say(spender, reply);
  assert.equal((await storedTag(spender)).tag.status, "ok");
  await reachOpenQuestion(capped);
  await scriptModel("deepseek", [{ kind: "json", content: classifierTag() }]);
  const before = (await modelCalls("deepseek")).length;
  await say(capped, reply);
  assert.equal((await modelCalls("deepseek")).length, before);
  assert.equal(await lastText(capped), en.checkin.gotIt);
  assert.equal((await storedTag(capped)).tag.status, "awaiting_ai");
});
