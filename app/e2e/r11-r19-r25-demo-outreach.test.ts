import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { before, test } from "node:test";
import { appUrl, classifierTag, db, freezeClock, hrRequest, hrToken, link, resetDemo, say, scriptModel, sentTo, tap, tapScore, liveInvite, chatPerson, tapData } from "./helpers.ts";

const en = JSON.parse(readFileSync(new URL("../data/packs/en.json", import.meta.url), "utf8"));
const question = (id: string) => en.checkin.questions.find((q: { id: string }) => q.id === id).text;
const live = 5550000201;
const synthetic = 5550009001;
const reply = "Boss bagi 3 task semua urgent, tak tahu mana nak buat dulu";

before(async () => {
  await resetDemo();
  await freezeClock("2026-10-15T15:00:00.000Z");
});

test("R19, R23: Outreach now sends the chosen check-in to a joined phone, not to synthetic hires, at night", async () => {
  await link(live, liveInvite);
  await tap(live, "English");
  await tap(live, en.agree);
  await tapData(live, 'chat:{"a":"privacy","v":"named"}');
  await say(live, "Test Hire");
  const before = (await sentTo(live)).length;

  const res = await hrRequest("/api/hr/demo/outreach", "POST", { touchpoint: 14 });
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { sent: 1 });

  const texts = (await sentTo(live)).map((m) => m.text).slice(before);
  assert.deepEqual(texts, [en.checkin.introNamed.replace("{name}", "Test Hire"), question("ROLE_CLARITY")]);
  assert.deepEqual(await sentTo(synthetic), []);
});

test("R11, R25: the check-in uses only bank text, the reply is stored encrypted, and each read is audited", async () => {
  const before = (await sentTo(live)).length;
  await tapScore(live, 4);
  await tapScore(live, 3);
  await tapScore(live, 5);
  await tapScore(live, 3);
  await tapScore(live, 3);
  await tapScore(live, 3);
  await scriptModel("omniroute", [{ kind: "json", content: classifierTag() }]);
  await say(live, reply);
  const texts = (await sentTo(live)).map((m) => m.text).slice(before);
  assert.deepEqual(texts.map((text) => String(text).replace(/^You tapped "[^"]*"\. /, "")), [
    question("MANAGER_SUPPORT"),
    question("BELONGING"),
    question("ONBOARDING"),
    question("TRAINING"),
    question("WORKLOAD"),
    en.checkin.chat.wait,
    `You tapped "Some" for support from your manager and "Somewhat clear" for your onboarding and work environment.\n\n${en.checkin.probe.topics.MANAGER_SUPPORT.open}\n\n${en.checkin.chat.optional}`,
    en.checkin.chat.remarks,
  ]);

  const { data: rows } = await db
    .from("responses")
    .select("question_id, scale_value, text_encrypted")
    .eq("person_id", (await chatPerson(live)).id);
  const byQuestion = Object.fromEntries(rows!.map((r) => [r.question_id, r]));
  assert.deepEqual(
    ["ROLE_CLARITY", "MANAGER_SUPPORT", "BELONGING", "ONBOARDING", "TRAINING", "WORKLOAD"].map((id) => byQuestion[id].scale_value),
    [4, 3, 5, 3, 3, 3],
  );
  assert.ok(byQuestion.OPEN.text_encrypted);
  assert.ok(!byQuestion.OPEN.text_encrypted.includes("urgent"));
  const { data: schedule } = await db.from("checkin_schedule").select("status").eq("touchpoint", 14).eq("person_id", (await chatPerson(live)).id);
  assert.deepEqual(schedule, [{ status: "answered" }]);

  const read = await hrRequest("/api/hr/replies", "GET");
  assert.equal(read.status, 200);
  const body = await read.json();
  const mine = body.filter((r: { text: string }) => r.text === reply);
  assert.deepEqual(mine.map((r: { question_id: string; text: string }) => [r.question_id, r.text]), [["OPEN", reply]]);
  const { data: audit } = await db.from("audit_log").select("action, target").eq("action", "read_reply_text");
  assert.equal(audit!.length, body.length);
  assert.deepEqual(audit!.filter((row) => row.target === mine[0].id), [{ action: "read_reply_text", target: mine[0].id }]);
});

test("R19: Outreach now sends the Day 30 check-in at once, whatever its due date", async () => {
  const before = (await sentTo(live)).length;
  const res = await hrRequest("/api/hr/demo/outreach", "POST", { touchpoint: 30 });
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { sent: 1 });
  const texts = (await sentTo(live)).map((m) => m.text).slice(before);
  assert.deepEqual(texts, [en.checkin.introNamed.replace("{name}", "Test Hire"), question("ROLE_CLARITY")]);
});

