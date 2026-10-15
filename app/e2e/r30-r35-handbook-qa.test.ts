import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { before, test } from "node:test";
import {
  addHire,
  appUrl,
  classifierTag,
  db,
  freezeClock,
  hrRequest,
  hrToken,
  joined,
  link,
  modelCalls,
  resetDemo,
  say,
  scriptModel,
  sentTo,
  settle,
  tap,
  tapData,
} from "./helpers.ts";

const read = (path: string) => JSON.parse(readFileSync(new URL(path, import.meta.url), "utf8"));
const en = read("../data/packs/en.json");
const zh = read("../data/packs/zh.json");
const [organisation] = read("../data/seed/organisations.json");
const hrLine = organisation.escalation_contacts.general[0];
const groups: { id: string; text: string }[] = read("../data/seed/question_groups.json");
const groupId = (text: string) => groups.find((g) => g.text === text)!.id;
const overtimeGroup = groupId("How do I claim overtime?");
const paydayGroup = groupId("When is my first payday?");
const pages: { path: string; language: string; body: string; status: string }[] = read("../data/seed/handbook_pages.json");
const overtimeBody = pages.find((p) => p.path === "pay/overtime.md" && p.language === "en")!.body;
const overtimeQuote =
  "To claim overtime, fill in the overtime form on the same day and give it to your supervisor for signing.";
const draftBody = pages.find((p) => p.status === "draft")!.body;
const [overtime, wrongQuote, draft, payDispute, crisis, payday, repeater, down, feedback, memo] = [
  1301, 1302, 1303, 1304, 1305, 1306, 1307, 1308, 1309, 1310,
].map((n) => 5550000000 + n);

const output = (fields: Record<string, unknown> = {}) => ({
  kind: "question",
  important_topic: "none",
  answer: "",
  cited_path: "",
  supporting_quote: "",
  group: { id: "new", text: "A neutral question" },
  ...fields,
});

const overtimeOutput = (fields: Record<string, unknown> = {}) =>
  output({
    answer: "Fill in the overtime form on the same day and give it to your supervisor.",
    cited_path: "pay/overtime.md",
    supporting_quote: overtimeQuote,
    group: { id: overtimeGroup, text: "" },
    ...fields,
  });

async function script(...contents: unknown[]) {
  await scriptModel("omniroute", contents.map((content) => ({ kind: "json" as const, content })));
}

async function ask(chat: number, text: string) {
  const before = (await sentTo(chat)).length;
  await say(chat, text);
  for (let i = 0; i < 60 && (await sentTo(chat)).length === before; i++) await settle(500);
  await settle(300);
  return (await sentTo(chat)).slice(before).map((m) => String(m.text));
}

async function personId(chat: number) {
  const { data } = await db.from("people").select("id").eq("telegram_chat_id", chat).single();
  return data!.id as string;
}

async function asked(chat: number) {
  const { data } = await db
    .from("asked_questions")
    .select("outcome, important_topic, cited_path, group_id")
    .eq("person_id", await personId(chat))
    .order("created_at");
  return data!;
}

async function questions() {
  const res = await hrRequest("/api/hr/questions", "GET");
  assert.equal(res.status, 200);
  return (await res.json()) as {
    groups: { id: string; text: string; askers: number; answered: number; unknown: number; handbook_path: string | null }[];
    other: { questions: number; text: string };
    topics: { topic: string; askers: number }[];
  };
}

async function answerPrompt() {
  const calls = await modelCalls("omniroute");
  return calls.at(-1)!.body.messages.map((m) => m.content).join("\n");
}

before(async () => {
  await resetDemo();
  await freezeClock("2026-10-15T15:00:00.000Z");
  for (const chat of [overtime, wrongQuote, draft, payDispute, crisis, payday, repeater, down, feedback]) {
    await joined(chat, "2026-10-14");
  }
  await joined(memo, "2026-10-02");
});

