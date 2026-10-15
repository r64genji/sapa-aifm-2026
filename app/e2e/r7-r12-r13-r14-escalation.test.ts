import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { before, test } from "node:test";
import {
  appUrl,
  classifierTag,
  db,
  freezeClock,
  hrRequest,
  hrToken,
  joined,
  resetDemo,
  say,
  scriptModel,
  sentTo,
  sessionClient,
  settle,
  tap,
} from "./helpers.ts";

const read = (path: string) => JSON.parse(readFileSync(new URL(path, import.meta.url), "utf8"));
const en = read("../data/packs/en.json");
const [organisation] = read("../data/seed/organisations.json");
const contacts = organisation.escalation_contacts;
const probes: string[] = en.checkin.probes.map((p: { text: string }) => p.text);
const [crisis, passport, epf, modelOnly, plain] = [401, 402, 403, 404, 405].map((n) => 5550000000 + n);

async function reachOpenQuestion(chat: number) {
  await tap(chat, "4");
  await tap(chat, "3");
  await tap(chat, "5");
  await tap(chat, "3");
  await tap(chat, "3");
  await tap(chat, "3");
}

async function answer(chat: number, text: string) {
  const before = (await sentTo(chat)).length;
  await say(chat, text);
  for (let i = 0; i < 60 && (await sentTo(chat)).length === before; i++) await settle(500);
  await settle();
  return (await sentTo(chat)).slice(before).map((m) => String(m.text));
}

async function openResponse(chat: number) {
  const { data: who } = await db.from("people").select("id").eq("telegram_chat_id", chat).single();
  const { data } = await db
    .from("responses")
    .select("id")
    .eq("person_id", who!.id)
    .eq("question_id", "OPEN")
    .single();
  return data!.id as string;
}

async function escalations() {
  const res = await hrRequest("/api/hr/escalations", "GET");
  assert.equal(res.status, 200);
  return (await res.json()) as Record<string, unknown>[];
}

async function escalationFor(chat: number) {
  const responseId = await openResponse(chat);
  return (await escalations()).find((row) => row.response_id === responseId)!;
}

before(async () => {
  await resetDemo();
  await freezeClock("2026-10-15T15:00:00.000Z");
  for (const chat of [crisis, passport, epf, modelOnly, plain]) await joined(chat, "2026-10-02");
  const res = await hrRequest("/api/hr/demo/advance", "POST", { day: 14 });
  assert.equal((await res.json()).sent, 5);
  for (const chat of [crisis, passport, epf, modelOnly, plain]) await reachOpenQuestion(chat);
});

test("R13, R14: a crisis reply escalates by keyword while the model times out, with the configured contacts, and HR is alerted", async () => {
  await scriptModel("omniroute", [{ kind: "timeout" }]);
  await scriptModel("deepseek", [{ kind: "timeout" }]);
  const replies = await answer(crisis, "I can't take it anymore, I want to kill myself");
  assert.equal(replies.length, 1);
  assert.ok(replies[0].includes(en.safety.message));
  for (const contact of contacts.general) assert.ok(replies[0].includes(contact));

  const alert = await escalationFor(crisis);
  assert.equal(alert.category, "self_harm_crisis");
  assert.equal(alert.source, "keyword");
  assert.equal(alert.acknowledged_at, null);
  assert.equal(alert.due_at, "2026-10-16T15:00:00.000Z");
  assert.equal(alert.overdue, false);

  await freezeClock("2026-10-16T16:00:00.000Z");
  assert.deepEqual(
    (await escalations()).map(({ waited_hours, overdue }) => ({ waited_hours, overdue })),
    [{ waited_hours: 25, overdue: true }],
  );
  assert.equal((await hrRequest(`/api/hr/escalations/${alert.id}/acknowledge`, "POST")).status, 200);
  assert.equal((await hrRequest(`/api/hr/escalations/${alert.id}/acknowledge`, "POST")).status, 409);
  assert.equal((await hrRequest(`/api/hr/escalations/${alert.id}/contact`, "POST")).status, 200);
  const seen = await escalationFor(crisis);
  assert.equal(seen.acknowledged_at, "2026-10-16T16:00:00+00:00");
  assert.equal(seen.contact_recorded_at, "2026-10-16T16:00:00+00:00");
  await freezeClock("2026-10-15T15:00:00.000Z");
});

