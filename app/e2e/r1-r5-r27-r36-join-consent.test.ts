import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { before, test } from "node:test";
import { addHire, chatPerson, db, freezeClock, link, resetDemo, sentTo, tap, tapData, telegramCalls, hrToken, appUrl, liveInvite, teamInvites } from "./helpers.ts";

const pack = (language: string) =>
  JSON.parse(readFileSync(new URL(`../data/packs/${language}.json`, import.meta.url), "utf8"));
const en = pack("en");
const ms = pack("ms");
const zh = pack("zh");
const frozen = "2026-10-14T01:00:00.000Z";

before(async () => {
  await resetDemo();
  await freezeClock(frozen);
});

const texts = async (chatId: number) => (await sentTo(chatId)).map((m) => m.text);

test("Bug fix: the intake join token written in the public seed file binds no chat after a reset", async () => {
  const chat = 5550000006;
  await link(chat, "october-intake-join");
  assert.deepEqual(await texts(chat), [en.invalidInvite]);
});

test("R5, R36, R1, R27: a hire joins on a team link in English, consents, is never asked for a team, gets HR only and an English menu", async () => {
  const chat = 5550000001;
  await link(chat, liveInvite);
  assert.deepEqual(await texts(chat), [`${en.languagePrompt}\n${ms.languagePrompt}\n${zh.languagePrompt}`]);

  await tap(chat, "English");
  await tap(chat, en.agree);
  assert.deepEqual((await texts(chat)).slice(1), ['You tapped "English".', en.consent, `You tapped "${en.agree}".`, en.visibilityPrompt]);
  const livePerson = (await chatPerson(chat)).id;
  const { data: person } = await db.from("people").select("team, manager_id, state").eq("id", livePerson).single();
  assert.deepEqual(person, { team: "Accounts Payable Asia", manager_id: "6f1c2a3e-0000-4000-8000-000000000101", state: "active" });

  const { data: consents } = await db.from("consents").select("text_version, scope, withdrawn_at").eq("person_id", livePerson);
  assert.deepEqual(consents, [{ text_version: en.consentVersion, scope: "hr_only", withdrawn_at: null }]);

  const menus = await telegramCalls("setMyCommands");
  assert.deepEqual(menus, [
    {
      commands: Object.values(en.commands).map((c: any) => ({ command: c.name, description: c.description })),
      scope: { type: "chat", chat_id: chat },
    },
  ]);

  await tap(chat, en.visibilityHrManager);
  const { data: after } = await db.from("consents").select("scope, withdrawn_at").eq("person_id", (await chatPerson(chat)).id).order("granted_at");
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

test("R27: each team link puts the joiner in that team with its manager and asks no team question", async () => {
  const expected: [string, string][] = [
    ["Order-to-Cash Asia", "6f1c2a3e-0000-4000-8000-000000000102"],
    ["Accounts Payable Europe", "6f1c2a3e-0000-4000-8000-000000000103"],
    ["Japanese Desk", "6f1c2a3e-0000-4000-8000-000000000104"],
    ["Korean Desk", "6f1c2a3e-0000-4000-8000-000000000105"],
    ["Record-to-Report", "6f1c2a3e-0000-4000-8000-000000000106"],
    ["IT Service Desk", "6f1c2a3e-0000-4000-8000-000000000107"],
    ["Thai Desk", "6f1c2a3e-0000-4000-8000-000000000108"],
  ];
  let chat = 5550000100;
  for (const [team, manager] of expected) {
    chat += 1;
    await link(chat, teamInvites[team]);
    await tap(chat, "English");
    await tap(chat, en.agree);
    assert.deepEqual((await texts(chat)).slice(1), ['You tapped "English".', en.consent, `You tapped "${en.agree}".`, en.visibilityPrompt]);
    const { data } = await db.from("people").select("team, manager_id, state, start_date").eq("id", (await chatPerson(chat)).id).single();
    assert.deepEqual(data, { team, manager_id: manager, state: "active", start_date: "2026-10-02" });
  }
});

test("R27: a second chat on the intake link joins as a new person, a chat that joined is refused, and HR sees no names", async () => {
  const other = 5550000003;
  await link(other, liveInvite);
  assert.deepEqual(await texts(other), [`${en.languagePrompt}\n${ms.languagePrompt}\n${zh.languagePrompt}`]);
  const first = await chatPerson(5550000001);
  const second = await chatPerson(other);
  assert.notEqual(second.id, first.id);
  assert.notEqual(second.code_name, first.code_name);
  await link(5550000001, liveInvite);
  assert.equal((await texts(5550000001)).at(-1), en.invalidInvite);

  const res = await fetch(`${appUrl}/api/hr/hires`, { headers: { authorization: `Bearer ${await hrToken()}` } });
  const hires = (await res.json()) as Record<string, unknown>[];
  assert.ok(hires.every((h) => Object.keys(h).sort().join() === "intake,invite_used,team"));
  assert.ok(hires.some((h) => h.team === "Accounts Payable Asia" && h.intake === "2026-10" && h.invite_used === true));
});

test("R27: an invite 15 days old and an expired intake link are refused", async () => {
  const chat = 5550000004;
  const { token } = await addHire({ code_name: "Late hire" });
  await freezeClock("2026-10-29T01:00:00.000Z");
  await link(chat, token);
  assert.deepEqual(await texts(chat), [en.invalidInvite]);
  await link(5550000007, liveInvite);
  assert.deepEqual(await texts(5550000007), [en.invalidInvite]);
  await link(5550000008, teamInvites["Thai Desk"]);
  assert.deepEqual(await texts(5550000008), [en.invalidInvite]);
  await freezeClock(frozen);
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
