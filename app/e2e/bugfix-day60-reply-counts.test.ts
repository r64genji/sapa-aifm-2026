import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { before, test } from "node:test";
import { classifierTag, freezeClock, hrRequest, link, liveInvite, resetDemo, say, scriptModel, tap, tapScore, tapData } from "./helpers.ts";

const en = JSON.parse(readFileSync(new URL("../data/packs/en.json", import.meta.url), "utf8"));
const live = 5550000202;

type Card = { driver: string; n: number; m: number };
const card = async (driver: string) => {
  const res = await hrRequest("/api/hr/themes", "GET");
  assert.equal(res.status, 200);
  return ((await res.json()).cards as Card[]).find((c) => c.driver === driver)!;
};

async function checkIn(touchpoint: number, text: string, tag: Record<string, unknown>) {
  assert.equal((await hrRequest("/api/hr/demo/outreach", "POST", { touchpoint })).status, 200);
  for (const score of [4, 4, 4, 4, 4, 4]) await tapScore(live, score);
  await scriptModel("omniroute", [{ kind: "json", content: classifierTag(tag) }]);
  await say(live, text);
}

before(async () => {
  await resetDemo();
  await freezeClock("2026-10-15T15:00:00.000Z");
});

test("Bug fix: a manager support reply at Day 60 shows on the dashboard, and the hire counts once (R64)", async () => {
  const seed = await card("MANAGER_SUPPORT");

  await link(live, liveInvite);
  await tap(live, "English");
  await tap(live, en.agree);
  await tapData(live, 'chat:{"a":"privacy","v":"named"}');
  await say(live, "Test Hire");
  await checkIn(14, "Semua okay, team baik", { drivers: [], positive: true, concern_level: "none", evidence_quote: "team baik", summary: "The employee says all is fine." });
  await checkIn(60, "I wanted help but he was too busy", { drivers: ["MANAGER_SUPPORT"], evidence_quote: "he was too busy", summary: "The manager was too busy to help." });

  const after = await card("MANAGER_SUPPORT");
  assert.deepEqual([after.n, after.m], [seed.n + 1, seed.m + 1]);
});
