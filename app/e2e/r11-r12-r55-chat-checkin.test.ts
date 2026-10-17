import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { before, test } from "node:test";
import { classifierTag, db, freezeClock, hrRequest, joined, modelCalls, resetDemo, say, scriptModel, sentTo, tap } from "./helpers.ts";

const read = (path: string) => JSON.parse(readFileSync(new URL(path, import.meta.url), "utf8"));
const [organisation] = read("../data/seed/organisations.json");
const speakUp = [
  "Thank you for telling us. This is serious. Please report it to HR through Contoh Speak Up. You can stay 100% anonymous.",
  ...organisation.escalation_contacts.general,
].join("\n");
const thanks = "Thank you, your answers are saved.";
const gotIt = "Got it. Your answer is saved and HR will look at it.";
const askHr = "I cannot give advice or answer questions about pay, probation, health or legal matters. Please ask HR directly.";
const [low, keyword, flagged, pay, vague, light] = [601, 602, 603, 604, 605, 606].map((n) => 5550000000 + n);

type Message = { text: string; reply_markup?: { inline_keyboard: { text: string }[][] } };
const labels = (m: Message) => m.reply_markup?.inline_keyboard.map((row) => row.map((b) => b.text)) ?? [];

const turn = (fields: Record<string, unknown> = {}) => ({
  action: "ask",
  question: "",
  goals_met: [],
  work_detail: true,
  serious_concern: false,
  concern_category: "none",
  ask_hr: false,
  stop_reason: "none",
  ...fields,
});

async function answer(chat: number, text: string) {
  const before = (await sentTo(chat)).length;
  await say(chat, text);
  return ((await sentTo(chat)).slice(before) as Message[]).map((m) => m.text);
}

async function taps(chat: number, words: string[]) {
  for (const word of words) await tap(chat, word);
}

const okTaps = ["Mostly clear", "Some", "Very connected", "Partly", "Just about", "Mostly"];
const lowTaps = ["A bit unclear", "A lot", "Mostly", "Well", "Manageable"];

async function openReply(chat: number) {
  const { data: who } = await db.from("people").select("id").eq("telegram_chat_id", chat).single();
  const { data } = await db.from("responses").select("id, text_encrypted").eq("person_id", who!.id).eq("question_id", "OPEN");
  return data!;
}

before(async () => {
  await resetDemo();
  await freezeClock("2026-10-15T15:00:00.000Z");
  await Promise.all([low, keyword, flagged, pay, vague, light].map((chat) => joined(chat, "2026-10-02")));
  const res = await hrRequest("/api/hr/demo/advance", "POST", { day: 14 });
  assert.equal((await res.json()).sent, 6);
});

test("R55: the check-in starts with the privacy line and shows word buttons, one per row, with no numbers", async () => {
  const [intro, first] = (await sentTo(low)).slice(-2) as Message[];
  assert.ok(intro.text.includes("A few quick taps so HR can see if things get better for your team."));
  assert.ok(
    intro.text.includes(
      "Sapa does not know your name. Your company sees what you write, never who wrote it. Leave out names and details if you want to stay anonymous.",
    ),
  );
  assert.equal(first.text, "How clear are you on what is expected of you this week?");
  assert.deepEqual(labels(first), [["Not clear at all"], ["A bit unclear"], ["Somewhat clear"], ["Mostly clear"], ["Very clear"]]);
});

test("R55, R12: typed words count as taps, the lowest tap opens the chat, the AI asks at most 2 follow-ups, a feelings word is asked again, and HR gets one reply", async () => {
  await taps(low, lowTaps.slice(0, 4));
  await say(low, "Manageable");
  const support = (await sentTo(low)).at(-5) as Message;
  assert.equal(support.text, "How much support did you get from your manager this week?");
  assert.deepEqual(labels(support), [["None"], ["Very little"], ["Some"], ["A good amount"], ["A lot"]]);
  const job = await answer(low, "4");
  assert.deepEqual(job, ['You tapped "A bit unclear". What is happening?']);
  assert.deepEqual(labels((await sentTo(low)).at(-1) as Message), [["Done"]]);

  const { data: who } = await db.from("people").select("id").eq("telegram_chat_id", low).single();
  const { data: scores } = await db.from("responses").select("question_id, scale_value").eq("person_id", who!.id).not("scale_value", "is", null);
  assert.deepEqual(
    Object.fromEntries(scores!.map((r) => [r.question_id, r.scale_value])),
    { ROLE_CLARITY: 2, MANAGER_SUPPORT: 5, BELONGING: 4, ONBOARDING_TRAINING: 4, WORKLOAD: 4, JOB_MATCH: 4 },
  );

  await scriptModel("omniroute:chat", [{ kind: "json", content: turn({ question: "Which invoices did you do first yesterday?" }) }]);
  assert.deepEqual(await answer(low, "Three seniors give me urgent invoices at once, call me on 012-345 6789"), [
    "Which invoices did you do first yesterday?",
  ]);
  const [call] = await modelCalls("omniroute:chat");
  assert.equal((call.body as unknown as { model: string }).model, "test-chat");
  assert.ok(JSON.stringify(call.body).includes("call me on [PHONE]"));
  assert.ok(!JSON.stringify(call.body).includes("012-345 6789"));

  await scriptModel("omniroute:chat", [
    { kind: "json", content: turn({ question: "How did you feel about the order?" }) },
    { kind: "json", content: turn({ question: "What would make the order of invoices clearer?" }) },
  ]);
  assert.deepEqual(await answer(low, "The Malaysia ones, but then Singapore was late"), ["What would make the order of invoices clearer?"]);
  assert.equal((await modelCalls("omniroute:chat")).length, 3);

  await scriptModel("omniroute:chat", [{ kind: "json", content: turn({ question: "Anything else about the invoices?" }) }]);
  await scriptModel("omniroute", [{ kind: "json", content: classifierTag({ evidence_quote: "Three seniors give me urgent invoices at once" }) }]);
  assert.deepEqual(await answer(low, "A written list of which country goes first"), [thanks]);

  const replies = await openReply(low);
  assert.equal(replies.length, 1);
  const res = await hrRequest("/api/hr/replies", "GET");
  const shown = ((await res.json()) as { id: string; text: string }[]).find((r) => r.id === replies[0].id)!;
  assert.equal(
    shown.text,
    "Three seniors give me urgent invoices at once, call me on [PHONE]\nThe Malaysia ones, but then Singapore was late\nA written list of which country goes first",
  );
  const { data: tag } = await db.from("ai_tags").select("status, evidence_quote").eq("response_id", replies[0].id).single();
  assert.deepEqual(tag, { status: "ok", evidence_quote: "Three seniors give me urgent invoices at once" });
});

