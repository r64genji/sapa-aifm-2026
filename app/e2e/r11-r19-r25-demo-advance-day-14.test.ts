import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { before, test } from "node:test";
import { classifierTag, db, freezeClock, hrRequest, link, resetDemo, say, scriptModel, sentTo, tap, liveInvite } from "./helpers.ts";

const en = JSON.parse(readFileSync(new URL("../data/packs/en.json", import.meta.url), "utf8"));
const question = (id: string) => en.checkin.questions.find((q: { id: string }) => q.id === id).text;
const live = 5550000201;
const synthetic = 5550009001;
const reply = "Boss bagi 3 task semua urgent, tak tahu mana nak buat dulu";

before(async () => {
  await resetDemo();
  await freezeClock("2026-10-15T15:00:00.000Z");
});

test("R19, R23: Advance to Day 14 sends the Day 14 check-in to the live hire only, at night", async () => {
  await link(live, liveInvite);
  await tap(live, "English");
  await tap(live, en.agree);
  const before = (await sentTo(live)).length;

  const res = await hrRequest("/api/hr/demo/advance", "POST", { day: 14 });
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { offset: 1, sent: 1 });

  const texts = (await sentTo(live)).map((m) => m.text).slice(before);
  assert.deepEqual(texts, [en.checkin.intro, question("ROLE_CLARITY")]);
  assert.deepEqual(await sentTo(synthetic), []);
  const { data } = await db.from("organisations").select("demo_offset_days");
  assert.deepEqual(data, [{ demo_offset_days: 1 }]);
});

test("R11, R25: the check-in uses only bank text, the reply is stored encrypted, and each read is audited", async () => {
  const before = (await sentTo(live)).length;
  await tap(live, "4");
  await tap(live, "3");
  await tap(live, "5");
  await tap(live, "2");
  await tap(live, "4");
  await tap(live, "1");
  await scriptModel("omniroute", [{ kind: "json", content: classifierTag() }]);
  await say(live, reply);
  const texts = (await sentTo(live)).map((m) => m.text).slice(before);
  assert.deepEqual(texts, [
    question("MANAGER_SUPPORT"),
    question("BELONGING"),
    question("ONBOARDING_TRAINING"),
    question("WORKLOAD"),
    question("JOB_MATCH"),
    question("OPEN"),
    en.checkin.thanks,
  ]);

  const { data: rows } = await db
    .from("responses")
    .select("question_id, scale_value, text_encrypted")
    .eq("person_id", "6f1c2a3e-0000-4000-8000-000000000201");
  const byQuestion = Object.fromEntries(rows!.map((r) => [r.question_id, r]));
  assert.deepEqual(
    ["ROLE_CLARITY", "MANAGER_SUPPORT", "BELONGING", "ONBOARDING_TRAINING", "WORKLOAD", "JOB_MATCH"].map((id) => byQuestion[id].scale_value),
    [4, 3, 5, 2, 4, 1],
  );
  assert.ok(byQuestion.OPEN.text_encrypted);
  assert.ok(!byQuestion.OPEN.text_encrypted.includes("urgent"));
  const { data: schedule } = await db.from("checkin_schedule").select("status").eq("touchpoint", 14).eq("person_id", "6f1c2a3e-0000-4000-8000-000000000201");
  assert.deepEqual(schedule, [{ status: "answered" }]);

  const read = await hrRequest("/api/hr/replies", "GET");
  assert.equal(read.status, 200);
  const body = await read.json();
  assert.deepEqual(body.map((r: { question_id: string; text: string }) => [r.question_id, r.text]), [["OPEN", reply]]);
  const { data: audit } = await db.from("audit_log").select("action, target");
  assert.deepEqual(audit, [{ action: "read_reply_text", target: body[0].id }]);
});

test("R19: Advance to Day 30 sends the Day 30 check-in although Day 30 falls on a Sunday", async () => {
  const before = (await sentTo(live)).length;
  const res = await hrRequest("/api/hr/demo/advance", "POST", { day: 30 });
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { offset: 18, sent: 1 });
  const texts = (await sentTo(live)).map((m) => m.text).slice(before);
  assert.deepEqual(texts, [en.checkin.intro, question("ROLE_CLARITY")]);
});
