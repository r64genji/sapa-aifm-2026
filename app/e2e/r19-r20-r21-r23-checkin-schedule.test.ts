import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { before, test } from "node:test";
import { db, dispatch, failChat, freezeClock, hrRequest, joined, resetDemo, sentTo } from "./helpers.ts";

const en = JSON.parse(readFileSync(new URL("../data/packs/en.json", import.meta.url), "utf8"));
const question = (id: string) => en.checkin.questions.find((q: { id: string }) => q.id === id).text;
const texts = async (chat: number) => (await sentTo(chat)).map((m) => m.text);
const schedule = async (chat: number) => {
  const { data: person } = await db.from("people").select("id").eq("telegram_chat_id", chat).single();
  const { data } = await db
    .from("checkin_schedule")
    .select("touchpoint, due_at, status")
    .eq("person_id", person!.id)
    .order("touchpoint");
  return data!.map((row) => ({ ...row, due_at: new Date(row.due_at).toISOString() }));
};

async function reset() {
  await resetDemo();
  await db.from("organisations").update({ demo_mode: false }).neq("id", "00000000-0000-0000-0000-000000000000");
}

before(reset);

test("R19, R60: the schedule has the New hire and Employee touchpoints at 10:00 Kuala Lumpur, weekends moved to Monday", async () => {
  const chat = 5550000101;
  await freezeClock("2026-10-14T01:00:00.000Z");
  await joined(chat, "2026-10-14");
  assert.deepEqual(
    (await schedule(chat)).map((row) => [row.touchpoint, row.due_at]),
    [
      [3, "2026-10-19T02:00:00.000Z"],
      [7, "2026-10-21T02:00:00.000Z"],
      [14, "2026-10-28T02:00:00.000Z"],
      [30, "2026-11-13T02:00:00.000Z"],
      [60, "2026-12-14T02:00:00.000Z"],
      [90, "2027-01-12T02:00:00.000Z"],
      [182, "2027-04-14T02:00:00.000Z"],
      [273, "2027-07-14T02:00:00.000Z"],
      [365, "2027-10-14T02:00:00.000Z"],
      [456, "2028-01-13T02:00:00.000Z"],
      [547, "2028-04-13T02:00:00.000Z"],
    ],
  );
});

test("R19: outside working hours nothing is sent, inside working hours the check-in arrives", async () => {
  const chat = 5550000102;
  await freezeClock("2026-10-14T01:00:00.000Z");
  await joined(chat, "2026-10-14");
  const before = (await texts(chat)).length;
  await freezeClock("2026-10-19T09:30:00.000Z");
  await dispatch();
  assert.equal((await texts(chat)).length, before);
  await freezeClock("2026-10-20T02:00:00.000Z");
  await dispatch();
  assert.deepEqual((await texts(chat)).slice(before), [`${en.checkin.introNamed.replace("{name}", "Test Hire")}\n\n${question("ROLE_CLARITY")}`]);
});

test("R20: one reminder 24 hours later, then skipped 24 hours after that", async () => {
  const chat = 5550000103;
  await freezeClock("2026-10-14T01:00:00.000Z");
  await joined(chat, "2026-10-14");
  const before = (await texts(chat)).length;
  await freezeClock("2026-10-19T02:00:00.000Z");
  await dispatch();
  assert.deepEqual((await texts(chat)).slice(before), [`${en.checkin.introNamed.replace("{name}", "Test Hire")}\n\n${question("ROLE_CLARITY")}`]);
  await freezeClock("2026-10-20T01:59:00.000Z");
  await dispatch();
  assert.equal((await texts(chat)).length, before + 1);
  await freezeClock("2026-10-20T02:00:00.000Z");
  await dispatch();
  await dispatch();
  assert.deepEqual((await texts(chat)).slice(before + 1), [`${en.checkin.reminder}\n\n${question("ROLE_CLARITY")}`]);
  assert.equal((await schedule(chat))[0].status, "reminded");
  await freezeClock("2026-10-21T01:59:00.000Z");
  await dispatch();
  assert.equal((await schedule(chat))[0].status, "reminded");
  await freezeClock("2026-10-21T02:00:00.000Z");
  await dispatch();
  assert.equal((await schedule(chat))[0].status, "skipped");
  assert.equal((await texts(chat)).length, before + 2 + 1);
});

test("R21: three dispatch calls at the same time send each check-in once", async () => {
  const chats = [5550000111, 5550000112, 5550000113];
  await freezeClock("2026-10-14T01:00:00.000Z");
  await Promise.all(chats.map((chat) => joined(chat, "2026-10-14")));
  const before = await Promise.all(chats.map(async (chat) => (await texts(chat)).length));
  await freezeClock("2026-10-19T02:00:00.000Z");
  await Promise.all([dispatch(), dispatch(), dispatch()]);
  for (const [i, chat] of chats.entries()) {
    assert.deepEqual((await texts(chat)).slice(before[i]), [`${en.checkin.introNamed.replace("{name}", "Test Hire")}\n\n${question("ROLE_CLARITY")}`]);
  }
});

