import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { before, test } from "node:test";
import { addHire, appUrl, classifierTag, db, freezeClock, hrRequest, hrToken, link, resetDemo, say, scriptModel, tap, tapScore, tapData } from "./helpers.ts";

const ms = JSON.parse(readFileSync(new URL("../data/packs/ms.json", import.meta.url), "utf8"));
const reply = "Kerja terlalu banyak minggu ini";
const chats = [0, 1, 2, 3, 4, 5].map((n) => 5550004410 + n);

async function onboard(chat: number) {
  const { token } = await addHire({ code_name: `Hire ${chat}`, language: "ms", start_date: "2026-10-02" });
  await link(chat, token);
  await tap(chat, "Bahasa Malaysia");
  await tap(chat, ms.agree);
  await tapData(chat, 'chat:{"a":"privacy","v":"named"}');
  await say(chat, "Test Hire");
}

async function answer(chat: number, drivers: string[]) {
  for (const score of [4, 3, 5, 3, 3, 3, 3]) await tapScore(chat, score);
  await scriptModel("omniroute", [{ kind: "json", content: classifierTag({ drivers, evidence_quote: reply }) }]);
  await say(chat, reply);
  const { data: who } = await db.from("people").select("id").eq("telegram_chat_id", chat).single();
  const { data: response } = await db.from("responses").select("id").eq("person_id", who!.id).eq("question_id", "OPEN").single();
  return response!.id as string;
}

const review = (id: string, change: boolean) =>
  hrRequest(`/api/hr/replies/${id}/review`, "POST", change ? { drivers: ["WORKLOAD"] } : undefined);
const state = async (driver: string, language: string) =>
  ((await (await hrRequest("/api/hr/quality", "GET")).json()) as { driver: string; language: string; state: string }[]).find(
    (row) => row.driver === driver && row.language === language,
  )!.state;
const workload = async () =>
  (await (await hrRequest("/api/hr/themes", "GET")).json()).cards.find((c: { driver: string }) => c.driver === "WORKLOAD");
const tagOf = async (responseId: string) =>
  (await db.from("ai_tags").select("status, counted").eq("response_id", responseId).single()).data;

before(async () => {
  await resetDemo();
  await freezeClock("2026-10-15T15:00:00.000Z");
  for (const chat of chats) await onboard(chat);
  assert.equal((await hrRequest("/api/hr/demo/outreach", "POST", { touchpoint: 14 })).status, 200);
});

test("R44: a new driver and language counts without review, and HR reviews keep it trusted", async () => {
  const ids = [];
  for (const chat of chats.slice(0, 4)) ids.push(await answer(chat, ["BELONGING", "WORKLOAD"]));
  for (const id of ids) assert.deepEqual(await tagOf(id), { status: "ok", counted: true });

  assert.equal((await review(ids[0], true)).status, 200);
  for (const id of ids.slice(1)) assert.equal((await review(id, false)).status, 200);
  assert.equal(await state("BELONGING", "ms"), "trusted");
  assert.equal(await state("WORKLOAD", "ms"), "trusted");
});

test("R44: a new AI-confident tag counts without review, and the hold-new-tags setting (HR admin only) holds it", async () => {
  const before = await workload();

  assert.equal((await hrRequest("/api/hr/settings/hold-new-tags", "PUT", { value: true })).status, 403);
  const admin = (value: boolean) =>
    hrToken("admin@contoh.test").then((token) =>
      fetch(`${appUrl}/api/hr/settings/hold-new-tags`, {
        method: "PUT",
        headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
        body: JSON.stringify({ value }),
      }),
    );
  assert.equal((await admin(true)).status, 200);
  const held = await answer(chats[4], ["WORKLOAD"]);
  assert.deepEqual(await tagOf(held), { status: "ok", counted: false });
  const heldCard = await workload();
  assert.deepEqual([heldCard.n, heldCard.m], [before.n, before.m]);

  assert.equal((await admin(false)).status, 200);
  const counted = await answer(chats[5], ["WORKLOAD"]);
  assert.deepEqual(await tagOf(counted), { status: "ok", counted: true });
  const moved = await workload();
  assert.deepEqual(
    [moved.n, moved.m, moved.reviewed, moved.ai_confident],
    [before.n + 1, before.m + 1, before.reviewed, before.ai_confident + 1],
  );
});
