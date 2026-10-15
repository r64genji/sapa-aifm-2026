import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { before, test } from "node:test";
import { addHire, blockChat, db, dispatch, freezeClock, link, resetDemo, say, sentTo, tap, telegramCalls } from "./helpers.ts";

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

test("R36, R3: a bot-was-blocked error counts as STOP", async () => {
  const chat = 5550000015;
  await activeHire(chat, "English", en.agree);
  await blockChat(chat);
  await say(chat, "/help");
  const { data } = await db.from("people").select("state").eq("telegram_chat_id", chat);
  assert.deepEqual(data, [{ state: "stopped" }]);
  assert.equal((await telegramCalls("sendMessage.blocked")).length, 1);
});

async function personRow(chat: number) {
  const { data } = await db.from("people").select("id, language").eq("telegram_chat_id", chat).single();
  return data!;
}

test("R36: /skip closes the open check-in", async () => {
  const chat = 5550000021;
  await activeHire(chat, "English", en.agree);
  await freezeClock("2026-10-19T02:00:00.000Z");
  await dispatch();
  const { id } = await personRow(chat);
  const status = async () =>
    (await db.from("checkin_schedule").select("status").eq("person_id", id).eq("touchpoint", 3).single()).data!.status;
  assert.equal(await status(), "sent");
  await say(chat, "/skip");
  assert.equal((await texts(chat)).at(-1), en.skipped);
  assert.equal(await status(), "skipped");
  await freezeClock("2026-10-14T01:00:00.000Z");
});

test("R36, R25: /privacy shows the visibility buttons and the choice is saved and audited", async () => {
  const chat = 5550000022;
  await activeHire(chat, "English", en.agree);
  await say(chat, "/privacy");
  assert.equal((await sentTo(chat)).at(-1)!.text, en.visibilityPrompt);
  await tap(chat, en.visibilityHrManager);
  assert.ok((await texts(chat)).includes(en.visibilitySaved));
  const { id } = await personRow(chat);
  const { data: consents } = await db.from("consents").select("scope, withdrawn_at").eq("person_id", id).order("granted_at");
  assert.deepEqual(
    consents!.map((row) => [row.scope, row.withdrawn_at !== null]),
    [["hr_only", true], ["share_with_manager", false]],
  );
  const { data: audits } = await db.from("audit_log").select("actor, action").eq("target", id).order("at");
  assert.ok(audits!.some((row) => row.actor === "new_hire" && row.action === "change_consent_scope"));
});

test("R36: /bahasa offers the languages and switching changes the person's language and menu", async () => {
  const chat = 5550000023;
  await activeHire(chat, "English", en.agree);
  await say(chat, "/bahasa");
  const shown = (await sentTo(chat)).at(-1)!;
  assert.deepEqual(
    (shown.reply_markup as any).inline_keyboard.flat().map((b: any) => b.text),
    [en.name, ms.name],
  );
  await tap(chat, ms.name);
  assert.equal((await personRow(chat)).language, "ms");
  assert.equal((await texts(chat)).at(-1), ms.help);
  const menu = (await telegramCalls("setMyCommands")).findLast((m: any) => m.scope.chat_id === chat) as any;
  assert.equal(menu.commands[0].description, ms.commands.start.description);
});
