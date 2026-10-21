import assert from "node:assert/strict";
import { before, test } from "node:test";
import { freezeClock, hrRequest, resetDemo } from "./helpers.ts";

const detail = async (query: string, driver = "ROLE_CLARITY") => {
  const res = await hrRequest(`/api/hr/themes/${driver}${query}`, "GET");
  assert.equal(res.status, 200);
  return res.json();
};

const shares = (body: Record<string, unknown>) =>
  [body.weekly, body.by_day, body.by_intake, body.by_role].flat() as Record<string, unknown>[];

before(async () => {
  await resetDemo();
  await freezeClock("2026-10-15T15:00:00.000Z");
});

test("R8: a group under 5 people returns have and need and no count, on every split", async () => {
  const korean = await detail("?team=Korean%20Desk");
  assert.equal(korean.card.enough, false);
  assert.ok(korean.card.have < korean.card.need);
  assert.equal(korean.card.need, 5);
  assert.ok(!("n" in korean.card));
  const raj = await detail("?team=Accounts%20Payable%20Asia");
  for (const body of [await detail(""), korean, raj]) {
    const small = shares(body).filter((share) => share.enough === false);
    if (body !== raj) assert.ok(small.length > 0);
    for (const share of small) {
      assert.deepEqual(Object.keys(share).filter((key) => !["week", "touchpoint", "intake", "role"].includes(key)).sort(), ["enough", "have", "need"]);
      assert.ok((share.have as number) < 5);
    }
    for (const share of shares(body).filter((candidate) => candidate.enough === true)) {
      assert.ok((share.m as number) >= 5);
    }
  }
});

test("R51: a request for more than one team is refused and no route lists teams", async () => {
  for (const query of ["?team=Korean%20Desk&team=IT%20Service%20Desk", "?team=Korean%20Desk,IT%20Service%20Desk"]) {
    const res = await hrRequest(`/api/hr/themes/ROLE_CLARITY${query}`, "GET");
    assert.equal(res.status, 400);
    assert.deepEqual(await res.json(), { error: "One team at a time" });
  }
  const text = JSON.stringify(await detail(""));
  assert.equal(/"(teams|manager|managers|manager_id|manager_name)"/.test(text), false);
  assert.equal((await hrRequest("/api/hr/themes/UNKNOWN", "GET")).status, 404);
});

test("R51: a team view never splits further by intake or role", async () => {
  const raj = await detail("?team=Accounts%20Payable%20Asia");
  assert.deepEqual([raj.by_intake, raj.by_role], [[], []]);
});

test("Every count on the detail route matches GET /api/hr/themes for the same touchpoint", async () => {
  for (const driver of ["ROLE_CLARITY", "MANAGER_SUPPORT", "BELONGING", "ONBOARDING", "TRAINING", "WORKLOAD"]) {
    const cards = (await (await hrRequest("/api/hr/themes?touchpoint=14", "GET")).json()).cards;
    const body = await detail("?touchpoint=14", driver);
    const card = cards.find((candidate: { driver: string }) => candidate.driver === driver);
    assert.deepEqual(body.card, card);
    const day14 = body.by_day.find((share: { touchpoint: number }) => share.touchpoint === 14);
    assert.deepEqual([day14.n, day14.m, day14.reviewed, day14.ai_confident], [card.n, card.m, card.reviewed, card.ai_confident]);
  }
});

test("Role clarity 23 of 64, Raj's team 6 of 9 and the Korean desk 3 of 5 needed", { todo: "waits for #25 seed" }, async () => {
  const all = await detail("");
  assert.deepEqual([all.card.n, all.card.m], [23, 64]);
  const raj = await detail("?team=Accounts%20Payable%20Asia");
  assert.deepEqual([raj.weekly.at(-1).n, raj.weekly.at(-1).m], [6, 9]);
  const korean = await detail("?team=Korean%20Desk");
  assert.deepEqual([korean.card.have, korean.card.need], [3, 5]);
});
