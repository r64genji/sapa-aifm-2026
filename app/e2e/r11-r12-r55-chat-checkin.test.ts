import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { before, test } from "node:test";
import { classifierTag, db, freezeClock, hrRequest, joined, modelCalls, resetDemo, say, scriptModel, sentTo, tap } from "./helpers.ts";

const read = (path: string) => JSON.parse(readFileSync(new URL(path, import.meta.url), "utf8"));
const en = read("../data/packs/en.json");
const [organisation] = read("../data/seed/organisations.json");
const speakUp = [
  "Thank you for telling us. This is serious. Please report it to HR through Contoh Speak Up. You can stay 100% anonymous.",
  ...organisation.escalation_contacts.general,
].join("\n");
const thanks = "Thank you, your answers are saved.";
const remarks = "Last one: is there anything else about work you want HR to know? It can be anything. Type it, or tap Skip.";
const optional = en.checkin.chat.optional;
const [low, unreachable, blocked, keyword, flagged, light] = [601, 602, 603, 604, 605, 606].map((n) => 5550000000 + n);

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

async function lastTaps(chat: number, words: string[]) {
  await taps(chat, words.slice(0, -1));
  const before = (await sentTo(chat)).length;
  await tap(chat, words.at(-1)!);
  return ((await sentTo(chat)).slice(before) as Message[]).map((m, i) => (i === 0 ? { ...m, text: m.text.replace(/^You tapped "[^"]*"\. /, "") } : m));
}

const lowRole = ["A bit unclear", "Very easy", "Quite easy", "Quite easy", "Well", "Manageable"];
const lowManager = ["Mostly clear", "Very hard", "Okay", "Quite easy", "Well", "Manageable"];
const tied = ["Mostly clear", "Quite hard", "Quite hard", "Quite easy", "Well", "Manageable"];
const allHigh = ["Very clear", "Very easy", "Very easy", "Very easy", "Very well", "Easy to manage"];
const roleOpener = `You tapped "A bit unclear" for your role.\n\nWhen you were not sure what to do this week, what did you do, and what happened?\n\n${optional}`;
const managerOpener = (label: string) =>
  `You tapped "${label}" for support from your manager.\n\nWhat did you need from your manager this week, and what happened?\n\n${optional}`;

async function openReply(chat: number) {
  const { data: who } = await db.from("people").select("id").eq("telegram_chat_id", chat).single();
  const { data } = await db.from("responses").select("id, text_encrypted").eq("person_id", who!.id).eq("question_id", "OPEN");
  return data!;
}

before(async () => {
  await resetDemo();
  await freezeClock("2026-10-15T15:00:00.000Z");
  await Promise.all([low, unreachable, blocked, keyword, flagged, light].map((chat) => joined(chat, "2026-10-02")));
  const res = await hrRequest("/api/hr/demo/outreach", "POST", { touchpoint: 14 });
  assert.equal((await res.json()).sent, 6);
});

test("R55, R11: the check-in starts with the intro by name and shows word buttons, one per row, with no numbers", async () => {
  const [intro, first] = (await sentTo(low)).slice(-2) as Message[];
  assert.equal(intro.text, en.checkin.introNamed.replace("{name}", "Test Hire"));
  assert.equal(first.text, "How clear are you on what is expected of you this week?");
  assert.deepEqual(labels(first), [["Not clear at all"], ["A bit unclear"], ["Somewhat clear"], ["Mostly clear"], ["Very clear"]]);
});

test("R12, R17: a low tap opens no probe, the fixed question for the lowest tap comes at once with Skip and no AI call, and the reply ends the check-in with one masked reply for HR", async () => {
  await tap(low, "A bit unclear");
  assert.equal((await sentTo(low)).at(-1)!.text, 'You tapped "A bit unclear". How easy was it to get help from your manager when you needed it this week?');

  const calls = (await modelCalls("omniroute:chat")).length;
  const opened = await lastTaps(low, lowRole.slice(1));
  assert.deepEqual(opened.map((m) => m.text), [roleOpener]);
  assert.deepEqual(labels(opened[0]), [["Skip"]]);
  assert.equal((await modelCalls("omniroute:chat")).length, calls);

  await scriptModel("omniroute", [{ kind: "json", content: classifierTag({ evidence_quote: "Three seniors give me urgent invoices at once" }) }]);
  assert.deepEqual(await answer(low, "Three seniors give me urgent invoices at once, call me on 012-345 6789"), [remarks]);
  const classify = (await modelCalls("omniroute")).at(-1)!;
  assert.ok(JSON.stringify(classify.body).includes("call me on [PHONE]"));
  assert.ok(!JSON.stringify(classify.body).includes("012-345 6789"));

  const { data: who } = await db.from("people").select("id").eq("telegram_chat_id", low).single();
  const { data: scores } = await db.from("responses").select("question_id, scale_value").eq("person_id", who!.id).not("scale_value", "is", null);
  assert.deepEqual(
    Object.fromEntries(scores!.map((r) => [r.question_id, r.scale_value])),
    { ROLE_CLARITY: 2, MANAGER_SUPPORT: 5, BELONGING: 4, ONBOARDING: 4, TRAINING: 4, WORKLOAD: 4 },
  );
  const replies = await openReply(low);
  assert.equal(replies.length, 1);
  const res = await hrRequest("/api/hr/replies", "GET");
  const shown = ((await res.json()) as { id: string; text: string }[]).find((r) => r.id === replies[0].id)!;
  assert.equal(shown.text, "Three seniors give me urgent invoices at once, call me on [PHONE]");
  const { data: tag } = await db.from("ai_tags").select("status, evidence_quote").eq("response_id", replies[0].id).single();
  assert.deepEqual(tag, { status: "ok", evidence_quote: "Three seniors give me urgent invoices at once" });
});

test("R12: the question is for the lowest tap, and only that tap is shown above it", async () => {
  assert.deepEqual((await lastTaps(unreachable, lowManager)).map((m) => m.text), [managerOpener("Very hard")]);
});

test("R12: on a tie the first lowest tap in question order picks the question", async () => {
  assert.deepEqual((await lastTaps(blocked, tied)).map((m) => m.text), [managerOpener("Quite hard")]);
});

test("R12, R13: a safety keyword in the answer sends the Speak Up message and no question", async () => {
  await taps(keyword, lowRole);
  assert.deepEqual(await answer(keyword, "The agent holds my passport"), [speakUp]);
  const [reply] = await openReply(keyword);
  const { data: alert } = await db.from("escalations").select("category, source").eq("response_id", reply.id).single();
  assert.deepEqual(alert, { category: "forced_labour_indicator", source: "keyword" });
});

test("R12, R13: the AI's serious concern flag on the answer sends the Speak Up message and no question", async () => {
  await scriptModel("omniroute:chat", [
    { kind: "json", content: turn({ action: "done", serious_concern: true, concern_category: "bullying_threats", stop_reason: "serious_concern" }) },
  ]);
  await taps(flagged, lowRole);
  assert.deepEqual(await answer(flagged, "My lead says he will make sure I fail probation if I complain"), [speakUp]);
  const [reply] = await openReply(flagged);
  const { data: alert } = await db.from("escalations").select("category, source").eq("response_id", reply.id).single();
  assert.deepEqual(alert, { category: "bullying_threats", source: "model" });
});

test("R12: with no low tap the fixed light question comes under a good-taps line, and Skip ends the check-in", async () => {
  assert.deepEqual((await lastTaps(light, allHigh)).map((m) => m.text), [`Your taps look good.\n\nWhat one thing would make next week easier for you?\n\n${optional}`]);
  const before = (await sentTo(light)).length;
  await tap(light, "Skip");
  assert.deepEqual(((await sentTo(light)).slice(before) as Message[]).map((m) => m.text), [remarks]);
  assert.deepEqual(await openReply(light), []);
});

test("R63: the last question takes one message, the bot only says thanks, and HR gets it as its own reply", async () => {
  await scriptModel("omniroute", [{ kind: "json", content: classifierTag({ drivers: ["ONBOARDING"], evidence_quote: "The canteen closes before my shift ends" }) }]);
  assert.deepEqual(await answer(light, "The canteen closes before my shift ends"), [thanks]);
  const { data: who } = await db.from("people").select("id").eq("telegram_chat_id", light).single();
  const { data: rows } = await db.from("responses").select("question_id").eq("person_id", who!.id).not("text_encrypted", "is", null);
  assert.deepEqual(rows, [{ question_id: "REMARKS" }]);
});