test("R23: a synthetic person gets nothing while a real hire due at the same time does", async () => {
  const chat = 5550000121;
  const synthetic = 5550009001;
  await reset();
  await freezeClock("2026-10-14T01:00:00.000Z");
  await joined(chat, "2026-10-14");
  const before = (await texts(chat)).length;
  await freezeClock("2026-10-16T02:00:00.000Z");
  await dispatch();
  await freezeClock("2026-10-19T02:00:00.000Z");
  await dispatch();
  assert.deepEqual((await texts(chat)).slice(before), [`${en.checkin.introNamed.replace("{name}", "Test Hire")}\n\n${question("ROLE_CLARITY")}`]);
  assert.deepEqual(await texts(synthetic), []);
});

test("R20: a check-in sent on a Friday gets its reminder in the first working-hours slot on Monday, not skipped", async () => {
  const chat = 5550000131;
  await reset();
  await freezeClock("2026-10-14T01:00:00.000Z");
  await joined(chat, "2026-10-14");
  await freezeClock("2026-11-13T02:00:00.000Z");
  await dispatch();
  const touchpoint30 = async () => (await schedule(chat)).find((row) => row.touchpoint === 30)!.status;
  assert.equal(await touchpoint30(), "sent");
  const before = (await texts(chat)).length;
  for (const at of ["2026-11-14T02:00:00.000Z", "2026-11-15T02:00:00.000Z", "2026-11-16T00:59:00.000Z", "2026-11-16T01:00:00.000Z"]) {
    await freezeClock(at);
    await dispatch();
  }
  assert.deepEqual((await texts(chat)).slice(before), [`${en.checkin.reminder}\n\n${question("ROLE_CLARITY")}`]);
  assert.equal(await touchpoint30(), "reminded");
  await freezeClock("2026-11-17T01:00:00.000Z");
  await dispatch();
  assert.equal(await touchpoint30(), "skipped");
});

test("R20: a check-in sent on a Friday gets its reminder on Monday instead of lapsing over the weekend", async () => {
  const chat = 5550000104;
  await freezeClock("2026-10-13T01:00:00.000Z");
  await joined(chat, "2026-10-13");
  const before = (await texts(chat)).length;
  await freezeClock("2026-10-16T02:00:00.000Z");
  await dispatch();
  assert.deepEqual((await texts(chat)).slice(before), [`${en.checkin.introNamed.replace("{name}", "Test Hire")}\n\n${question("ROLE_CLARITY")}`]);
  await freezeClock("2026-10-18T02:00:00.000Z");
  await dispatch();
  assert.equal((await texts(chat)).length, before + 1);
  assert.equal((await schedule(chat))[0].status, "sent");
  await freezeClock("2026-10-19T01:00:00.000Z");
  await dispatch();
  assert.deepEqual((await texts(chat)).slice(before + 1), [`${en.checkin.reminder}\n\n${question("ROLE_CLARITY")}`]);
  await freezeClock("2026-10-20T01:00:00.000Z");
  await dispatch();
  assert.equal((await schedule(chat))[0].status, "skipped");
});

test("R21: a failed send to one hire does not stop the check-ins of the others", async () => {
  const chats = [5550000131, 5550000132, 5550000133];
  await reset();
  await freezeClock("2026-10-14T01:00:00.000Z");
  await Promise.all(chats.map((chat) => joined(chat, "2026-10-14")));
  const before = await Promise.all(chats.map(async (chat) => (await texts(chat)).length));
  await failChat(chats[1]);
  await freezeClock("2026-10-19T02:00:00.000Z");
  assert.equal((await dispatch()).status, 200);
  for (const i of [0, 2]) {
    assert.deepEqual((await texts(chats[i])).slice(before[i]), [`${en.checkin.introNamed.replace("{name}", "Test Hire")}\n\n${question("ROLE_CLARITY")}`]);
  }
});

test("R19: nothing is sent on a public holiday HR set, and touchpoints move to the next working day", async () => {
  const early = 5550000105;
  const late = 5550000106;
  await reset();
  const res = await hrRequest("/api/hr/settings/holidays", "PUT", { holidays: ["2026-12-25"] });
  assert.equal(res.status, 200);
  await freezeClock("2026-11-25T01:00:00.000Z");
  await joined(early, "2026-11-25");
  assert.equal((await schedule(early)).find((row) => row.touchpoint === 30)!.due_at, "2026-12-28T02:00:00.000Z");
  await freezeClock("2026-12-21T01:00:00.000Z");
  await joined(late, "2026-12-21");
  const before = (await texts(late)).length;
  await freezeClock("2026-12-24T02:00:00.000Z");
  await dispatch();
  assert.deepEqual((await texts(late)).slice(before), [`${en.checkin.introNamed.replace("{name}", "Test Hire")}\n\n${question("ROLE_CLARITY")}`]);
  await freezeClock("2026-12-25T02:00:00.000Z");
  await dispatch();
  assert.equal((await texts(late)).length, before + 1);
  await freezeClock("2026-12-28T01:00:00.000Z");
  await dispatch();
  assert.deepEqual((await texts(late)).slice(before + 1), [`${en.checkin.reminder}\n\n${question("ROLE_CLARITY")}`]);
});