test("R31: 'How do I claim overtime?' gets a grounded answer with the AI label, the quote, the page and the HR contact", async () => {
  await script(overtimeOutput());
  const replies = await ask(overtime, "How do I claim overtime?");
  assert.deepEqual(replies, [
    [
      en.qa.label,
      "Fill in the overtime form on the same day and give it to your supervisor.",
      `${en.qa.from} "${overtimeQuote}" (pay/overtime.md)`,
      `${en.qa.hr} ${hrLine}`,
    ].join("\n"),
  ]);
  assert.deepEqual(await asked(overtime), [
    { outcome: "answered", important_topic: null, cited_path: "pay/overtime.md", group_id: overtimeGroup },
  ]);
  const prompt = await answerPrompt();
  assert.ok(prompt.includes(overtimeBody.split("\n\n")[1]));
  assert.ok(!prompt.includes(draftBody.split("\n\n")[1]));
});

test("R31: a quote that is not in the cited page gets 'I don't know yet' and is logged as unknown", async () => {
  await script(
    overtimeOutput({
      supporting_quote: "Overtime is paid at double rate on Sundays.",
      group: { id: "new", text: "Is overtime paid double on Sundays?" },
    }),
  );
  const replies = await ask(wrongQuote, "Is overtime double on Sunday?");
  assert.deepEqual(replies, [en.qa.unknown]);
  const rows = await asked(wrongQuote);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].outcome, "unknown");
});

test("R31: a draft page is never cited, and is quoted only after HR publishes it", async () => {
  const body = "# Parking\n\nMotorbikes may park in the yard behind the canteen. Cars may not park inside the gate.";
  const quote = "Motorbikes may park in the yard behind the canteen.";
  const saved = await hrRequest("/api/hr/handbook", "PUT", { path: "facilities/parking.md", language: "en", body });
  assert.equal(saved.status, 200);
  const parking = output({
    answer: "Motorbikes park in the yard behind the canteen.",
    cited_path: "facilities/parking.md",
    supporting_quote: quote,
  });

  await script(parking);
  assert.deepEqual(await ask(draft, "Where can I park my motorbike?"), [en.qa.unknown]);
  assert.ok(!(await answerPrompt()).includes("yard behind the canteen"));

  const published = await hrRequest("/api/hr/handbook/status", "POST", {
    path: "facilities/parking.md",
    language: "en",
    status: "published",
  });
  assert.equal(published.status, 200);
  await script(parking);
  const replies = await ask(draft, "Where can I park my motorbike?");
  assert.ok(replies[0].includes(`${en.qa.from} "${quote}" (facilities/parking.md)`));
  assert.ok((await answerPrompt()).includes("yard behind the canteen"));

  const manager = await hrToken("raj@contoh.test");
  const res = await fetch(`${appUrl}/api/hr/handbook`, { headers: { authorization: `Bearer ${manager}` } });
  assert.equal(res.status, 401);
});

test("R32: a pay dispute gets the important-matter message, no AI answer and no escalation", async () => {
  await script(output({ important_topic: "pay_problem", answer: "Talk to payroll.", cited_path: "pay/payslip.md" }));
  const replies = await ask(payDispute, "The company paid me less than my contract says, I want to dispute it");
  assert.deepEqual(replies, [[en.qa.important, ...organisation.escalation_contacts.general].join("\n")]);
  assert.ok(!replies[0].includes(en.qa.label));
  assert.deepEqual(await asked(payDispute), [
    { outcome: "important", important_topic: "pay_problem", cited_path: null, group_id: null },
  ]);
  const res = await hrRequest("/api/hr/escalations", "GET");
  assert.deepEqual(await res.json(), []);
});

test("R32, R13: a crisis message gets the safe message with no model call and opens an escalation", async () => {
  const calls = (await modelCalls("omniroute")).length;
  const replies = await ask(crisis, "I want to kill myself");
  assert.equal(replies.length, 1);
  assert.ok(replies[0].includes(en.safety.message));
  assert.ok(!replies[0].includes(en.qa.label));
  assert.equal((await modelCalls("omniroute")).length, calls);
  const escalations = (await (await hrRequest("/api/hr/escalations", "GET")).json()) as Record<string, unknown>[];
  assert.deepEqual(escalations.map((e) => e.category), ["self_harm_crisis"]);
  assert.equal((await asked(crisis))[0].important_topic, "self_harm_crisis");
});

