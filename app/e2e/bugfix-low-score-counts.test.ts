import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { before, test } from "node:test";
import { classifierTag, freezeClock, hrRequest, link, liveInvite, resetDemo, say, scriptModel, tap, tapScore } from "./helpers.ts";

const en = JSON.parse(readFileSync(new URL("../data/packs/en.json", import.meta.url), "utf8"));
const live = 5550000201;

const cards = async () => {
  const res = await hrRequest("/api/hr/themes", "GET");
  assert.equal(res.status, 200);
  return (await res.json()).cards as Card[];
};
type Card = { driver: string; n: number; m: number; score_only: number };
const card = (all: Card[], driver: string) => all.find((c) => c.driver === driver)!;

before(async () => {
  await resetDemo();
  await freezeClock("2026-10-15T15:00:00.000Z");
});

test("Bug fix: a hire who scores workload 1 and types nothing about it counts for workload", async () => {
  const seed = await cards();

  await link(live, liveInvite);
  await tap(live, "English");
  await tap(live, en.agree);
  assert.equal((await hrRequest("/api/hr/demo/advance", "POST", { day: 14 })).status, 200);
  for (const score of [4, 3, 5, 3, 1, 3]) await tapScore(live, score);
  await scriptModel("omniroute", [
    { kind: "json", content: classifierTag({ drivers: [], positive: true, concern_level: "none", evidence_quote: "team baik", summary: "The employee says all is fine." }) },
  ]);
  await say(live, "Semua okay, team baik");

  const after = await cards();
  const workload = card(after, "WORKLOAD");
  const was = card(seed, "WORKLOAD");
  assert.deepEqual([workload.n, workload.m, workload.score_only], [was.n + 1, was.m + 1, was.score_only + 1]);
  const role = card(after, "ROLE_CLARITY");
  assert.equal(role.n, (card(seed, "ROLE_CLARITY")).n);
});
