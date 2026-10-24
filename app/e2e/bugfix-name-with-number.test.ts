import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { before, test } from "node:test";
import { db, freezeClock, link, resetDemo, say, sentTo, tap, teamInvites } from "./helpers.ts";

const en = JSON.parse(readFileSync(new URL("../data/packs/en.json", import.meta.url), "utf8"));
const chat = 5550007501;

before(async () => {
  await resetDemo();
  await freezeClock("2026-10-15T15:00:00.000Z");
  await link(chat, teamInvites["Accounts Payable Asia"]);
  await tap(chat, "English");
  await tap(chat, en.agree);
  await tap(chat, en.privacy.named);
});

test("Bug fix: a name with a number, like Judge 1, is saved instead of the name question coming back", async () => {
  const before = (await sentTo(chat)).length;
  await say(chat, "Judge 1");
  assert.deepEqual((await sentTo(chat)).slice(before).map((m) => m.text), [en.firstJob.question]);
  const { data } = await db.from("people").select("name").eq("telegram_chat_id", chat).single();
  assert.equal(data!.name, "Judge 1");
});
