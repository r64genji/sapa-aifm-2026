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
} from "./helpers.ts";

const en = JSON.parse(readFileSync(new URL("../data/packs/en.json", import.meta.url), "utf8"));
const live = 5550000201;
const livePerson = "6f1c2a3e-0000-4000-8000-000000000201";
const reply = "Boss bagi 3 task semua urgent, tak tahu mana nak buat dulu";

const roleClarity = async (query = "") => {
  const res = await hrRequest(`/api/hr/themes${query}`, "GET");
  assert.equal(res.status, 200);
  const body = await res.json();
  return body.cards.find((card: { driver: string }) => card.driver === "ROLE_CLARITY");
};

const auditActions = async () => {
  const { data } = await db.from("audit_log").select("action, target").order("at");
  return data!;
};

before(async () => {
  await resetDemo();
  await freezeClock("2026-10-15T15:00:00.000Z");
});

test("R44, R8, R25: the live reply waits for HR, the card moves from 7 of 18 to 8 of 19 only after Confirm label, and October alone is too small", async () => {
  assert.deepEqual(await roleClarity(), {
    driver: "ROLE_CLARITY",
    enough: true,
    n: 7,
    m: 18,
    reviewed: 5,
    ai_confident: 2,
    note: "New labels wait for HR during calibration",
  });

  await link(live, liveInvite);
  await tap(live, "English");
  await tap(live, en.agree);
  assert.equal((await hrRequest("/api/hr/demo/advance", "POST", { day: 14 })).status, 200);
  await tap(live, "4");
  await tap(live, "3");
  await tap(live, "5");
  await scriptModel("omniroute", [{ kind: "json", content: classifierTag() }]);
  await say(live, reply);

  const queue = await (await hrRequest("/api/hr/queue", "GET")).json();
  assert.equal(queue.length, 1);
  assert.equal(queue[0].text, reply);
  assert.equal(queue[0].evidence_quote, "tak tahu mana nak buat dulu");
  assert.equal(queue[0].summary, "The employee does not know which task to do first.");
  assert.deepEqual(queue[0].drivers, ["ROLE_CLARITY"]);
  assert.equal(queue[0].note, "New labels wait for HR during calibration");
  assert.deepEqual(await auditActions(), [{ action: "read_reply_text", target: queue[0].id }]);

  const waiting = await roleClarity();
  assert.deepEqual([waiting.n, waiting.m, waiting.reviewed, waiting.ai_confident], [7, 18, 5, 2]);

  const res = await hrRequest(`/api/hr/replies/${queue[0].id}/review`, "POST");
  assert.equal(res.status, 200);
  const moved = await roleClarity();
  assert.deepEqual([moved.n, moved.m, moved.reviewed, moved.ai_confident], [8, 19, 6, 2]);
  assert.deepEqual((await auditActions()).at(-1), { action: "confirm_tag", target: queue[0].id });

  const october = await (await hrRequest("/api/hr/themes?month=2026-10", "GET")).json();
  assert.deepEqual(october.cards[0], {
    driver: "ROLE_CLARITY",
    enough: false,
    message: "Not enough people yet (4 of 5 needed)",
  });
  assert.ok(!("n" in october.cards[0]));
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

test("R18: a narrative holding a number that is not in its input is rejected and retried once", async () => {
  const bad = { text: "Role clarity was raised by 87 of 19 people who answered." };
  const good = { text: "Role clarity was raised by 8 of 19 people who answered at Day 14." };
  await scriptModel("omniroute", [
    { kind: "json", content: bad },
    { kind: "json", content: good },
  ]);
  const retried = await (await hrRequest("/api/hr/themes/narrative", "GET")).json();
  assert.deepEqual(retried, { narrative: good.text });
  assert.equal((await modelCalls("omniroute")).filter((c) => JSON.stringify(c.body).includes("test-gemini-medium")).length, 2);

  await scriptModel("omniroute", [
    { kind: "json", content: bad },
    { kind: "json", content: bad },
  ]);
  assert.deepEqual(await (await hrRequest("/api/hr/themes/narrative", "GET")).json(), { narrative: null });
});

test("R7, R18: the narrative input holds no summary from an exit answer", async () => {
  const { data: person } = await db.from("people").select("id, organisation_id").eq("id", livePerson).single();
  const at = "2026-10-15T15:00:00.000Z";
  const { data: exit } = await db
    .from("responses")
    .insert({ organisation_id: person!.organisation_id, person_id: person!.id, question_id: "exit_open", language: "en", kind: "exit", created_at: at })
    .select("id")
    .single();
  const summary = "The leaver names the exit reason in the narrative";
  await db.from("ai_tags").insert({ organisation_id: person!.organisation_id, response_id: exit!.id, status: "ok", counted: true, escalate: false, summary, created_at: at });
  const before = (await modelCalls("omniroute")).length;
  await scriptModel("omniroute", [{ kind: "json", content: { text: "Role clarity was raised by 8 of 19 people who answered at Day 14." } }]);
  await hrRequest("/api/hr/themes/narrative", "GET");
  const calls = (await modelCalls("omniroute")).slice(before);
  assert.equal(calls.length, 1);
  assert.ok(!JSON.stringify(calls[0].body).includes(summary));
});

test("R25: a corrected tag, a follow-up change and a minimum-group change each write an audit row", async () => {
  const queue = await (await hrRequest("/api/hr/queue", "GET")).json();
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
  assert.deepEqual([corrected.n, corrected.m, corrected.reviewed], [7, 19, 5]);
  const october = await (await hrRequest("/api/hr/themes?month=2026-10", "GET")).json();
  assert.equal(october.cards[0].message, "Not enough people yet (4 of 6 needed)");
});

test("R8: the minimum group size cannot be set below 5", async () => {
  for (const value of [4, 0, -1, 5.5]) {
    assert.equal((await hrRequest("/api/hr/settings", "PUT", { min_group_size: value })).status, 400);
  }
  const { data } = await db.from("organisations").select("min_group_size");
  assert.deepEqual(data, [{ min_group_size: 6 }]);
  assert.equal((await hrRequest("/api/hr/settings", "PUT", { min_group_size: 5 })).status, 200);
});
