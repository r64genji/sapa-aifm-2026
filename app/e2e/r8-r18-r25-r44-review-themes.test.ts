import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { before, test } from "node:test";
import { createClient } from "@supabase/supabase-js";
import {
  classifierTag,
  db,
  freezeClock,
  hrRequest,
  hrToken,
  link,
  liveInvite,
  modelCalls,
  resetDemo,
  say,
  scriptModel,
  tap,
  tapScore,
} from "./helpers.ts";

const en = JSON.parse(readFileSync(new URL("../data/packs/en.json", import.meta.url), "utf8"));
const live = 5550000201;
const reply = "Boss bagi 3 task semua urgent, tak tahu mana nak buat dulu";

const roleClarity = async (query = "") => {
  const res = await hrRequest(`/api/hr/themes${query}`, "GET");
  assert.equal(res.status, 200);
  const body = await res.json();
  return body.cards.find((card: { driver: string }) => card.driver === "ROLE_CLARITY");
};

const auditActions = async () => {
  const { data } = await db.from("audit_log").select("action, target").neq("action", "grant_consent").order("at");
  return data!;
};

before(async () => {
  await resetDemo();
  await freezeClock("2026-10-15T15:00:00.000Z");
});

let seed: { n: number; m: number; reviewed: number; ai_confident: number };

test("R44: the seed card reads 23 of 64: 16 reviewed, 7 AI-confident", async () => {
  const card = await roleClarity();
  assert.deepEqual([card.n, card.m, card.reviewed, card.ai_confident], [23, 64, 16, 7]);
});

test("R44, R8, R25: the live reply counts as AI-confident at once, Confirm label moves it to reviewed, and the Korean desk alone is too small", async () => {
  seed = await roleClarity();

  await link(live, liveInvite);
  await tap(live, "English");
  await tap(live, en.agree);
  assert.equal((await hrRequest("/api/hr/demo/advance", "POST", { day: 14 })).status, 200);
  await tapScore(live, 4);
  await tapScore(live, 3);
  await tapScore(live, 5);
  await tapScore(live, 3);
  await tapScore(live, 3);
  await tapScore(live, 3);
  await scriptModel("omniroute", [{ kind: "json", content: classifierTag() }]);
  await say(live, reply);

  const queue = (await (await hrRequest("/api/hr/queue", "GET")).json()).filter((row: { escalate: boolean }) => !row.escalate);
  assert.equal(queue.length, 1);
  assert.equal(queue[0].text, reply);
  assert.equal(queue[0].evidence_quote, "tak tahu mana nak buat dulu");
  assert.equal(queue[0].summary, "The employee does not know which task to do first.");
  assert.deepEqual(queue[0].drivers, ["ROLE_CLARITY"]);
  assert.equal(queue[0].note, null);
  assert.deepEqual((await auditActions()).filter((row) => row.target === queue[0].id), [{ action: "read_reply_text", target: queue[0].id }]);

  const arrived = await roleClarity();
  assert.deepEqual([arrived.n, arrived.m, arrived.reviewed, arrived.ai_confident], [seed.n + 1, seed.m + 1, seed.reviewed, seed.ai_confident + 1]);

  const res = await hrRequest(`/api/hr/replies/${queue[0].id}/review`, "POST");
  assert.equal(res.status, 200);
  const moved = await roleClarity();
  assert.deepEqual([moved.n, moved.m, moved.reviewed, moved.ai_confident], [seed.n + 1, seed.m + 1, seed.reviewed + 1, seed.ai_confident]);
  assert.deepEqual((await auditActions()).at(-1), { action: "confirm_tag", target: queue[0].id });

  const korean = await (await hrRequest("/api/hr/themes?team=Korean%20Desk", "GET")).json();
  assert.deepEqual(korean.cards[0], {
    driver: "ROLE_CLARITY",
    enough: false,
    message: "Not enough people yet (3 of 5 needed)",
  });
  assert.ok(!("n" in korean.cards[0]));
});

test("R44: after Confirm label the seed card reads 24 of 65: 17 reviewed, 7 AI-confident", async () => {
  const card = await roleClarity();
  assert.deepEqual([card.n, card.m, card.reviewed, card.ai_confident], [24, 65, 17, 7]);
});

test("R25: a reply arriving writes a change signal that holds no text", async () => {
  const { data } = await db.from("change_signals").select("*").eq("scope", "queue");
  assert.ok(data!.length >= 1);
  assert.deepEqual(Object.keys(data![0]).sort(), ["at", "id", "organisation_id", "scope"]);
  const hr = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    auth: { persistSession: false },
    global: { headers: { authorization: `Bearer ${await hrToken()}` } },
  });
  const seen = await hr.from("change_signals").select("scope");
  assert.ok(seen.data!.length >= 1);
  const anonymous = await createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    auth: { persistSession: false },
  })
    .from("change_signals")
    .select("scope");
  assert.deepEqual(anonymous.data, []);
});

test("R25: a corrected tag, a follow-up change and a minimum-group change each write an audit row", async () => {
  const queue = (await (await hrRequest("/api/hr/queue", "GET")).json()).filter((row: { escalate: boolean }) => !row.escalate);
  const id = queue[0].id;

  assert.equal((await hrRequest(`/api/hr/replies/${id}/follow-up`, "POST", { value: false })).status, 200);
  assert.equal((await hrRequest(`/api/hr/replies/${id}/follow-up`, "POST", { value: true })).status, 200);
  assert.equal((await hrRequest(`/api/hr/replies/${id}/review`, "POST", { drivers: ["BELONGING"] })).status, 200);
  assert.equal((await hrRequest("/api/hr/settings", "PUT", { min_group_size: 6 })).status, 200);
  assert.deepEqual((await auditActions()).slice(-4), [
    { action: "clear_follow_up", target: id },
    { action: "set_follow_up", target: id },
    { action: "change_tag", target: id },
    { action: "change_setting", target: "min_group_size" },
  ]);
  const corrected = await roleClarity();
  assert.deepEqual([corrected.n, corrected.m, corrected.reviewed], [seed.n, seed.m + 1, seed.reviewed]);
  const korean = await (await hrRequest("/api/hr/themes?team=Korean%20Desk", "GET")).json();
  assert.equal(korean.cards[0].message, "Not enough people yet (3 of 6 needed)");
});

test("R8: the minimum group size cannot be set below 5", async () => {
  for (const value of [4, 0, -1, 5.5]) {
    assert.equal((await hrRequest("/api/hr/settings", "PUT", { min_group_size: value })).status, 400);
  }
  const { data } = await db.from("organisations").select("min_group_size");
  assert.deepEqual(data, [{ min_group_size: 6 }]);
  assert.equal((await hrRequest("/api/hr/settings", "PUT", { min_group_size: 5 })).status, 200);
});
