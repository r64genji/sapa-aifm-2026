import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { before, test } from "node:test";
import { freezeClock, link, resetDemo, sentTo, tap, teamInvites } from "./helpers.ts";

const en = JSON.parse(readFileSync(new URL("../data/packs/en.json", import.meta.url), "utf8"));
const chat = 5550007401;

before(async () => {
  await resetDemo();
  await freezeClock("2026-10-15T15:00:00.000Z");
  await link(chat, teamInvites["Accounts Payable Asia"]);
  await tap(chat, "English");
  await tap(chat, en.decline);
});

test("Bug fix: a hire who tapped No thanks scans the team code again, sees the consent again, and can agree", async () => {
  const before = (await sentTo(chat)).length;
  await link(chat, teamInvites["Accounts Payable Asia"]);
  assert.deepEqual((await sentTo(chat)).slice(before).map((m) => m.text), [en.consent]);
  await tap(chat, en.agree);
  assert.deepEqual((await sentTo(chat)).slice(before + 1).map((m) => m.text), [`You tapped "${en.agree}". ${en.help}`, en.privacy.question]);
});
