import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { before, test } from "node:test";
import {
  addHire,
  blockChat,
  db,
  freezeClock,
  link,
  postUpdate,
  resetDemo,
  say,
  scriptModel,
  sentTo,
  settle,
  tap,
  telegramCalls,
  update,
} from "./helpers.ts";

const pack = (language: string) =>
  JSON.parse(readFileSync(new URL(`../data/packs/${language}.json`, import.meta.url), "utf8"));
const en = pack("en");
const ms = pack("ms");

before(async () => {
  await resetDemo();
  await freezeClock("2026-10-14T01:00:00.000Z");
});

async function activeHire(chat: number, language: "English" | "Bahasa Malaysia", agree: string) {
  const { token } = await addHire({ code_name: `Hire ${chat}` });
  await link(chat, token);
  await tap(chat, language);
  await tap(chat, agree);
}

const texts = async (chat: number) => (await sentTo(chat)).map((m) => m.text);

test("R2, R36: commands in both languages work with the model unreachable", async () => {
  const chat = 5550000011;
  await activeHire(chat, "English", en.agree);
  await say(chat, "/help");
  await say(chat, "/BANTUAN");
  assert.deepEqual((await texts(chat)).slice(-2), [en.help, en.help]);
});

test("R2, R3: typed STOP ends everything and nothing more is sent after the confirmation", async () => {
  const chat = 5550000012;
  await activeHire(chat, "English", en.agree);
  await say(chat, "Stop");
  assert.equal((await texts(chat)).at(-1), en.stopped);
  const count = (await texts(chat)).length;
  await say(chat, "/help");
  await say(chat, "hello");
  await say(chat, "STOP");
  assert.equal((await texts(chat)).length, count);
  const { data } = await db.from("people").select("state").eq("telegram_chat_id", chat);
  assert.deepEqual(data, [{ state: "stopped" }]);
});

test("R2, R3: typed BERHENTI and /berhenti stop a Bahasa Malaysia hire", async () => {
  const typed = 5550000013;
  const slash = 5550000014;
  await activeHire(typed, "Bahasa Malaysia", ms.agree);
  await activeHire(slash, "Bahasa Malaysia", ms.agree);
  await say(typed, "BERHENTI");
  await say(slash, "/berhenti");
  assert.equal((await texts(typed)).at(-1), ms.stopped);
  assert.equal((await texts(slash)).at(-1), ms.stopped);
});

test("R3: a STOP sent while the bot is still working on the hire's previous text is not lost", async () => {
  const chat = 5550000016;
  await activeHire(chat, "English", en.agree);
  await scriptModel("omniroute", [{ kind: "timeout" }]);
  await postUpdate(update("text", { chat_id: chat, text: "How do I claim overtime?" }));
  await settle(1000);
  await say(chat, "STOP");
  for (let i = 0; i < 40 && (await texts(chat)).at(-1) !== en.stopped; i++) await settle(1000);
  assert.equal((await texts(chat)).at(-1), en.stopped);
  const { data } = await db.from("people").select("state").eq("telegram_chat_id", chat);
  assert.deepEqual(data, [{ state: "stopped" }]);
});

test("R36, R3: a bot-was-blocked error counts as STOP", async () => {
  const chat = 5550000015;
  await activeHire(chat, "English", en.agree);
  await blockChat(chat);
  await say(chat, "/help");
  const { data } = await db.from("people").select("state").eq("telegram_chat_id", chat);
  assert.deepEqual(data, [{ state: "stopped" }]);
  assert.equal((await telegramCalls("sendMessage.blocked")).length, 1);
});
