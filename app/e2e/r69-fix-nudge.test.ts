import assert from "node:assert/strict";
import { before, test } from "node:test";
import { db, dispatch, freezeClock, hrRequest, link, resetDemo, sentTo, PLAN } from "./helpers.ts";

const leadChat = 5550006901;
const library = (n: number) => `6f1c2a3e-0000-4000-8000-0000000004${String(n).padStart(2, "0")}`;
let lead: string;

async function assign(title: string, libraryNumber: number) {
  const made = await (await hrRequest("/api/hr/actions", "POST", { driver: "WORKLOAD" })).json();
  await hrRequest(`/api/hr/actions/${made.id}`, "PATCH", { library_entry_id: library(libraryNumber), title, plan: PLAN });
  await hrRequest(`/api/hr/actions/${made.id}/notice`, "POST", { no_notice_reason: "Not needed for this test" });
  await hrRequest(`/api/hr/actions/${made.id}`, "PATCH", { scope: { type: "team", team: "Accounts Payable Asia" } });
  const res = await hrRequest(`/api/hr/actions/${made.id}/assign`, "POST", { owner: { manager_id: lead }, due_in_days: 2 });
  assert.equal(res.status, 200);
  assert.equal((await res.json()).alert_sent, true);
  return made.id as string;
}

const nudges = async (title: string) => (await sentTo(leadChat)).filter((m) => String(m.text).startsWith(`Reminder from HR: "${title}"`));
const row = async (id: string) =>
  ((await (await hrRequest("/api/hr/actions", "GET")).json()) as Record<string, unknown>[]).find((action) => action.id === id)!;
const demoMode = (on: boolean) => db.from("organisations").update({ demo_mode: on }).neq("id", "00000000-0000-0000-0000-000000000000");

before(async () => {
  await resetDemo();
  await freezeClock("2026-10-15T03:00:00.000Z");
  const invite = await (await hrRequest("/api/hr/managers", "POST", { display_name: "Mei", email: "mei-r69@contoh.test" })).json();
  lead = invite.manager_id;
  await link(leadChat, String(invite.telegram_link).split("?start=")[1]);
  await hrRequest(`/api/hr/managers/${lead}/hires`, "POST", { code_names: ["Deepa R.", "Zhi Hao R.", "Najwa R.", "Vinod R.", "Danish R."] });
});

test("R69: an ignored fix gets one nudge 24 hours after the alert and one the day after it is due, and HR sees both", async () => {
  const id = await assign("Overtime check", 9);
  await demoMode(false);

  await freezeClock("2026-10-16T02:59:00.000Z");
  await dispatch();
  assert.deepEqual(await nudges("Overtime check"), []);

  await freezeClock("2026-10-16T03:01:00.000Z");
  await dispatch();
  await dispatch();
  const first = await nudges("Overtime check");
  assert.deepEqual(first.map((m) => m.text), ['Reminder from HR: "Overtime check" is still waiting for you. Due Sat 17 Oct.']);
  assert.deepEqual((first[0].reply_markup as { inline_keyboard: { text: string }[][] }).inline_keyboard.flat().map((b) => b.text), ["Mark done"]);

  await freezeClock("2026-10-17T15:59:00.000Z");
  await dispatch();
  assert.equal((await nudges("Overtime check")).length, 1);

  await freezeClock("2026-10-17T16:01:00.000Z");
  await dispatch();
  await dispatch();
  assert.deepEqual((await nudges("Overtime check")).map((m) => m.text), [
    'Reminder from HR: "Overtime check" is still waiting for you. Due Sat 17 Oct.',
    'Reminder from HR: "Overtime check" was due Sat 17 Oct and is not marked done yet.',
  ]);
  const shown = await row(id);
  assert.equal(shown.nudged_at, "2026-10-16T03:01:00+00:00");
  assert.equal(shown.late_nudged_at, "2026-10-17T16:01:00+00:00");
});
