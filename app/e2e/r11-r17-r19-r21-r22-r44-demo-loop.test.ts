import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { before, test } from "node:test";
import {
  classifierTag,
  db,
  dispatch,
  freezeClock,
  hrRequest,
  link,
  liveInvite,
  modelCalls,
  postUpdate,
  resetDemo,
  scriptModel,
  sentTo,
  tap,
  update,
} from "./helpers.ts";

const en = JSON.parse(readFileSync(new URL("../data/packs/en.json", import.meta.url), "utf8"));
const question = (id: string) => en.checkin.questions.find((q: { id: string }) => q.id === id).text;
const live = 5550000201;
const reply = "Boss bagi 3 task semua urgent, tak tahu mana nak buat dulu. Call me 012-345 6789";

const roleClarity = async () => {
  const body = await (await hrRequest("/api/hr/themes", "GET")).json();
  return body.cards.find((card: { driver: string }) => card.driver === "ROLE_CLARITY");
};

const counts = async () => ({
  responses: (await db.from("responses").select("id", { count: "exact", head: true })).count,
  usage: (await db.from("ai_usage").select("id", { count: "exact", head: true })).count,
  model: (await modelCalls("omniroute")).length,
  sent: (await sentTo(live)).length,
});

before(async () => {
  await resetDemo();
  await freezeClock("2026-10-15T15:00:00.000Z");
  await link(live, liveInvite);
  await tap(live, "English");
  await tap(live, en.agree);
});

test("R21, R19: at Day 14 two dispatch calls at the same time send the live hire one check-in", async () => {
  const before = (await sentTo(live)).length;
  await freezeClock("2026-10-16T02:00:00.000Z");
  const [first, second] = await Promise.all([dispatch(), dispatch()]);
  assert.deepEqual([first.status, second.status], [200, 200]);
  assert.deepEqual((await sentTo(live)).slice(before).map((m) => m.text), [en.checkin.intro, question("ROLE_CLARITY")]);
});

let seed: { n: number; m: number; reviewed: number; ai_confident: number };

test("R17, R22: the reply reaches the model masked, and the same update sent again changes nothing", async () => {
  seed = await roleClarity();
  for (const answer of ["4", "3", "5", "3", "3", "3"]) await tap(live, answer);
  await scriptModel("omniroute", [{ kind: "json", content: classifierTag() }]);
  const body = update("text", { chat_id: live, text: reply });
  assert.equal((await postUpdate(body)).status, 200);

  const calls = await modelCalls("omniroute");
  assert.equal(calls.length, 1);
  const sent = JSON.stringify(calls[0].body);
  assert.ok(!sent.includes("012-345 6789") && sent.includes("tak tahu mana nak buat dulu. Call me [PHONE]"));

  const once = await counts();
  assert.equal((await postUpdate(body)).status, 200);
  assert.deepEqual(await counts(), once);
});

test("R44, R12: the card moves up by one person when the reply arrives, and Confirm label marks it reviewed", async () => {
  const queue = (await (await hrRequest("/api/hr/queue", "GET")).json()).filter((row: { escalate: boolean }) => !row.escalate);
  assert.equal(queue.length, 1);
  assert.equal(queue[0].note, null);
  const arrived = await roleClarity();
  assert.deepEqual([arrived.n, arrived.m, arrived.reviewed], [seed.n + 1, seed.m + 1, seed.reviewed]);

  assert.equal((await hrRequest(`/api/hr/replies/${queue[0].id}/review`, "POST")).status, 200);
  const moved = await roleClarity();
  assert.deepEqual([moved.n, moved.m, moved.reviewed], [seed.n + 1, seed.m + 1, seed.reviewed + 1]);
});

test("R8, R51: the Korean Desk team view says Not enough people yet (3 of 5 needed)", async () => {
  const res = await hrRequest("/api/hr/themes?team=Korean%20Desk", "GET");
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.cards.length, 5);
  assert.ok(body.cards.every((card: { enough: boolean; message: string }) => !card.enough && card.message === "Not enough people yet (3 of 5 needed)"));
});
