import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { before, test } from "node:test";
import {
  appUrl,
  classifierTag,
  db,
  freezeClock,
  hrActor,
  hrRequest,
  hrToken,
  joined,
  resetDemo,
  say,
  scriptModel,
  sentTo,
  sessionClient,
  tap,
  tapScore,
} from "./helpers.ts";

const read = (path: string) => JSON.parse(readFileSync(new URL(path, import.meta.url), "utf8"));
const en = read("../data/packs/en.json");
const [organisation] = read("../data/seed/organisations.json");
const contacts = organisation.escalation_contacts;
const seeded = new Set(read("../data/seed/escalations.json").map((e: { id: string }) => e.id));
const [crisis, passport, epf, modelOnly, plain, onScale, scale, mixed, retried, held] = [401, 402, 403, 404, 405, 406, 407, 408, 409, 410].map(
  (n) => 5550000000 + n,
);

async function reachOpenQuestion(chat: number) {
  await tapScore(chat, 4);
  await tapScore(chat, 3);
  await tapScore(chat, 5);
  await tapScore(chat, 3);
  await tapScore(chat, 3);
  await tapScore(chat, 3);
}

async function answer(chat: number, text: string) {
  const before = (await sentTo(chat)).length;
  await say(chat, text);
  return (await sentTo(chat)).slice(before).map((m) => String(m.text));
}

async function openResponse(chat: number) {
  const { data: who } = await db.from("people").select("id").eq("telegram_chat_id", chat).single();
  const { data } = await db
    .from("responses")
    .select("id")
    .eq("person_id", who!.id)
    .eq("question_id", "OPEN")
    .single();
  return data!.id as string;
}

async function escalations() {
  const res = await hrRequest("/api/hr/escalations", "GET");
  assert.equal(res.status, 200);
  return ((await res.json()) as Record<string, unknown>[]).filter((e) => !seeded.has(e.id));
}

async function escalationFor(chat: number) {
  const responseId = await openResponse(chat);
  return (await escalations()).find((row) => row.response_id === responseId)!;
}

before(async () => {
  await resetDemo();
  await freezeClock("2026-10-15T15:00:00.000Z");
  await Promise.all([crisis, passport, epf, modelOnly, plain, onScale, scale, mixed, retried, held].map((chat) => joined(chat, "2026-10-02")));
  const res = await hrRequest("/api/hr/demo/outreach", "POST", { touchpoint: 14 });
  assert.equal((await res.json()).sent, 10);
  for (const chat of [crisis, passport, epf, modelOnly, plain, mixed, retried, held]) await reachOpenQuestion(chat);
});

test("R13, R14: a crisis reply escalates by keyword while the model times out, and the hire gets only the short Contoh Speak Up message, with no 999, helpline or contact question", async () => {
  await scriptModel("omniroute", [{ kind: "timeout" }]);
  await scriptModel("deepseek", [{ kind: "timeout" }]);
  const replies = await answer(crisis, "I can't take it anymore, I want to kill myself");
  assert.deepEqual(replies, ["Thank you for telling us. This is serious. Please report it to HR through Contoh Speak Up. You can stay 100% anonymous.\nContoh Speak Up (HR): speakup.contoh.com.my\nEmail: speakup@contoh.com.my\nPhone, 24 hours: 04-5555 0199"]);
  assert.equal((await sentTo(crisis)).at(-1)!.reply_markup, undefined);

  const alert = await escalationFor(crisis);
  assert.equal(alert.category, "self_harm_crisis");
  assert.equal(alert.source, "keyword");
});

test("R14, R12: a passport held by the agent escalates by keyword with the same HR complaint message and no outside authority, and no probe follows", async () => {
  await scriptModel("omniroute", [
    { kind: "json", content: classifierTag({ evidence_quote: "The agent holds my passport", probe_id: "ROLE_CLARITY" }) },
  ]);
  const replies = await answer(passport, "The agent holds my passport");
  assert.deepEqual(replies, [[en.safety.message, ...contacts.general].join("\n")]);

  const alert = await escalationFor(passport);
  assert.equal(alert.category, "forced_labour_indicator");
  assert.equal(alert.source, "keyword");
});

test("R13: EPF and SOCSO taken from the pay alone does not escalate by keyword", async () => {
  const replies = await answer(epf, "EPF and SOCSO were taken from my pay");
  assert.deepEqual(replies, [en.checkin.gotIt]);
  assert.equal((await escalations()).length, 2);
});

test("R13, R12: the model alone escalates, and no probe follows", async () => {
  await scriptModel("omniroute", [
    {
      kind: "json",
      content: classifierTag({
        drivers: ["MANAGER_SUPPORT"],
        escalate: true,
        escalate_category: "bullying_threats",
        evidence_quote: "shouts at me every day",
        probe_id: "GENERIC_MORE",
      }),
    },
  ]);
  const replies = await answer(modelOnly, "My supervisor shouts at me every day and says I will regret it");
  assert.equal(replies.length, 1);
  assert.ok(replies[0].includes(en.safety.message));
  const alert = await escalationFor(modelOnly);
  assert.equal(alert.category, "bullying_threats");
  assert.equal(alert.source, "model");
});

