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
const [low, keyword, flagged, pay, vague, light, skip, route] = [601, 602, 603, 604, 605, 606, 607, 608].map((n) => 5550000000 + n);

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

async function qaReply(chat: number) {
  const { data: who } = await db.from("people").select("id").eq("telegram_chat_id", chat).single();
  const { data } = await db.from("responses").select("id").eq("person_id", who!.id).eq("question_id", "QA");
  return data!;
}

before(async () => {
  await resetDemo();
  await freezeClock("2026-10-15T15:00:00.000Z");
  await Promise.all([low, keyword, flagged, pay, vague, light, skip, route].map((chat) => joined(chat, "2026-10-02")));
  const res = await hrRequest("/api/hr/demo/outreach", "POST", { touchpoint: 14 });
  assert.equal((await res.json()).sent, 8);
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

test("R55, R12: a low tap opens a fixed probe at once, a reply that names the driver gets a fixed follow-up with no AI call, any other reply goes to the AI, and HR gets one reply", async () => {
  await tap(low, "A bit unclear");
  const probe = (await sentTo(low)).at(-1) as Message;
  assert.equal(probe.text, 'You tapped "A bit unclear". What is not clear about what is expected of you?');
  assert.deepEqual(labels(probe), [["Skip"]]);

  assert.deepEqual(await answer(low, "My tasks keep changing and there are no clear goals"), ["How does that affect your work?"]);
  assert.equal((await modelCalls("omniroute:chat")).length, 0);

  await scriptModel("omniroute:chat", [{ kind: "json", content: turn({ question: "Which invoice goes first?" }) }]);
  assert.deepEqual(await answer(low, "Three seniors give me urgent invoices at once, call me on 012-345 6789"), ["Which invoice goes first?"]);
  const [call] = await modelCalls("omniroute:chat");
  assert.equal((call.body as unknown as { model: string }).model, "test-chat");
  assert.ok(JSON.stringify(call.body).includes("call me on [PHONE]"));
  assert.ok(!JSON.stringify(call.body).includes("012-345 6789"));

  await scriptModel("omniroute:chat", [{ kind: "json", content: turn({ question: "Anything else?" }) }]);
  assert.deepEqual(await answer(low, "The Malaysia ones first"), ["How much support did you get from your manager this week?"]);
  assert.equal((await modelCalls("omniroute:chat")).length, 2);

  await taps(low, lowTaps.slice(1, 4));
  await say(low, "Manageable");
  const job = await answer(low, "4");
  assert.deepEqual(job, ["Anything that would make next week easier?"]);
  const { data: who } = await db.from("people").select("id").eq("telegram_chat_id", low).single();
  const { data: scores } = await db.from("responses").select("question_id, scale_value").eq("person_id", who!.id).not("scale_value", "is", null);
  assert.deepEqual(
    Object.fromEntries(scores!.map((r) => [r.question_id, r.scale_value])),
    { ROLE_CLARITY: 2, MANAGER_SUPPORT: 5, BELONGING: 4, ONBOARDING_TRAINING: 4, WORKLOAD: 4, JOB_MATCH: 4 },
  );

  await scriptModel("omniroute:chat", [{ kind: "json", content: turn({ question: "Which list would help most?" }) }]);
  assert.deepEqual(await answer(low, "A written list of which country goes first"), ["Which list would help most?"]);
  await scriptModel("omniroute", [{ kind: "json", content: classifierTag({ evidence_quote: "Three seniors give me urgent invoices at once" }) }]);
  const before = (await sentTo(low)).length;
  await tap(low, "Done");
  assert.deepEqual(((await sentTo(low)).slice(before) as Message[]).map((m) => m.text), ['You tapped "Done". ' + thanks]);

  const replies = await openReply(low);
  assert.equal(replies.length, 1);
  const res = await hrRequest("/api/hr/replies", "GET");
  const shown = ((await res.json()) as { id: string; text: string }[]).find((r) => r.id === replies[0].id)!;
  assert.equal(
    shown.text,
    "My tasks keep changing and there are no clear goals\nThree seniors give me urgent invoices at once, call me on [PHONE]\nThe Malaysia ones first\nA written list of which country goes first",
  );
  const { data: tag } = await db.from("ai_tags").select("status, evidence_quote").eq("response_id", replies[0].id).single();
  assert.deepEqual(tag, { status: "ok", evidence_quote: "Three seniors give me urgent invoices at once" });
});

test("R55, R12: a reply that names the driver but has a pay word, a question mark or a good-news word goes to the AI, not a fixed follow-up", async () => {
  await tap(route, "A bit unclear");
  for (const text of ["My tasks pay is wrong", "Who sets my goals?", "My tasks are fine now"]) {
    const before = (await modelCalls("omniroute:chat")).length;
    await scriptModel("omniroute:chat", [{ kind: "json", content: turn({ question: "Which task is that?" }) }]);
    await answer(route, text);
    assert.equal((await modelCalls("omniroute:chat")).length, before + 1, text);
  }
});

test("R55, R12, R13: a safety keyword in a probe sends the Speak Up message with no AI question, and the taps go on", async () => {
  await tap(keyword, "A bit unclear");
  const before = (await modelCalls("omniroute:chat")).length;
  assert.deepEqual(await answer(keyword, "The agent holds my passport"), [speakUp, "How much support did you get from your manager this week?"]);
  assert.equal((await modelCalls("omniroute:chat")).length, before);
  const [reply] = await qaReply(keyword);
  const { data: alert } = await db.from("escalations").select("category, source").eq("response_id", reply.id).single();
  assert.deepEqual(alert, { category: "forced_labour_indicator", source: "keyword" });
});

test("R55, R12, R13: the AI's serious concern flag in a probe sends the Speak Up message, and the taps go on", async () => {
  await tap(flagged, "A bit unclear");
  await scriptModel("omniroute:chat", [
    { kind: "json", content: turn({ action: "done", serious_concern: true, concern_category: "bullying_threats", stop_reason: "serious_concern" }) },
  ]);
  assert.deepEqual(await answer(flagged, "My lead says he will make sure I fail probation if I complain"), [
    speakUp,
    "How much support did you get from your manager this week?",
  ]);
  const [reply] = await qaReply(flagged);
  const { data: alert } = await db.from("escalations").select("category, source").eq("response_id", reply.id).single();
  assert.deepEqual(alert, { category: "bullying_threats", source: "model" });
});

test("R55: a pay question gets the fixed ask-HR line and the probe goes on", async () => {
  await tap(pay, "A bit unclear");
  await scriptModel("omniroute:chat", [{ kind: "json", content: turn({ ask_hr: true, question: "Which tasks took the extra hours?" }) }]);
  assert.deepEqual(await answer(pay, "OT 20 hours this month, will I get paid for it?"), [askHr, "Which tasks took the extra hours?"]);
});

test("R55: two replies with no work detail end the probe and the next tap comes", async () => {
  await tap(vague, "A bit unclear");
  await scriptModel("omniroute:chat", [
    { kind: "json", content: turn({ work_detail: false, question: "What happened this week?" }) },
    { kind: "json", content: turn({ work_detail: true, question: "What else happened?" }) },
  ]);
  assert.deepEqual(await answer(vague, "busy"), ["What happened this week?"]);
  assert.deepEqual(await answer(vague, "😭"), ["How much support did you get from your manager this week?"]);
});

test("R55: Skip in a probe goes on to the next tap, and only the first 2 low taps get a probe", async () => {
  await tap(skip, "A bit unclear");
  let before = (await sentTo(skip)).length;
  await tap(skip, "Skip");
  assert.deepEqual(((await sentTo(skip)).slice(before) as Message[]).map((m) => m.text), [
    'You tapped "Skip". How much support did you get from your manager this week?',
  ]);
  await tap(skip, "None");
  await tap(skip, "Skip");
  await tap(skip, "Not at all");
  before = (await sentTo(skip)).length;
  await tap(skip, "Poorly");
  assert.deepEqual(((await sentTo(skip)).slice(before) as Message[]).map((m) => m.text), [
    'You tapped "Poorly". How manageable is your workload this week?',
  ]);
});

test("R55: with no low tap the light question comes, and Done ends the chat", async () => {
  await taps(light, okTaps.slice(0, 5));
  assert.deepEqual(await answer(light, "Mostly"), ["Anything that would make next week easier?"]);
  await scriptModel("omniroute:chat", [{ kind: "json", content: turn({ question: "Which list would help most?" }) }]);
  assert.deepEqual(await answer(light, "A one-page list of who to ask for what"), ["Which list would help most?"]);
  await scriptModel("omniroute", [{ kind: "json", content: classifierTag({ drivers: [], positive: true, evidence_quote: "who to ask for what" }) }]);
  const before = (await sentTo(light)).length;
  await tap(light, "Done");
  assert.deepEqual(((await sentTo(light)).slice(before) as Message[]).map((m) => m.text), ['You tapped "Done". ' + thanks]);
  const [reply] = await openReply(light);
  const { data: tag } = await db.from("ai_tags").select("status, evidence_quote").eq("response_id", reply.id).single();
  assert.deepEqual(tag, { status: "ok", evidence_quote: "who to ask for what" });
});
