import assert from "node:assert/strict";
import { before, test } from "node:test";
import { db, freezeClock, joined, modelCalls, resetDemo, say, scriptModel, sentTo } from "./helpers.ts";

const [chat, ms] = [5550005701, 5550005702];
const label = "AI suggestion. Check it before you send:";
const sendLine = "Copy it and send it to your lead yourself. Sapa does not send or keep it.";
const down = "Sorry, I cannot help with that right now. Please try again later.";
const prompt = "Type the message you want to send to your lead, in any language.";

async function reply(who: number, text: string) {
  const seen = (await sentTo(who)).length;
  await say(who, text);
  return (await sentTo(who)).slice(seen).map((m) => String(m.text));
}

const rewrite = (english: string) => ({ kind: "json" as const, content: { english } });

async function responseCount() {
  const { count } = await db.from("responses").select("id", { count: "exact", head: true });
  return count;
}

before(async () => {
  await resetDemo();
  await freezeClock("2026-10-15T15:00:00.000Z");
  await joined(chat, "2026-10-14");
});

test("R57: /say <text> returns the label, the rewrite and the fixed line, and stores nothing", async () => {
  const stored = await responseCount();
  await scriptModel("omniroute", [rewrite("Could we please talk about my workload this week? I have three urgent tasks.")]);
  const out = await reply(chat, "/say boss, saya ada 3 task urgent, boleh bincang tak?");
  assert.deepEqual(out, [`${label}\nCould we please talk about my workload this week? I have three urgent tasks.`, sendLine]);
  assert.equal(await responseCount(), stored);
  const calls = await modelCalls("omniroute");
  assert.equal(calls.length, 1);
  const { data: usage } = await db.from("ai_usage").select("call_type").eq("call_type", "say");
  assert.ok(usage!.length >= 1);
});

test("R57, R17: the text is masked before the AI sees it", async () => {
  await scriptModel("omniroute", [rewrite("Please call me on [PHONE].")]);
  await reply(chat, "/say call me 012-345 6789");
  const sent = JSON.stringify((await modelCalls("omniroute")).at(-1)!.body.messages);
  assert.ok(sent.includes("[PHONE]"));
  assert.ok(!sent.includes("345 6789"));
});

test("R57: /say with no text asks for it, and the next message is not an AI call", async () => {
  const before = (await modelCalls("omniroute")).length;
  assert.deepEqual(await reply(chat, "/say"), [prompt]);
  assert.equal((await modelCalls("omniroute")).length, before);
});

test("R57, R13, R14: a keyword message gets the Speak Up message and no AI call", async () => {
  const before = (await modelCalls("omniroute")).length;
  const out = await reply(chat, "/say my manager keeps touching me and I am scared");
  assert.equal(out.length, 1);
  assert.ok(out[0].startsWith("Thank you for telling us. This is serious. Please report it to HR through Contoh Speak Up."));
  assert.equal((await modelCalls("omniroute")).length, before);
});

test("R57: a bad answer is retried once, then the fixed fallback comes", async () => {
  await scriptModel("omniroute", [{ kind: "text", content: "not json" }, rewrite("")]);
  assert.deepEqual(await reply(chat, "/say tolong"), [down]);
  await scriptModel("omniroute", [{ kind: "text", content: "oops" }, rewrite("Thank you for your help.")]);
  assert.deepEqual(await reply(chat, "/say terima kasih"), [`${label}\nThank you for your help.`, sendLine]);
});

test("R57: with the model down the fixed fallback comes", async () => {
  await scriptModel("omniroute", [{ kind: "error", status: 503 }]);
  await scriptModel("deepseek", [{ kind: "error", status: 503 }]);
  assert.deepEqual(await reply(chat, "/say tolong saya"), [down]);
});

test("R57, R36: the Bahasa Malaysia alias works for a Bahasa Malaysia hire", async () => {
  await joined(ms, "2026-10-14");
  await scriptModel("omniroute", [rewrite("Please may I leave early today?")]);
  const out = await reply(ms, "/cakap boleh saya balik awal hari ini");
  assert.ok(out[0].endsWith("Please may I leave early today?"));
  assert.equal(out.length, 2);
});
