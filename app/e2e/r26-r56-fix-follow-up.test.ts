import assert from "node:assert/strict";
import { before, test } from "node:test";
import { classifierTag, db, dispatch, freezeClock, hrRequest, joined, resetDemo, say, scriptModel, sentTo, tap, tapScore } from "./helpers.ts";

const [a, b, c, d, e, other, late] = [1, 2, 3, 4, 5, 6, 7].map((n) => 5550003000 + n);
const team = [a, b, c, d, e];
const notes = { en: "Your lead will give you a written job scope.", ms: "Ketua anda akan memberi skop kerja bertulis.", zh: "你的主管会给你书面的工作范围。" };
const changeLabels = [["Much worse"], ["A bit worse"], ["No change"], ["A bit better"], ["Much better"]];
const quote = "the scope sheet lists which country goes first";

type Message = { text: string; reply_markup?: { inline_keyboard: { text: string }[][] } };
const texts = async (chat: number, from: number) => ((await sentTo(chat)) as Message[]).slice(from).map((m) => m.text);
const action = (id: string, path: string, body?: Record<string, unknown>) => hrRequest(`/api/hr/actions/${id}${path}`, "POST", body);
const detail = async (id: string) => (await (await hrRequest(`/api/hr/actions/${id}`, "GET")).json()) as Record<string, any>;

async function fix(driver: string, scopeTeam: string, notice: Record<string, unknown>) {
  const res = await hrRequest("/api/hr/actions", "POST", { driver });
  const id = (await res.json()).id as string;
  assert.equal((await hrRequest(`/api/hr/actions/${id}`, "PATCH", { scope: { type: "team", team: scopeTeam } })).status, 200);
  assert.equal((await action(id, "/notice", notice)).status, 200);
  assert.equal((await action(id, "/assign", { owner: "hr" })).status, 200);
  assert.equal((await action(id, "/accept")).status, 200);
  assert.equal((await action(id, "/done", { outcome: "Done." })).status, 200);
  return id;
}

async function otherTaps(chat: number) {
  for (let i = 0; i < 5; i++) await tapScore(chat, 3);
}

let main: string;

before(async () => {
  await resetDemo();
  await freezeClock("2026-10-15T15:00:00.000Z");
  for (const chat of team) await joined(chat, "2026-10-02");
  await joined(other, "2026-10-02");
  await joined(late, "2026-10-15");
  const { data: who } = await db.from("people").select("id").in("telegram_chat_id", [other, late]);
  await db.from("people").update({ team: "IT Service Desk" }).in("id", who!.map((row) => row.id));
  assert.equal((await hrRequest("/api/hr/demo/outreach", "POST", { touchpoint: 14 })).status, 200);
  for (const chat of [...team, other, late]) {
    for (const score of [2, 3, 3, 3, 3, 3]) await tapScore(chat, score);
    await tap(chat, "Skip");
  }
  main = await fix("ROLE_CLARITY", "Accounts Payable Asia", { notes });
  await fix("WORKLOAD", "IT Service Desk", { no_notice_reason: "The team already knows" });
  await dispatch();
  assert.equal((await hrRequest("/api/hr/demo/outreach", "POST", { touchpoint: 30 })).status, 200);
});

test("R26, R56: the recheck comes first with no hint of the fix, and the fix question comes after the other taps", async () => {
  const [first] = ((await sentTo(a)) as Message[]).slice(-1);
  assert.equal(first.text, "How clear are you on what is expected of you this week?");
  assert.deepEqual(first.reply_markup!.inline_keyboard.map((row) => row.map((k) => k.text)), [
    ["Not clear at all"],
    ["A bit unclear"],
    ["Somewhat clear"],
    ["Mostly clear"],
    ["Very clear"],
  ]);
  await tapScore(a, 4);
  await otherTaps(a);
  const [change] = ((await sentTo(a)) as Message[]).slice(-1);
  assert.equal(change.text, 'You tapped "Just about". Since the last Update from HR about your role, how has it changed for you?');
  assert.deepEqual(change.reply_markup!.inline_keyboard.map((row) => row.map((k) => k.text)), changeLabels);

  const from = (await sentTo(a)).length;
  await tap(a, "A bit better");
  assert.deepEqual(await texts(a, from), ['What changed?']);
  await scriptModel("omniroute", [{ kind: "json", content: classifierTag({ drivers: [], positive: true, evidence_quote: quote }) }]);
  const asked = (await sentTo(a)).length;
  await say(a, `Now ${quote}, so I start on Malaysia`);
  assert.deepEqual(await texts(a, asked), ["Last one: is there anything else about work you want HR to know? It can be anything. Type it, or tap Skip."]);
  await tap(a, "Skip");

  const { data: who } = await db.from("people").select("id").eq("telegram_chat_id", a).single();
  const { data: linked } = await db.from("responses").select("question_id, scale_value").eq("person_id", who!.id).eq("action_id", main).order("question_id");
  assert.deepEqual(linked, [
    { question_id: "FIX_CHANGE", scale_value: 4 },
    { question_id: "OPEN", scale_value: null },
    { question_id: "ROLE_CLARITY", scale_value: 4 },
  ]);
});

test("R56: a low fix answer asks what is still not working", async () => {
  await tapScore(b, 3);
  await otherTaps(b);
  const from = (await sentTo(b)).length;
  await tap(b, "No change");
  assert.deepEqual(await texts(b, from), ['What is still not working?']);
  await tap(b, "Skip");
});

test("R56: a fix with no note to new hires asks no fix question", async () => {
  assert.equal(((await sentTo(other)) as Message[]).at(-1)!.text, "How manageable is your workload this week?");
  const from = (await sentTo(other)).length;
  await tapScore(other, 4);
  await otherTaps(other);
  const asked = (await texts(other, from)).map((text) => text.replace(/^You tapped "[^"]*"\. /, ""));
  assert.deepEqual(asked.slice(0, 5), [
    "How clear are you on what is expected of you this week?",
    "How easy was it to get help from your manager when you needed it this week?",
    "How easy is it to ask your teammates for help this week?",
    "How easy was it this week to find out how things work here, like rules, claims or facilities?",
    "How well did your training prepare you for the tasks you did this week?",
  ]);
  assert.ok(!asked.some((text) => text.includes("Since the last Update from HR")));
});

test("R26: a hire whose earlier check-ins were never sent still gets the recheck first", async () => {
  assert.equal(((await sentTo(late)) as Message[]).at(-1)!.text, "How manageable is your workload this week?");
});

test("R26, R56: HR sees the answer words only from 5 answers, quotes from the chat, and the recheck count", async () => {
  for (const [chat, word] of [[c, "Much better"], [d, "A bit better"]] as const) {
    await tapScore(chat, 4);
    await otherTaps(chat);
    await tap(chat, word);
    await tap(chat, "Skip");
  }
  const early = await detail(main);
  assert.deepEqual(early.follow_up, { answers: 4, counts: null, quotes: [{ text: quote, language: "en" }] });

  await tapScore(e, 3);
  await otherTaps(e);
  await tap(e, "A bit worse");
  await tap(e, "Skip");
  const full = await detail(main);
  assert.deepEqual(full.recheck, { asked: 5, answered: 5 });
  assert.deepEqual(full.follow_up, {
    answers: 5,
    counts: [
      { label: "Much worse", n: 0 },
      { label: "A bit worse", n: 1 },
      { label: "No change", n: 1 },
      { label: "A bit better", n: 2 },
      { label: "Much better", n: 1 },
    ],
    quotes: [{ text: quote, language: "en" }],
  });
});