test("R34: a group below 3 askers shows only in the total, and a third distinct asker forwards it with no names or words", async () => {
  const before = await questions();
  assert.deepEqual(before.groups.map((g) => [g.text, g.askers]), [
    ["How do I claim overtime?", 5 + 1],
    ["Where can I park my motorbike?", 3],
  ]);
  assert.equal(before.other.questions, 5);
  assert.equal(before.other.text, "5 other questions from fewer than 3 people");
  assert.equal(before.groups[1].handbook_path, null);
  assert.equal(before.groups[0].handbook_path, "pay/overtime.md");

  await script(output({ group: { id: paydayGroup, text: "" } }));
  const typed = "wen is my 1st payday ah";
  assert.deepEqual(await ask(payday, typed), [en.qa.unknown]);

  const after = await questions();
  const forwarded = after.groups.find((g) => g.id === paydayGroup)!;
  assert.equal(forwarded.askers, 3);
  assert.equal(forwarded.text, "When is my first payday?");
  assert.equal(forwarded.unknown, 3);
  assert.equal(after.other.questions, 3);
  const raw = JSON.stringify(after);
  assert.ok(!raw.includes(typed));
  assert.ok(!raw.includes(await personId(payday)));
  assert.ok(!raw.includes(String(payday)));

  const manager = await hrToken("raj@contoh.test");
  const res = await fetch(`${appUrl}/api/hr/questions`, { headers: { authorization: `Bearer ${manager}` } });
  assert.equal(res.status, 401);
});

test("R34: one person asking the same group again does not count as more askers", async () => {
  const same = output({ group: { id: "new", text: "Do we get a bonus?" } });
  await script(same);
  await ask(repeater, "Do we get a bonus?");
  const { data: created } = await db.from("question_groups").select("id").eq("text", "Do we get a bonus?").single();
  await script(output({ group: { id: created!.id, text: "" } }));
  await ask(repeater, "Is there a bonus at the end of the year?");
  await script(output({ group: { id: created!.id, text: "" } }));
  await ask(repeater, "Any bonus in December?");
  const after = await questions();
  assert.equal(after.groups.find((g) => g.id === created!.id), undefined);
  assert.equal(after.other.questions, 6);
});

test("R30: with the model down the text is stored as awaiting AI and the bot sends the fixed got-it text", async () => {
  const replies = await ask(down, "How many days of sick leave do I get?");
  assert.deepEqual(replies, [en.checkin.gotIt]);
  const { data } = await db
    .from("responses")
    .select("kind, ai_tags(status)")
    .eq("person_id", await personId(down))
    .single();
  assert.deepEqual(data, { kind: "unprompted", ai_tags: { status: "awaiting_ai" } });
  assert.deepEqual(await asked(down), []);
});

test("R30: feedback is stored as an unprompted reply, classified and thanked, and /ask forces a question", async () => {
  const text = "Boss bagi 3 task semua urgent, tak tahu mana nak buat dulu";
  await script(output({ kind: "feedback" }), classifierTag());
  assert.deepEqual(await ask(feedback, text), [en.checkin.thanks]);
  const { data } = await db
    .from("responses")
    .select("kind, ai_tags(status, drivers)")
    .eq("person_id", await personId(feedback))
    .single();
  assert.deepEqual(data, { kind: "unprompted", ai_tags: { status: "ok", drivers: ["ROLE_CLARITY"] } });
  assert.deepEqual(await asked(feedback), []);

  await script(output({ kind: "feedback" }));
  assert.deepEqual(await ask(feedback, "/ask Who do I tell about my work problem"), [en.qa.unknown]);
  assert.equal((await asked(feedback)).length, 1);
});

