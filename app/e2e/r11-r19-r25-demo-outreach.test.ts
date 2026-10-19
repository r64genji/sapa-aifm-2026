import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { before, test } from "node:test";
import { classifierTag, db, freezeClock, hrRequest, link, resetDemo, say, scriptModel, sentTo, tap, tapScore, liveInvite, chatPerson } from "./helpers.ts";

const en = JSON.parse(readFileSync(new URL("../data/packs/en.json", import.meta.url), "utf8"));
const question = (id: string) => en.checkin.questions.find((q: { id: string }) => q.id === id).text;
const live = 5550000201;
const synthetic = 5550009001;
const reply = "Boss bagi 3 task semua urgent, tak tahu mana nak buat dulu";

before(async () => {
  await resetDemo();
  await freezeClock("2026-10-15T15:00:00.000Z");
});

test("R19, R23: Outreach now sends the chosen check-in to the live hire only, at night", async () => {
  await link(live, liveInvite);
  await tap(live, "English");
  await tap(live, en.agree);
  const before = (await sentTo(live)).length;

  const res = await hrRequest("/api/hr/demo/outreach", "POST", { touchpoint: 14 });
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { sent: 1 });

  const texts = (await sentTo(live)).map((m) => m.text).slice(before);
  assert.deepEqual(texts, [en.checkin.intro, question("ROLE_CLARITY")]);
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
    question("ONBOARDING_TRAINING"),
    question("WORKLOAD"),
    question("JOB_MATCH"),
    en.checkin.chat.light,
    en.checkin.thanks,
  ]);

  const { data: rows } = await db
    .from("responses")
    .select("question_id, scale_value, text_encrypted")
    .eq("person_id", (await chatPerson(live)).id);
  const byQuestion = Object.fromEntries(rows!.map((r) => [r.question_id, r]));
  assert.deepEqual(
    ["ROLE_CLARITY", "MANAGER_SUPPORT", "BELONGING", "ONBOARDING_TRAINING", "WORKLOAD", "JOB_MATCH"].map((id) => byQuestion[id].scale_value),
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
  assert.deepEqual(texts, [en.checkin.intro, question("ROLE_CLARITY")]);
});