test("R55, R12, R13: a safety keyword ends the chat before any AI question", async () => {
  await taps(keyword, lowTaps);
  await say(keyword, "1");
  await scriptModel("omniroute:chat", [{ kind: "json", content: turn({ question: "What happened next?" }) }]);
  const before = (await modelCalls("omniroute:chat")).length;
  assert.deepEqual(await answer(keyword, "The agent holds my passport"), [speakUp]);
  assert.equal((await modelCalls("omniroute:chat")).length, before);
  const [reply] = await openReply(keyword);
  const { data: alert } = await db.from("escalations").select("category, source").eq("response_id", reply.id).single();
  assert.deepEqual(alert, { category: "forced_labour_indicator", source: "keyword" });
});

test("R55, R12, R13: the AI's serious concern flag ends the chat with the Speak Up message", async () => {
  await taps(flagged, lowTaps);
  await say(flagged, "1");
  await scriptModel("omniroute:chat", [
    { kind: "json", content: turn({ action: "done", serious_concern: true, concern_category: "bullying_threats", stop_reason: "serious_concern" }) },
  ]);
  assert.deepEqual(await answer(flagged, "My lead says he will make sure I fail probation if I complain"), [speakUp]);
  const [reply] = await openReply(flagged);
  const { data: alert } = await db.from("escalations").select("category, source").eq("response_id", reply.id).single();
  assert.deepEqual(alert, { category: "bullying_threats", source: "model" });
});

test("R55: a pay question gets the fixed ask-HR line and the chat goes on", async () => {
  await taps(pay, lowTaps);
  await say(pay, "1");
  await scriptModel("omniroute:chat", [{ kind: "json", content: turn({ ask_hr: true, question: "Which tasks took the extra hours?" }) }]);
  assert.deepEqual(await answer(pay, "OT 20 hours this month, will I get paid for it?"), [askHr, "Which tasks took the extra hours?"]);
});

test("R55: two replies with no work detail end the chat", async () => {
  await taps(vague, lowTaps);
  await say(vague, "1");
  await scriptModel("omniroute:chat", [
    { kind: "json", content: turn({ work_detail: false, question: "What happened this week?" }) },
    { kind: "json", content: turn({ work_detail: true, question: "What else happened?" }) },
  ]);
  assert.deepEqual(await answer(vague, "busy"), ["What happened this week?"]);
  assert.deepEqual(await answer(vague, "😭"), [gotIt]);
});

test("R55: with no low tap the light question comes, and Done ends the chat", async () => {
  await taps(light, okTaps.slice(0, 5));
  assert.deepEqual(await answer(light, "Mostly"), ["Anything that would make next week easier?"]);
  await scriptModel("omniroute:chat", [{ kind: "json", content: turn({ question: "Which list would help most?" }) }]);
  assert.deepEqual(await answer(light, "A one-page list of who to ask for what"), ["Which list would help most?"]);
  await scriptModel("omniroute", [{ kind: "json", content: classifierTag({ drivers: [], positive: true, evidence_quote: "who to ask for what" }) }]);
  const before = (await sentTo(light)).length;
  await tap(light, "Done");
  assert.deepEqual(((await sentTo(light)).slice(before) as Message[]).map((m) => m.text), [thanks]);
  const [reply] = await openReply(light);
  const { data: tag } = await db.from("ai_tags").select("status, evidence_quote").eq("response_id", reply.id).single();
  assert.deepEqual(tag, { status: "ok", evidence_quote: "who to ask for what" });
});
