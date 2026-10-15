import assert from "node:assert/strict";
import { before, test } from "node:test";
import {
  addHire,
  db,
  dispatch,
  freezeClock,
  hrRequest,
  joined,
  link,
  resetDemo,
  say,
  sentTo,
  tapData,
} from "./helpers.ts";

const raj = 5550000801;
const [invited, active, stopped, left, extra, fifth] = [811, 812, 813, 815, 816, 817].map((n) => 5550000000 + n);
const names = [...[invited, active, stopped, extra, fifth].map((n) => `Hire ${n}`), "Live hire"];
const mondayMorning = "2026-10-05T03:00:00.000Z";
const mondayEvening = "2026-10-05T12:00:00.000Z";

async function nudgesTo() {
  return (await sentTo(raj)).filter((m) => String(m.text).startsWith("Day "));
}

before(async () => {
  await resetDemo();
  await freezeClock(mondayEvening);
  await link(raj, "mgr-raj-invite");
  await addHire({ code_name: `Hire ${invited}`, start_date: "2026-10-04" });
  await joined(active, "2026-10-04");
  await joined(stopped, "2026-10-04");
  await say(stopped, "/stop");
  await addHire({ code_name: `Hire ${left}`, start_date: "2026-10-04" });
  await addHire({ code_name: `Hire ${extra}`, start_date: "2026-10-04" });
  await addHire({ code_name: `Hire ${fifth}`, start_date: "2026-10-04" });
  assert.equal((await hrRequest("/api/hr/hires/left", "POST", { code_name: `Hire ${left}`, reason: "resigned" })).status, 200);
});

test("R45: demo mode sends no milestone nudge", async () => {
  await freezeClock(mondayMorning);
  assert.equal((await dispatch()).status, 200);
  assert.deepEqual(await nudgesTo(), []);
});

test("R45, R19: outside working hours nothing is sent", async () => {
  await db.from("organisations").update({ demo_mode: false }).neq("id", "00000000-0000-0000-0000-000000000000");
  await freezeClock(mondayEvening);
  assert.equal((await dispatch()).status, 200);
  assert.deepEqual(await nudgesTo(), []);
});

test("R1, R23, R45: the supervisor gets the same Day 1 nudge for every hire still with the company, joined or not, and none for a synthetic or a left hire", async () => {
  await freezeClock(mondayMorning);
  assert.equal((await dispatch()).status, 200);
  const sent = await nudgesTo();
  assert.deepEqual(
    sent.map((m) => m.text),
    names.map((name) => `Day 1 for ${name}: Assign a buddy.`),
  );
  for (const message of sent) {
    assert.deepEqual(
      (message.reply_markup as { inline_keyboard: { text: string }[][] }).inline_keyboard[0].map((b) => b.text),
      ["Done"],
    );
  }
});

test("R45: a second dispatch sends nothing again", async () => {
  await dispatch();
  assert.equal((await nudgesTo()).length, 6);
});

test("R45: Day 7 and Day 30 nudges follow on their days with the fixed text", async () => {
  await addHire({ code_name: "Week old", start_date: "2026-09-28" });
  await addHire({ code_name: "Month old", start_date: "2026-09-05" });
  await dispatch();
  const texts = (await nudgesTo()).map((m) => m.text);
  assert.ok(texts.includes("Day 7 for Week old: Book a 15-minute priorities chat."));
  assert.ok(texts.includes("Day 30 for Month old: Agree a 30-60-90 plan."));
  assert.deepEqual(texts.filter((text) => String(text).includes("Synthetic hire")), []);
});

test("R45, R51: Done is recorded, and HR sees the share done per intake with no manager figure", async () => {
  const buttons = (await nudgesTo()).map((m) => ({
    text: String(m.text),
    data: (m.reply_markup as { inline_keyboard: { callback_data: string }[][] }).inline_keyboard[0][0].callback_data,
  }));
  for (const name of [`Hire ${invited}`, `Hire ${active}`]) {
    await tapData(raj, buttons.find((b) => b.text.startsWith(`Day 1 for ${name}:`))!.data);
  }
  const res = await hrRequest("/api/hr/milestones", "GET");
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), [
    { intake: "2026-09", enough: false, message: "Not enough people yet" },
    { intake: "2026-10", enough: true, hires: 6, share_done: 0.33 },
  ]);
});
