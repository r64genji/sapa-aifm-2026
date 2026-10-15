import assert from "node:assert/strict";
import { before, test } from "node:test";
import { addHire, appUrl, db, freezeClock, hrToken, resetDemo, scriptModel } from "./helpers.ts";

const reset = (secret: string | undefined) =>
  fetch(`${appUrl}/api/demo/reset`, { method: "POST", headers: { authorization: `Bearer ${secret}` } });

const asHr = async (path: string, email: string, method = "GET") =>
  fetch(`${appUrl}/api/hr/demo/${path}`, { method, headers: { authorization: `Bearer ${await hrToken(email)}` } });

const demoMode = (on: boolean) =>
  db.from("organisations").update({ demo_mode: on }).neq("id", "00000000-0000-0000-0000-000000000000");

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

test("HR-side demo reset: plain HR gets 403, no reset runs outside demo mode, admin restores the seed and gets the live invite", async () => {
  assert.equal((await asHr("reset", "hr@contoh.test", "POST")).status, 403);
  assert.deepEqual(await kept(), [{ code_name: "Kept hire" }]);

  await demoMode(false);
  assert.equal((await asHr("reset", "admin@contoh.test", "POST")).status, 409);
  assert.deepEqual(await kept(), [{ code_name: "Kept hire" }]);

  await demoMode(true);
  const res = await asHr("reset", "admin@contoh.test", "POST");
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.deepEqual(Object.keys(body), ["invite_link"]);
  assert.match(body.invite_link, /\?start=.+/);
  assert.deepEqual(await kept(), []);
});

test("Demo status: plain HR gets 403, 409 outside demo mode, a dead model shows Not reachable within 5 s, and no secret leaks", async () => {
  assert.equal((await asHr("status", "hr@contoh.test")).status, 403);

  await demoMode(false);
  assert.equal((await asHr("status", "admin@contoh.test")).status, 409);
  await demoMode(true);

  await scriptModel("omniroute", [{ kind: "timeout" }]);
  const started = Date.now();
  const res = await asHr("status", "admin@contoh.test");
  assert.ok(Date.now() - started < 5000);
  assert.equal(res.status, 200);
  const text = await res.text();
  const status = JSON.parse(text);
  assert.equal(status.main_ai.reachable, false);
  assert.equal(status.phones.live_hire_bound, false);
  assert.equal(status.live_hire.next_check_in, null);

  for (const name of [
    "DEMO_RESET_SECRET",
    "DISPATCH_SECRET",
    "OMNIROUTE_API_KEY",
    "DEEPSEEK_API_KEY",
    "TELEGRAM_BOT_TOKEN",
    "TELEGRAM_WEBHOOK_SECRET_TOKEN",
    "SEED_USER_PASSWORD",
    "REPLY_ENCRYPTION_KEY",
  ]) {
    assert.ok(process.env[name]);
    assert.ok(!text.includes(process.env[name]!), name);
  }
});
