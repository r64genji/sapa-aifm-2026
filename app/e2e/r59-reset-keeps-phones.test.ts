import assert from "node:assert/strict";
import { before, test } from "node:test";
import { callReset, db, freezeClock, link, resetDemo, tap, teamInvites } from "./helpers.ts";

const hire = 5550005901;
const raj = 5550005902;
const RAJ = "6f1c2a3e-0000-4000-8000-000000000101";

before(async () => {
  await resetDemo();
  await freezeClock("2026-10-15T15:00:00.000Z");
  await link(hire, teamInvites["Order-to-Cash Asia"]);
  await tap(hire, "Bahasa Malaysia");
  await tap(hire, "Saya setuju");
  await link(raj, "mgr-raj-invite");
});

test("R59: after a demo reset the join links are the same, the new hire is back on its team and language with consent and a schedule, and the team lead stays linked", async () => {
  const links = { ...teamInvites };
  const { data: joined } = await db.from("people").select("id").eq("telegram_chat_id", hire).single();
  const { count: joinedTouchpoints } = await db.from("checkin_schedule").select("id", { count: "exact", head: true }).eq("person_id", joined!.id);
  await callReset();
  assert.deepEqual(teamInvites, links);

  const { data: people } = await db.from("people").select("id, team, language, state").eq("telegram_chat_id", hire);
  assert.equal(people!.length, 1);
  const { id, ...person } = people![0];
  assert.deepEqual(person, { team: "Order-to-Cash Asia", language: "ms", state: "active" });

  const { count: consents } = await db.from("consents").select("id", { count: "exact", head: true }).eq("person_id", id);
  assert.equal(consents, 1);
  const { count: touchpoints } = await db.from("checkin_schedule").select("id", { count: "exact", head: true }).eq("person_id", id);
  assert.equal(touchpoints, joinedTouchpoints);
  assert.ok(touchpoints! > 0);

  const { data: lead } = await db.from("managers").select("telegram_chat_id").eq("id", RAJ).single();
  assert.equal(Number(lead!.telegram_chat_id), raj);
});
