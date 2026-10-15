import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { before, test } from "node:test";
import { db, dispatch, freezeClock, joined, resetDemo, sentTo } from "./helpers.ts";

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

test("R19: the schedule has seven touchpoints at 10:00 Kuala Lumpur, weekends moved to Monday", async () => {
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
  assert.deepEqual((await texts(chat)).slice(before), [en.checkin.intro, question("ROLE_CLARITY")]);
});

test("R20: one reminder 24 hours later, then skipped 24 hours after that", async () => {
  const chat = 5550000103;
  await freezeClock("2026-10-14T01:00:00.000Z");
  await joined(chat, "2026-10-14");
  const before = (await texts(chat)).length;
  await freezeClock("2026-10-19T02:00:00.000Z");
  await dispatch();
  assert.deepEqual((await texts(chat)).slice(before), [en.checkin.intro, question("ROLE_CLARITY")]);
  await freezeClock("2026-10-20T01:59:00.000Z");
  await dispatch();
  assert.equal((await texts(chat)).length, before + 2);
  await freezeClock("2026-10-20T02:00:00.000Z");
  await dispatch();
  await dispatch();
  assert.deepEqual((await texts(chat)).slice(before + 2), [en.checkin.reminder, question("ROLE_CLARITY")]);
  assert.equal((await schedule(chat))[0].status, "reminded");
  await freezeClock("2026-10-21T01:59:00.000Z");
  await dispatch();
  assert.equal((await schedule(chat))[0].status, "reminded");
  await freezeClock("2026-10-21T02:00:00.000Z");
  await dispatch();
  assert.equal((await schedule(chat))[0].status, "skipped");
  assert.equal((await texts(chat)).length, before + 4 + 2);
});

test("R21: three dispatch calls at the same time send each check-in once", async () => {
  const chats = [5550000111, 5550000112, 5550000113];
  await freezeClock("2026-10-14T01:00:00.000Z");
  for (const chat of chats) await joined(chat, "2026-10-14");
  const before = await Promise.all(chats.map(async (chat) => (await texts(chat)).length));
  await freezeClock("2026-10-19T02:00:00.000Z");
  await Promise.all([dispatch(), dispatch(), dispatch()]);
  for (const [i, chat] of chats.entries()) {
    assert.deepEqual((await texts(chat)).slice(before[i]), [en.checkin.intro, question("ROLE_CLARITY")]);
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
  assert.deepEqual((await texts(chat)).slice(before), [en.checkin.intro, question("ROLE_CLARITY")]);
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
  assert.deepEqual((await texts(chat)).slice(before), [en.checkin.reminder, question("ROLE_CLARITY")]);
  assert.equal(await touchpoint30(), "reminded");
  await freezeClock("2026-11-17T01:00:00.000Z");
  await dispatch();
  assert.equal(await touchpoint30(), "skipped");
});
