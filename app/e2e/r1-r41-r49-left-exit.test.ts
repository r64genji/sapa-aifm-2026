import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { before, test } from "node:test";
import {
  classifierTag,
  db,
  dispatch,
  freezeClock,
  hrRequest,
  joined,
  resetDemo,
  say,
  scriptModel,
  sentTo,
  settle,
  tap,
  tapData,
} from "./helpers.ts";

const en = JSON.parse(readFileSync(new URL("../data/packs/en.json", import.meta.url), "utf8"));
const generic = "This person is not receiving messages from Sapa now";
const retention = "2027-04-16";
const [ticked, unticked, company, safety, replier, stopper, control] = [701, 702, 703, 704, 705, 706, 707].map(
  (n) => 5550000000 + n,
);
const names: Record<number, string> = {};
const texts = async (chat: number) => (await sentTo(chat)).map((m) => m.text);
const markLeft = (chat: number, reason: string) =>
  hrRequest("/api/hr/hires/left", "POST", { code_name: names[chat], reason });

async function personId(chat: number) {
  const { data } = await db.from("people").select("id").eq("telegram_chat_id", chat).single();
  return data!.id as string;
}

async function exitRows(chat: number) {
  const { data } = await db.from("responses").select("id, question_id").eq("person_id", await personId(chat)).eq("kind", "exit").order("created_at");
  return data!;
}

async function reply(chat: number, text: string) {
  const before = (await sentTo(chat)).length;
  await say(chat, text);
  for (let i = 0; i < 60 && (await sentTo(chat)).length === before; i++) await settle(500);
  await settle();
}

before(async () => {
  await resetDemo();
  await freezeClock("2026-10-15T15:00:00.000Z");
  await db.from("organisations").update({ demo_mode: false }).neq("id", "00000000-0000-0000-0000-000000000000");
  for (const chat of [ticked, unticked, company, safety, replier, stopper, control]) {
    await joined(chat, "2026-10-02");
    await tap(chat, en.visibilityHrOnly);
    await tap(chat, chat === unticked || chat === control ? en.exitNo : en.exitYes);
    const { data } = await db.from("people").select("code_name").eq("telegram_chat_id", chat).single();
    names[chat] = data!.code_name;
  }
  await freezeClock("2026-10-16T02:00:00.000Z");
});

test("R1: after resigned or ended by the company, dispatch sends only the fixed end text with the retention date", async () => {
  assert.equal((await markLeft(ticked, "resigned")).status, 200);
  assert.equal((await markLeft(unticked, "resigned")).status, 200);
  assert.equal((await markLeft(company, "ended_by_company")).status, 200);
  assert.equal((await markLeft(safety, "resigned")).status, 200);
  assert.equal((await markLeft(company, "resigned")).status, 409);

  const before = Object.fromEntries(await Promise.all([ticked, unticked, company, safety, control].map(async (c) => [c, (await sentTo(c)).length])));
  await dispatch();
  const end = en.end.replace("{date}", retention);
  const sent = async (chat: number) => (await texts(chat)).slice(before[chat]);
  assert.deepEqual(await sent(unticked), [end]);
  assert.deepEqual(await sent(company), [end]);
  assert.deepEqual(await sent(ticked), [end, en.exit.question]);
  assert.deepEqual(await sent(control), [en.checkin.intro, en.checkin.questions[0].text]);

  const { data: open } = await db.from("checkin_schedule").select("id").eq("person_id", await personId(ticked)).in("status", ["scheduled", "sent", "reminded"]);
  assert.deepEqual(open, []);

  await freezeClock("2026-12-01T02:00:00.000Z");
  const counts = Object.fromEntries(await Promise.all([ticked, unticked, company].map(async (c) => [c, (await sentTo(c)).length])));
  await dispatch();
  for (const chat of [ticked, unticked, company]) assert.equal((await sentTo(chat)).length, counts[chat]);
  await freezeClock("2026-10-16T02:00:00.000Z");
});

test("R49: the hire who ticked gets one question; its answer is tagged as an exit reply and is in no check-in theme", async () => {
  const counts = async () =>
    (((await (await hrRequest("/api/hr/themes", "GET")).json()) as { cards: Record<string, unknown>[] }).cards).map(({ note, ...card }) => card);
  const themes = await counts();
  await tap(ticked, "Workload");
  assert.equal((await texts(ticked)).at(-1), en.exit.open);
  await scriptModel("omniroute", [
    { kind: "json", content: classifierTag({ drivers: ["WORKLOAD"], concern_level: "none", evidence_quote: "too many hours" }) },
  ]);
  await reply(ticked, "I left because of too many hours");
  assert.equal((await texts(ticked)).at(-1), en.exit.thanks);

  const rows = await exitRows(ticked);
  assert.deepEqual(rows.map((r) => r.question_id), ["exit.WORKLOAD", "exit_open"]);
  const { data: tag } = await db.from("ai_tags").select("status, drivers").eq("response_id", rows[1].id).single();
  assert.deepEqual(tag, { status: "ok", drivers: ["WORKLOAD"] });
  const reviewed = await hrRequest(`/api/hr/replies/${rows[1].id}/review`, "POST", { drivers: ["WORKLOAD"] });
  assert.equal(reviewed.status, 200);
  assert.deepEqual(await counts(), themes);

  const after = (await texts(ticked)).length;
  await reply(ticked, "one more thing");
  await tapData(ticked, 'chat:{"a":"exit","v":"BELONGING"}');
  assert.equal((await texts(ticked)).length, after);
  assert.equal((await exitRows(ticked)).length, 2);
});

test("R49: a hire who did not tick, and one ended by the company even with the tick, get no question and keep no exit answer", async () => {
  for (const chat of [unticked, company]) {
    await reply(chat, "I left because of too many hours");
    await tapData(chat, 'chat:{"a":"exit","v":"WORKLOAD"}');
    assert.deepEqual(await exitRows(chat), []);
    assert.ok(!(await texts(chat)).includes(en.exit.question));
  }
});

test("R49, R13: an exit answer goes through the safety check", async () => {
  await tap(safety, "Manager support");
  await reply(safety, "The unsafe machine hurt my friend");
  const escalations = (await (await hrRequest("/api/hr/escalations", "GET")).json()) as { response_id: string; category: string }[];
  const rows = await exitRows(safety);
  assert.deepEqual(
    escalations.filter((e) => e.response_id === rows[1].id).map((e) => e.category),
    ["safety_hazard"],
  );
  assert.notEqual((await texts(safety)).at(-1), en.exit.thanks);
});

test("R41: an offer to a hire who left shows the same generic reason as for one who stopped", async () => {
  await freezeClock("2026-10-16T02:00:00.000Z");
  for (const chat of [replier, stopper]) {
    await tap(chat, "4");
    await tap(chat, "3");
    await tap(chat, "5");
    await scriptModel("omniroute", [{ kind: "json", content: classifierTag() }]);
    await reply(chat, "tak tahu mana nak buat dulu");
  }
  const replies = async (chat: number) => {
    const { data } = await db.from("responses").select("id").eq("person_id", await personId(chat)).eq("kind", "checkin").not("text_encrypted", "is", null);
    return data![0].id as string;
  };
  await say(stopper, "/stop");
  assert.equal((await markLeft(replier, "resigned")).status, 200);
  const results = [];
  for (const chat of [replier, stopper]) {
    const res = await hrRequest(`/api/hr/replies/${await replies(chat)}/offer`, "POST");
    results.push([res.status, await res.json()]);
  }
  assert.deepEqual(results, [
    [409, { error: generic, code: 409 }],
    [409, { error: generic, code: 409 }],
  ]);
});
