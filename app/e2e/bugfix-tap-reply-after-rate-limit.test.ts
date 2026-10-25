import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { before, test } from "node:test";
import { busyChat, freezeClock, hrRequest, link, resetDemo, say, sentTo, tap, tapScore, teamInvites } from "./helpers.ts";

const en = JSON.parse(readFileSync(new URL("../data/packs/en.json", import.meta.url), "utf8"));
const question = (id: string) => en.checkin.questions.find((q: { id: string }) => q.id === id);
const chat = 5550007401;

before(async () => {
  await resetDemo();
  await freezeClock("2026-10-15T15:00:00.000Z");
  await link(chat, teamInvites["Accounts Payable Asia"]);
  await tap(chat, "English");
  await tap(chat, en.agree);
  await tap(chat, en.privacy.named);
  await say(chat, "Aina");
  assert.equal((await (await hrRequest("/api/hr/demo/outreach", "POST", { touchpoint: 14 })).json()).sent, 1);
});

test("Bug fix: when Telegram says too many requests on the first check-in tap, the hire still gets the next question", async () => {
  const before = (await sentTo(chat)).length;
  await busyChat(chat);
  await tapScore(chat, 4);
  assert.deepEqual((await sentTo(chat)).slice(before).map((m) => m.text), [
    `You tapped "${question("ROLE_CLARITY").labels[3]}". ${question("MANAGER_SUPPORT").text}`,
  ]);
});
