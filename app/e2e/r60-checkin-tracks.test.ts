import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { before, test } from "node:test";
import { appUrl, db, dispatch, freezeClock, hrRequest, hrToken, joined, resetDemo, sentTo } from "./helpers.ts";

const en = JSON.parse(readFileSync(new URL("../data/packs/en.json", import.meta.url), "utf8"));
const question = (id: string) => en.checkin.questions.find((q: { id: string }) => q.id === id).text;
const chat = 5550000601;
const save = async (tracks: unknown[], who?: string) =>
  fetch(`${appUrl}/api/hr/tracks`, {
    method: "PUT",
    headers: { authorization: `Bearer ${await hrToken(who ?? "admin@contoh.test")}`, "content-type": "application/json" },
    body: JSON.stringify({ tracks }),
  });

before(async () => {
  await resetDemo();
  await freezeClock("2026-10-14T01:00:00.000Z");
  await db.from("organisations").update({ demo_mode: false }).neq("id", "00000000-0000-0000-0000-000000000000");
});

test("R60: HR saves the days and questions of each track, and a new joiner gets those days", async () => {
  const saved = await save([
    { id: "new_hire", name: "New hire", days: [2, 5], questions: ["ROLE_CLARITY", "WORKLOAD", "OPEN"] },
    { id: "employee", name: "Employee", days: [200], questions: ["WORKLOAD"] },
  ]);
  assert.equal(saved.status, 200);
  await freezeClock("2026-10-14T01:00:00.000Z");
  await joined(chat, "2026-10-14");
  const { data: person } = await db.from("people").select("id").eq("telegram_chat_id", chat).single();
  const { data } = await db.from("checkin_schedule").select("touchpoint, due_at").eq("person_id", person!.id).order("touchpoint");
  assert.deepEqual(
    data!.map((row) => [row.touchpoint, new Date(row.due_at).toISOString()]),
    [
      [2, "2026-10-16T02:00:00.000Z"],
      [5, "2026-10-19T02:00:00.000Z"],
      [200, "2027-05-03T02:00:00.000Z"],
    ],
  );
});

test("R60: only an HR admin saves the tracks", async () => {
  const res = await save([{ id: "employee", name: "Employee", days: [300], questions: ["WORKLOAD"] }], "hr@contoh.test");
  assert.equal(res.status, 403);
});

test("R60: the same day cannot be in both tracks", async () => {
  const res = await save([
    { id: "new_hire", name: "New hire", days: [2, 200], questions: ["WORKLOAD"] },
    { id: "employee", name: "Employee", days: [200], questions: ["WORKLOAD"] },
  ]);
  assert.equal(res.status, 400);
});

test("R60: an employee check-in asks only the questions of the employee track", async () => {
  const before = (await sentTo(chat)).length;
  await freezeClock("2027-05-03T02:00:00.000Z");
  await dispatch();
  assert.deepEqual((await sentTo(chat)).map((m) => m.text).slice(before), [en.checkin.introNamed.replace("{name}", "Test Hire"), question("WORKLOAD")]);
});
