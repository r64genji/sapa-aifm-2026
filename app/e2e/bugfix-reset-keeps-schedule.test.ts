import assert from "node:assert/strict";
import { before, test } from "node:test";
import { appUrl, callReset, freezeClock, hrToken, resetDemo } from "./helpers.ts";

const tracks = [
  { id: "new_hire", name: "First weeks", days: [5, 21], questions: ["ROLE_CLARITY", "OPEN"] },
  { id: "employee", name: "Later", days: [400], questions: ["WORKLOAD"] },
];

const asAdmin = async (method: string, body?: object) =>
  fetch(`${appUrl}/api/hr/tracks`, {
    method,
    headers: { authorization: `Bearer ${await hrToken("admin@contoh.test")}`, "content-type": "application/json" },
    body: body && JSON.stringify(body),
  });

before(async () => {
  await resetDemo();
  await freezeClock("2026-10-15T15:00:00.000Z");
});

test("Bug fix: Reset to seed keeps the check-in schedule HR saved", async () => {
  assert.equal((await asAdmin("PUT", { tracks })).status, 200);
  await callReset();
  assert.deepEqual(await (await asAdmin("GET")).json(), tracks);
});
