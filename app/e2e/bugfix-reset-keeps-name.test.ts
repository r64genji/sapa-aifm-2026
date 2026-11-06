import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { before, test } from "node:test";
import { callReset, classifierTag, freezeClock, hrRequest, link, resetDemo, say, scriptModel, sentTo, tap, tapData, tapScore, teamInvites } from "./helpers.ts";

const en = JSON.parse(readFileSync(new URL("../data/packs/en.json", import.meta.url), "utf8"));
const hire = 5550007701;

before(async () => {
  await resetDemo();
  await freezeClock("2026-10-15T15:00:00.000Z");
  await link(hire, teamInvites["Accounts Payable Asia"]);
  await tap(hire, "English");
  await tap(hire, "I agree");
  await tapData(hire, 'chat:{"a":"privacy","v":"named"}');
  await say(hire, "Abe Tan");
});

test("Bug fix: after a demo reset a hire who shared their name is still asked if Sapa can tell the team lead", async () => {
  await callReset();
  assert.equal((await hrRequest("/api/hr/demo/outreach", "POST", { touchpoint: 14 })).status, 200);
  for (const score of [4, 1, 4, 4, 4, 4]) await tapScore(hire, score);
  const text = "My lead was too busy to reply to me this week";
  await scriptModel("omniroute", [{ kind: "json", content: classifierTag({ drivers: ["MANAGER_SUPPORT"], evidence_quote: text }) }]);
  await say(hire, text);
  assert.equal(String((await sentTo(hire)).at(-1)?.text), en.checkin.share.question);
});
