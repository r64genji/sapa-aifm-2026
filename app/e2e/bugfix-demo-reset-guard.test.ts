import assert from "node:assert/strict";
import { before, test } from "node:test";
import { addHire, appUrl, db, freezeClock, resetDemo } from "./helpers.ts";

const reset = (secret: string | undefined) =>
  fetch(`${appUrl}/api/demo/reset`, { method: "POST", headers: { authorization: `Bearer ${secret}` } });

const kept = async () => (await db.from("people").select("code_name").eq("code_name", "Kept hire")).data;

before(async () => {
  await resetDemo();
  await freezeClock("2026-10-15T15:00:00.000Z");
  assert.equal((await addHire({ code_name: "Kept hire" })).status, 201);
});

test("Bug fix: the dispatch secret cannot reset the demo, and no reset runs while demo mode is off", async () => {
  assert.equal((await reset(process.env.DISPATCH_SECRET)).status, 401);
  assert.deepEqual(await kept(), [{ code_name: "Kept hire" }]);

  await db.from("organisations").update({ demo_mode: false }).neq("id", "00000000-0000-0000-0000-000000000000");
  assert.equal((await reset(process.env.DEMO_RESET_SECRET)).status, 409);
  assert.deepEqual(await kept(), [{ code_name: "Kept hire" }]);
});
