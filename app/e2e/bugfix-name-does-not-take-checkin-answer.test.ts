import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { before, test } from "node:test";
import { classifierTag, freezeClock, hrRequest, link, resetDemo, say, scriptModel, sentTo, tap, tapScore, teamInvites, db } from "./helpers.ts";

const en = JSON.parse(readFileSync(new URL("../data/packs/en.json", import.meta.url), "utf8"));
const chat = 5550007301;

before(async () => {
  await resetDemo();
  await freezeClock("2026-10-15T15:00:00.000Z");
  await link(chat, teamInvites["Accounts Payable Asia"]);
  await tap(chat, "English");
  await tap(chat, en.agree);
  await tap(chat, en.privacy.named);
  await say(chat, "🙂🙂");
  assert.equal((await (await hrRequest("/api/hr/demo/outreach", "POST", { touchpoint: 14 })).json()).sent, 1);
  for (const score of [4, 3, 5, 3, 3, 3]) await tapScore(chat, score);
  await scriptModel("omniroute", [{ kind: "json", content: classifierTag() }, { kind: "json", content: classifierTag() }]);
  await say(chat, "Boss bagi 3 task semua urgent, tak tahu mana nak buat dulu");
});

test("Bug fix: a hire still waiting to give a name answers the last check-in question, and it is saved as the answer, not as the name", async () => {
  const before = (await sentTo(chat)).length;
  await say(chat, "Canteen closes early");
  assert.deepEqual((await sentTo(chat)).slice(before).map((m) => m.text), ["Thank you, your answers are saved."]);
  const { data } = await db.from("people").select("name").eq("telegram_chat_id", chat).single();
  assert.equal(data!.name, null);
});