test("R19: Outreach now sends the check-in to every joined phone", async () => {
  await resetDemo();
  await freezeClock("2026-10-15T15:00:00.000Z");
  const second = 5550000202;
  for (const chat of [live, second]) {
    await link(chat, liveInvite);
    await tap(chat, "English");
    await tap(chat, en.agree);
    await tapData(chat, 'chat:{"a":"privacy","v":"named"}');
    await say(chat, "Test Hire");
  }
  const before = [(await sentTo(live)).length, (await sentTo(second)).length];

  const res = await hrRequest("/api/hr/demo/outreach", "POST", { touchpoint: 14 });
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { sent: 2 });

  const texts = async (chat: number, from: number) => (await sentTo(chat)).map((m) => m.text).slice(from);
  assert.deepEqual(await texts(live, before[0]), [en.checkin.introNamed.replace("{name}", "Test Hire"), question("ROLE_CLARITY")]);
  assert.deepEqual(await texts(second, before[1]), [en.checkin.introNamed.replace("{name}", "Test Hire"), question("ROLE_CLARITY")]);
});

test("Bug fix: for a phone that just joined, Outreach now offers the Day 14 check-in that the home cards count", async () => {
  await resetDemo();
  await freezeClock("2026-10-15T15:00:00.000Z");
  await link(live, liveInvite);
  await tap(live, "English");
  await tap(live, en.agree);
  await tapData(live, 'chat:{"a":"privacy","v":"named"}');
  await say(live, "Test Hire");

  const res = await fetch(`${appUrl}/api/hr/demo/status`, { headers: { authorization: `Bearer ${await hrToken("admin@contoh.test")}` } });
  assert.equal(res.status, 200);
  assert.equal((await res.json()).live_hire.next_check_in.touchpoint, 14);
});

test("Bug fix: tapping the same word twice sends the next question once", async () => {
  const res = await hrRequest("/api/hr/demo/outreach", "POST", { touchpoint: 14 });
  assert.equal(res.status, 200);
  const label = en.checkin.questions.find((q: { id: string }) => q.id === "ROLE_CLARITY").labels[3];
  const before = (await sentTo(live)).length;
  await tap(live, label);
  await tap(live, label);
  const texts = (await sentTo(live)).map((m) => m.text).slice(before);
  assert.deepEqual(texts, [`You tapped "${label}". ${question("MANAGER_SUPPORT")}`]);
});

test("R19: Outreach now skips a check-in the phone left open and sends the next one", async () => {
  await resetDemo();
  await freezeClock("2026-10-15T15:00:00.000Z");
  await link(live, liveInvite);
  await tap(live, "English");
  await tap(live, en.agree);
  await tapData(live, 'chat:{"a":"privacy","v":"named"}');
  await say(live, "Test Hire");
  assert.equal((await hrRequest("/api/hr/demo/outreach", "POST", { touchpoint: 14 })).status, 200);

  const before = (await sentTo(live)).length;
  const res = await hrRequest("/api/hr/demo/outreach", "POST", { touchpoint: 30 });
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { sent: 1 });
  const texts = (await sentTo(live)).map((m) => m.text).slice(before);
  assert.deepEqual(texts, [en.checkin.introNamed.replace("{name}", "Test Hire"), question("ROLE_CLARITY")]);
  const { data: rows } = await db.from("checkin_schedule").select("touchpoint, status").in("touchpoint", [14, 30]).eq("person_id", (await chatPerson(live)).id).order("touchpoint");
  assert.deepEqual(rows, [{ touchpoint: 14, status: "skipped" }, { touchpoint: 30, status: "sent" }]);
});

test("Bug fix: when the first phone that joined has stopped, the demo bar offers no check-in that no phone can get", async () => {
  await resetDemo();
  await freezeClock("2026-10-15T15:00:00.000Z");
  await link(live, liveInvite);
  await tap(live, "English");
  await tap(live, en.agree);
  await tapData(live, 'chat:{"a":"privacy","v":"named"}');
  await say(live, "Test Hire");
  await say(live, "/stop");

  const res = await fetch(`${appUrl}/api/hr/demo/status`, { headers: { authorization: `Bearer ${await hrToken("admin@contoh.test")}` } });
  assert.equal(res.status, 200);
  assert.equal((await res.json()).live_hire.next_check_in, null);
});
