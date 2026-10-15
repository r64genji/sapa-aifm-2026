import assert from "node:assert/strict";
import { before, test } from "node:test";
import { db, freezeClock, hrRequest, modelCalls, resetDemo, scriptModel } from "./helpers.ts";

const org = "6f1c2a3e-0000-4000-8000-000000000001";
const raj = "6f1c2a3e-0000-4000-8000-000000000101";
const at = "2026-10-01T03:00:00Z";

const groups = () => hrRequest("/api/hr/themes/ROLE_CLARITY/groups?touchpoint=14", "GET").then((res) => res.json());

async function addRoleClarityReplies(count: number) {
  for (let i = 1; i <= count; i++) {
    const person = await db
      .from("people")
      .insert({ organisation_id: org, code_name: `Group test ${i}`, team: "Accounts Payable Asia", manager_id: raj, start_date: "2026-09-07", role: "Accounts payable analyst", language: "en", invite_token: `group-test-${i}`, invite_expires_at: "2026-11-01T00:00:00Z", state: "active", synthetic: true })
      .select("id")
      .single();
    assert.equal(person.error, null);
    const schedule = await db
      .from("checkin_schedule")
      .insert({ organisation_id: org, person_id: person.data!.id, touchpoint: 14, due_at: at, status: "answered" })
      .select("id")
      .single();
    assert.equal(schedule.error, null);
    const response = await db
      .from("responses")
      .insert({ organisation_id: org, person_id: person.data!.id, schedule_id: schedule.data!.id, question_id: "OPEN", language: "en", created_at: at })
      .select("id")
      .single();
    assert.equal(response.error, null);
    const tag = await db.from("ai_tags").insert({
      organisation_id: org,
      response_id: response.data!.id,
      status: "reviewed",
      drivers: ["ROLE_CLARITY"],
      escalate: false,
      summary: `The employee is unsure which tasks come first, case ${i}.`,
      counted: true,
      created_at: at,
    });
    assert.equal(tag.error, null);
  }
}

before(async () => {
  await resetDemo();
  await freezeClock("2026-10-15T15:00:00.000Z");
  await addRoleClarityReplies(3);
});

test("R8, R18, R37: a 4-person group is dropped, a title with a number is retried once, the calls are in ai_usage, and a second request the same day makes no model call", async () => {
  const bad = { groups: [{ title: "Top 3 task problems", reply_ids: ["r1", "r2", "r3", "r4", "r5"] }] };
  const good = {
    groups: [
      { title: "Too many urgent tasks, no order", reply_ids: ["r1", "r2", "r3", "r4", "r5"] },
      { title: "Unclear who decides", reply_ids: ["r6", "r7", "r8", "r9"] },
    ],
  };
  await scriptModel("omniroute", [
    { kind: "json", content: bad },
    { kind: "json", content: good },
  ]);
  const cards = await (await hrRequest("/api/hr/themes?touchpoint=14", "GET")).json();
  const card = cards.cards.find((candidate: { driver: string }) => candidate.driver === "ROLE_CLARITY");

  const first = await groups();
  assert.equal(first.status, "ok");
  assert.equal(first.groups.length, 1);
  assert.equal(first.groups[0].title, "Too many urgent tasks, no order");
  assert.equal(first.groups[0].n, 5);
  assert.equal(first.groups[0].reply_ids.length, 5);
  assert.equal(first.not_grouped, card.n - 5);
  assert.equal((await modelCalls("omniroute")).length, 2);

  const { data: usage } = await db.from("ai_usage").select("call_type, ok").eq("call_type", "group");
  assert.deepEqual(usage, [
    { call_type: "group", ok: true },
    { call_type: "group", ok: true },
  ]);
  const { data: rows } = await db.from("responses").select("id").in("id", first.groups[0].reply_ids);
  assert.equal(rows!.length, 5);

  assert.deepEqual(await groups(), first);
  assert.equal((await modelCalls("omniroute")).length, 2);
});

test("When the model fails the route says unavailable and shows no groups", async () => {
  await db.from("theme_groups").delete().eq("organisation_id", org);
  await scriptModel("omniroute", [{ kind: "error", status: 503 }]);
  await scriptModel("deepseek", [{ kind: "error", status: 503 }]);
  assert.deepEqual(await groups(), { touchpoint: 14, driver: "ROLE_CLARITY", status: "unavailable" });
});