test("R33: the model sees at most the last 6 Q&A messages from the last 10 minutes, and never check-in replies", async () => {
  const checkinReply = "Zebra stripes everywhere, tak tahu mana nak buat dulu";
  const advance = await hrRequest("/api/hr/demo/advance", "POST", { day: 14 });
  assert.equal(advance.status, 200);
  await tap(memo, "4");
  await tap(memo, "3");
  await tap(memo, "5");
  await tap(memo, "3");
  await tap(memo, "3");
  await tap(memo, "3");
  await script(classifierTag());
  await ask(memo, checkinReply);

  const texts = [1, 2, 3, 4, 5, 6, 7].map((n) => `memory question number ${n}`);
  for (const [i, text] of [...texts, "memory question number 8"].entries()) {
    await freezeClock(`2026-10-15T15:00:0${i + 1}.000Z`);
    await script(output());
    await ask(memo, text);
  }
  const prompt = await answerPrompt();
  assert.ok(!prompt.includes("Zebra"));
  assert.ok(!prompt.includes("Q: memory question number 1"));
  for (const text of texts.slice(1)) assert.ok(prompt.includes(`Q: ${text}`));
  assert.ok(prompt.includes("memory question number 8"));

  await freezeClock("2026-10-15T15:11:00.000Z");
  await script(output());
  await ask(memo, "memory question number 9");
  const later = await answerPrompt();
  assert.ok(!later.includes("Q: memory question number"));
  await freezeClock("2026-10-15T15:00:00.000Z");
});

test("R32, R13, R14: forced labour or sexual harassment that only the model sees is escalated with its fixed outside contact", async () => {
  const [labour, harassed] = [1311, 1312].map((n) => 5550000000 + n);
  for (const chat of [labour, harassed]) await joined(chat, "2026-10-14");

  const labourText = "The agency deducts half my pay every month and the warden says I need permission to go out on Sunday";
  await script(
    output({ important_topic: "legal" }),
    classifierTag({ drivers: [], escalate: true, escalate_category: "forced_labour_indicator", evidence_quote: labourText }),
  );
  const labourReplies = await ask(labour, labourText);
  assert.equal(labourReplies.length, 1);
  assert.ok(labourReplies[0].includes(en.safety.forcedLabour));
  assert.ok(labourReplies[0].includes(en.safety.labourAuthority));

  const harassedText = "My supervisor keeps making comments about my body and wants me to stay late alone with him";
  await script(
    output({ important_topic: "harassment_bullying_discrimination" }),
    classifierTag({ drivers: [], escalate: true, escalate_category: "sexual_harassment", evidence_quote: harassedText }),
  );
  const harassedReplies = await ask(harassed, harassedText);
  assert.equal(harassedReplies.length, 1);
  assert.ok(harassedReplies[0].includes(en.safety.tribunal));

  const escalations = (await (await hrRequest("/api/hr/escalations", "GET")).json()) as Record<string, unknown>[];
  assert.deepEqual(escalations.map((e) => e.category).sort(), ["forced_labour_indicator", "self_harm_crisis", "sexual_harassment"]);
});

test("R31, R36: a Chinese question gets a Chinese answer quoting the Chinese handbook page", async () => {
  const chat = 5550001313;
  const { token } = await addHire({ code_name: "Hire ZH ask", language: "zh", start_date: "2026-10-14" });
  await link(chat, token);
  await hrRequest("/api/hr/language-packs/zh/activate", "POST", { checker_name: "Li Wei" });
  await tapData(chat, 'chat:{"a":"lang","v":"zh"}');
  await tap(chat, zh.agree);
  const quote = "申请加班费时，请在当天填写加班表格，并交给主管签字。";
  await script(
    overtimeOutput({
      answer: "请在当天填写加班表格，并交给主管签字。",
      supporting_quote: quote,
    }),
  );
  const replies = await ask(chat, "怎么申请加班费？");
  assert.deepEqual(replies, [
    [zh.qa.label, "请在当天填写加班表格，并交给主管签字。", `${zh.qa.from} "${quote}" (pay/overtime.md)`, `${zh.qa.hr} ${hrLine}`].join("\n"),
  ]);
  const prompt = await answerPrompt();
  assert.ok(prompt.includes("加班前必须获得主管批准"));
  assert.ok(!prompt.includes("(page language:"));
});
