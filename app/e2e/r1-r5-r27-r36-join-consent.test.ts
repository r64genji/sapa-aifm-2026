import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { before, test } from "node:test";
import { addHire, db, freezeClock, link, resetDemo, sentTo, tap, tapData, telegramCalls, hrToken, appUrl } from "./helpers.ts";

const pack = (language: string) =>
  JSON.parse(readFileSync(new URL(`../data/packs/${language}.json`, import.meta.url), "utf8"));
const en = pack("en");
const ms = pack("ms");
const liveInvite = "live-hire-invite";
const frozen = "2026-10-14T01:00:00.000Z";

before(async () => {
  await resetDemo();
  await freezeClock(frozen);
});

const texts = async (chatId: number) => (await sentTo(chatId)).map((m) => m.text);

test("R5, R36, R1: a seeded hire joins in English, consents with HR only, and gets an English menu", async () => {
  const chat = 5550000001;
  await link(chat, liveInvite);
  assert.deepEqual(await texts(chat), [`${en.languagePrompt}\n${ms.languagePrompt}`]);

  await tap(chat, "English");
  await tap(chat, en.agree);
  assert.deepEqual((await texts(chat)).slice(1), [en.consent, en.visibilityPrompt]);

  const { data: consents } = await db.from("consents").select("text_version, scope, withdrawn_at");
  assert.deepEqual(consents, [{ text_version: en.consentVersion, scope: "hr_only", withdrawn_at: null }]);

  const menus = await telegramCalls("setMyCommands");
  assert.deepEqual(menus, [
    {
      commands: Object.values(en.commands).map((c: any) => ({ command: c.name, description: c.description })),
      scope: { type: "chat", chat_id: chat },
    },
  ]);

  await tap(chat, en.visibilityHrManager);
  const { data: after } = await db.from("consents").select("scope, withdrawn_at").order("granted_at");
  assert.deepEqual(
    after!.map((c) => [c.scope, c.withdrawn_at !== null]),
    [["hr_only", true], ["share_with_manager", false]],
  );
});

test("R36: a hire who picks Bahasa Malaysia gets the BM consent text and a BM menu", async () => {
  const chat = 5550000002;
  const { token } = await addHire({ code_name: "Hire BM", language: "ms" });
  await link(chat, token);
  await tap(chat, "Bahasa Malaysia");
  assert.equal((await texts(chat)).at(-1), ms.consent);
  const menu = (await telegramCalls("setMyCommands")).find((m: any) => m.scope.chat_id === chat) as any;
  assert.deepEqual(menu.commands.map((c: any) => c.command), Object.values(ms.commands).map((c: any) => c.name));
});

test("R27: a used invite is refused with the ask-HR text, and HR sees only that it was used", async () => {
  const other = 5550000003;
  await link(other, liveInvite);
  assert.deepEqual(await texts(other), [en.invalidInvite]);
  await link(5550000001, liveInvite);
  assert.equal((await texts(5550000001)).at(-1), en.invalidInvite);

  const res = await fetch(`${appUrl}/api/hr/hires`, { headers: { authorization: `Bearer ${await hrToken()}` } });
  const live = (await res.json()).find((h: any) => h.code_name === "Live hire");
  assert.deepEqual(live, {
    code_name: "Live hire",
    team: "Production",
    start_date: "2026-10-02",
    role: "Production operator",
    invite_used: true,
  });
});

test("R27: an invite 15 days old is refused", async () => {
  const chat = 5550000004;
  const { token } = await addHire({ code_name: "Late hire" });
  await freezeClock("2026-10-29T01:00:00.000Z");
  await link(chat, token);
  assert.deepEqual(await texts(chat), [en.invalidInvite]);
  await freezeClock(frozen);
});

test("R46: a language without a recorded checker cannot be chosen", async () => {
  const chat = 5550000005;
  const { token } = await addHire({ code_name: "Hire ZH" });
  await link(chat, token);
  await tapData(chat, 'chat:{"a":"lang","v":"zh"}');
  const { data } = await db.from("people").select("state, language").eq("telegram_chat_id", chat);
  assert.deepEqual(data, [{ state: "invited", language: "en" }]);
  assert.equal((await texts(chat)).some((t) => t === en.consent), false);
});

test("R1: after No thanks the hire gets a confirmation and nothing more", async () => {
  const chat = 5550000006;
  const { token } = await addHire({ code_name: "Hire decline" });
  await link(chat, token);
  await tap(chat, "English");
  await tap(chat, en.decline);
  assert.equal((await texts(chat)).at(-1), en.declined);
  const before = (await texts(chat)).length;
  await tapData(chat, 'chat:{"a":"consent","v":"yes"}');
  const { data: person } = await db.from("people").select("id, state").eq("telegram_chat_id", chat).single();
  const { data } = await db.from("consents").select("id").eq("person_id", person!.id);
  assert.deepEqual([person!.state, data], ["declined", []]);
  assert.equal((await texts(chat)).length, before);
});