test("R7: a manager gets nothing for escalations, and an escalated reply is in no theme count", async () => {
  await scriptModel("omniroute", [{ kind: "json", content: classifierTag({ evidence_quote: "not sure what to do first" }) }]);
  assert.deepEqual(await answer(plain, "Too many tasks, not sure what to do first"), [en.checkin.thanks]);

  const escalated = await openResponse(passport);
  const { data: tag } = await db.from("ai_tags").select("status, drivers").eq("response_id", escalated).single();
  assert.deepEqual(tag, { status: "ok", drivers: ["ROLE_CLARITY"] });
  for (const id of [escalated, await openResponse(plain)]) {
    assert.equal((await hrRequest(`/api/hr/replies/${id}/review`, "POST")).status, 200);
  }
  const themes = await (await hrRequest("/api/hr/themes", "GET")).json();
  const card = themes.cards.find((c: { driver: string }) => c.driver === "ROLE_CLARITY");
  assert.deepEqual({ n: card.n, m: card.m }, { n: 24, m: 65 });

  const manager = await hrToken("raj@contoh.test");
  const res = await fetch(`${appUrl}/api/hr/escalations`, { headers: { authorization: `Bearer ${manager}` } });
  assert.equal(res.status, 401);

  const asManager = await sessionClient("raj@contoh.test");
  for (const table of ["escalations", "responses", "ai_tags", "theme_tags"]) {
    const { data, error } = await asManager.from(table).select("*");
    assert.equal(error, null);
    assert.deepEqual(data, []);
  }
  const { count } = await asManager.from("escalations").select("*", { count: "exact", head: true });
  assert.equal(count, 0);

  const asHr = await sessionClient("hr@contoh.test");
  const { data: hrRows } = await asHr.from("escalations").select("category").order("created_at");
  assert.equal(hrRows!.length, seeded.size + 3);
});

test("R30, R13: a passport message typed while a 1-5 question is open gets the safety message and an escalation, and the question stays open", async () => {
  const replies = await answer(onScale, "The agent holds my passport");
  assert.equal(replies.length, 1);
  assert.ok(replies[0].includes(en.safety.message));
  const { data: who } = await db.from("people").select("id").eq("telegram_chat_id", onScale).single();
  const { data: stored } = await db.from("responses").select("id, kind").eq("person_id", who!.id);
  assert.deepEqual(stored!.map((row) => row.kind), ["unprompted"]);
  const alert = (await escalations()).find((row) => row.response_id === stored![0].id)!;
  assert.equal(alert.category, "forced_labour_indicator");
  const { data: schedule } = await db.from("checkin_schedule").select("progress, status").eq("person_id", who!.id).eq("touchpoint", 14);
  assert.deepEqual(schedule, [{ progress: 0, status: "sent" }]);
});

async function responsesOf(chat: number) {
  const { data: who } = await db.from("people").select("id").eq("telegram_chat_id", chat).single();
  const { data } = await db.from("responses").select("id").eq("person_id", who!.id);
  return data!.map((row) => row.id as string);
}

test("R13, R14: a disclosure typed while a 1-5 question is open escalates by keyword with the HR complaint message", async () => {
  const replies = await answer(scale, "The agent holds my passport");
  assert.equal(replies.length, 1);
  assert.ok(replies[0].includes(en.safety.message));
  const [responseId] = await responsesOf(scale);
  const alert = (await escalations()).find((row) => row.response_id === responseId)!;
  assert.equal(alert.category, "forced_labour_indicator");
});

test("R13, R14: a Manglish passport report with an English threat still escalates with the HR complaint message", async () => {
  const replies = await answer(mixed, "Ejen simpan pasport saya and boss threatened to cut my pay");
  assert.equal(replies.length, 1);
  assert.ok(replies[0].includes(en.safety.message));
  assert.equal((await escalationFor(mixed)).category, "forced_labour_indicator");
});

test("R13: HR retry of a reply that waited for AI escalates when the model now flags it, and the hire gets the safe message", async () => {
  const text = "My supervisor says I will regret it if I complain to anyone";
  assert.deepEqual(await answer(retried, text), [en.checkin.gotIt]);
  await scriptModel("omniroute", [
    { kind: "json", content: classifierTag({ escalate: true, escalate_category: "bullying_threats", evidence_quote: text }) },
  ]);
  const before = (await sentTo(retried)).length;
  const res = await hrRequest(`/api/hr/replies/${await openResponse(retried)}/retry`, "POST");
  assert.equal(res.status, 200);
  const sent = (await sentTo(retried)).slice(before).map((m) => String(m.text));
  assert.equal(sent.length, 1);
  assert.ok(sent[0].includes(en.safety.message));
  const alert = await escalationFor(retried);
  assert.equal(alert.category, "bullying_threats");
  assert.equal(alert.source, "model");
});

test("R13, R15: a model escalation with a bad quote still escalates when the retry finds both providers down", async () => {
  const text = "My team lead screams at me in front of everyone and says I will regret it";
  await scriptModel("omniroute", [
    { kind: "json", content: classifierTag({ escalate: true, escalate_category: "bullying_threats", evidence_quote: "not in the reply" }) },
  ]);
  const replies = await answer(held, text);
  assert.equal(replies.length, 1);
  assert.ok(replies[0].includes(en.safety.message));
  assert.equal((await escalationFor(held)).category, "bullying_threats");
});

test("R25, R7: opening a case returns the reply and what the bot sent and writes an audit row, and a manager is refused", async () => {
  const alert = await escalationFor(passport);
  const res = await hrRequest(`/api/hr/escalations/${alert.id}`, "GET");
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.text, "The agent holds my passport");
  assert.equal(body.category, "forced_labour_indicator");
  assert.ok(body.sent_by_bot.join("\n").includes(en.safety.message));
  const { data: rows } = await db.from("audit_log").select("action, at").eq("target", alert.response_id).eq("action", "read_reply_text").eq("actor", await hrActor());
  assert.deepEqual(rows, [{ action: "read_reply_text", at: "2026-10-15T15:00:00+00:00" }]);

  const manager = await hrToken("raj@contoh.test");
  const denied = await fetch(`${appUrl}/api/hr/escalations/${alert.id}`, { headers: { authorization: `Bearer ${manager}` } });
  assert.equal(denied.status, 401);
});
