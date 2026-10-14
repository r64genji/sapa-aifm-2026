import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { before, test } from "node:test";
import { db, freezeClock, postUpdate, resetDemo, settle, telegramCalls, update } from "./helpers.ts";

const en = JSON.parse(readFileSync(new URL("../data/packs/en.json", import.meta.url), "utf8"));
const frozen = "2026-10-14T01:00:00.000Z";

before(async () => {
  await resetDemo();
  await freezeClock(frozen);
});

test("R22: a resent Telegram update is processed once", async () => {
  const start = update("start");
  const chatId = JSON.parse(start).message.chat.id;

  assert.equal((await postUpdate(start)).status, 200);
  await settle();
  assert.equal((await postUpdate(start)).status, 200);
  await settle();

  assert.deepEqual(
    (await telegramCalls("sendMessage")).map((m) => [String(m.chat_id), m.text]),
    [[String(chatId), en.start]],
  );
  const { data } = await db.from("inbound_updates").select("platform, update_id, received_at");
  assert.deepEqual(data, [
    { platform: "telegram", update_id: JSON.parse(start).update_id, received_at: "2026-10-14T01:00:00+00:00" },
  ]);
});