test("R14, R12: a passport held by the agent escalates by keyword, the labour authority stays after HR removes contacts, and no probe follows", async () => {
  const res = await hrRequest("/api/hr/settings/escalation-contacts", "PUT", {
    general: contacts.general,
    forced_labour_indicator: [],
  });
  assert.equal(res.status, 200);
  await scriptModel("omniroute", [
    { kind: "json", content: classifierTag({ evidence_quote: "The agent holds my passport", probe_id: "ROLE_CLARITY" }) },
  ]);
  const replies = await answer(passport, "The agent holds my passport");
  assert.equal(replies.length, 1);
  assert.ok(replies[0].includes(en.safety.forcedLabour));
  assert.ok(replies[0].includes(en.safety.labourAuthority));
  assert.ok(en.safety.labourAuthority.includes("[SLOT: contact, verified before launch]"));
  for (const contact of contacts.forced_labour_indicator) assert.ok(!replies[0].includes(contact));
  assert.ok(!probes.some((probe) => replies.includes(probe)));

  const alert = await escalationFor(passport);
  assert.equal(alert.category, "forced_labour_indicator");
  assert.equal(alert.source, "keyword");
});

test("R13: EPF and SOCSO taken from the pay alone does not escalate by keyword", async () => {
  const replies = await answer(epf, "EPF and SOCSO were taken from my pay");
  assert.deepEqual(replies, [en.checkin.gotIt]);
  assert.equal((await escalations()).length, 2);
});

test("R13, R12: the model alone escalates, and no probe follows", async () => {
  await scriptModel("omniroute", [
    {
      kind: "json",
      content: classifierTag({
        drivers: ["MANAGER_SUPPORT"],
        escalate: true,
        escalate_category: "bullying_threats",
        evidence_quote: "shouts at me every day",
        probe_id: "GENERIC_MORE",
      }),
    },
  ]);
  const replies = await answer(modelOnly, "My supervisor shouts at me every day and says I will regret it");
  assert.equal(replies.length, 1);
  assert.ok(replies[0].includes(en.safety.message));
  const alert = await escalationFor(modelOnly);
  assert.equal(alert.category, "bullying_threats");
  assert.equal(alert.source, "model");
});

test("R7: a manager gets nothing for escalations, and an escalated reply is in no theme count", async () => {
  await scriptModel("omniroute", [{ kind: "json", content: classifierTag({ evidence_quote: "not sure what to do first" }) }]);
  assert.deepEqual(await answer(plain, "Too many tasks, not sure what to do first"), [en.checkin.thanks]);

  const escalated = await openResponse(passport);
  const { data: tag } = await db.from("ai_tags").select("status, drivers").eq("response_id", escalated).single();
  assert.deepEqual(tag, { status: "ok", drivers: ["ROLE_CLARITY"] });
  const { data: counted } = await db.from("theme_tags").select("response_id");
  const countedIds = counted!.map((row) => row.response_id);
  assert.ok(countedIds.includes(await openResponse(plain)));
  assert.ok(!countedIds.includes(escalated));

  const manager = await hrToken("raj@contoh.test");
  const res = await fetch(`${appUrl}/api/hr/escalations`, { headers: { authorization: `Bearer ${manager}` } });
  assert.equal(res.status, 401);

  const asManager = await sessionClient("raj@contoh.test");
  for (const table of ["escalations", "responses", "ai_tags", "theme_tags"]) {
    const { data, error } = await asManager.from(table).select("*");
    assert.equal(error, null);
    assert.deepEqual(data, []);
  }
  const { count } = await asManager.from("escalations").select("*", { count: "exact", head: true });
  assert.equal(count, 0);

  const asHr = await sessionClient("hr@contoh.test");
  const { data: hrRows } = await asHr.from("escalations").select("category").order("created_at");
  assert.equal(hrRows!.length, 3);
});
