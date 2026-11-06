import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { before, test } from "node:test";
import { classifierTag, freezeClock, hrRequest, link, resetDemo, say, scriptModel, tap, tapScore, teamInvites } from "./helpers.ts";

const zh = JSON.parse(readFileSync(new URL("../data/packs/zh.json", import.meta.url), "utf8"));
const chat = 5550006301;
const reply = "我不清楚我的职责是什么，问经理他也没时间回答。";

before(async () => {
  await resetDemo();
  await freezeClock("2026-10-15T15:00:00.000Z");
  await link(chat, teamInvites["Accounts Payable Asia"]);
  await tap(chat, zh.name);
  await tap(chat, zh.agree);
  await tap(chat, zh.privacy.anonymous);
  await tap(chat, zh.firstJob.no);
  await hrRequest("/api/hr/demo/outreach", "POST", { touchpoint: 14 });
  for (const score of [4, 3, 5, 3, 3, 3]) await tapScore(chat, score);
  await scriptModel("omniroute", [{ kind: "json", content: classifierTag({ evidence_quote: "我不清楚我的职责是什么" }) }]);
  await say(chat, reply);
});

test("Bug 7 Nov 2026: an anonymous Chinese reply waiting for Confirm, in a team where 5+ named its area, shows in replies and the review queue (R62)", async () => {
  const replies = (await (await hrRequest("/api/hr/replies", "GET")).json()) as { text: string; byline: string }[];
  assert.equal(replies.find((r) => r.text === reply)?.byline, "A new hire · Accounts Payable Asia · Day 14");
  const queue = (await (await hrRequest("/api/hr/queue", "GET")).json()) as { text: string; status: string }[];
  assert.equal(queue.find((r) => r.text === reply)?.status, "needs_review");
});
