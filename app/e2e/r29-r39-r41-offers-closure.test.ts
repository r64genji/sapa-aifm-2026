import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { before, test } from "node:test";
import {
  classifierTag,
  db,
  dispatch,
  freezeClock,
  hrRequest,
  joined,
  resetDemo,
  say,
  scriptModel,
  sentTo,
  settle,
  tap,
} from "./helpers.ts";

const read = (path: string) => JSON.parse(readFileSync(new URL(path, import.meta.url), "utf8"));
const en = read("../data/packs/en.json");
const [organisation] = read("../data/seed/organisations.json");
const generic = "This person is not receiving messages from Sapa now";
const quote = "tak tahu mana nak buat dulu";
const [yes, noThanks, silent, plain, passport, crisis, leaver, stopper] = [501, 502, 503, 504, 505, 506, 507, 508].map(
  (n) => 5550000000 + n,
);
const replies: Record<number, string[]> = {};

async function answer(chat: number, text: string) {
  const before = (await sentTo(chat)).length;
  await say(chat, text);
  for (let i = 0; i < 60 && (await sentTo(chat)).length === before; i++) await settle(500);
  await settle();
}

async function responseIds(chat: number) {
  const { data: who } = await db.from("people").select("id").eq("telegram_chat_id", chat).single();
  const { data } = await db.from("responses").select("id").eq("person_id", who!.id).eq("kind", "checkin").not("text_encrypted", "is", null).order("created_at");
  return data!.map((row) => row.id as string);
}

async function twoReplies(chat: number) {
  await scriptModel("omniroute", [{ kind: "json", content: classifierTag({ probe_id: "GENERIC_MORE" }) }]);
  await answer(chat, quote);
  await scriptModel("omniroute", [{ kind: "json", content: classifierTag() }]);
  await answer(chat, quote);
  replies[chat] = await responseIds(chat);
  assert.equal(replies[chat].length, 2);
}

const offer = async (responseId: string) => hrRequest(`/api/hr/replies/${responseId}/offer`, "POST");
const offers = async () => (await (await hrRequest("/api/hr/offers", "GET")).json()) as Record<string, unknown>[];
const texts = async (chat: number) => (await sentTo(chat)).map((m) => m.text);

async function escalationFor(chat: number) {
  const [responseId] = await responseIds(chat);
  const list = (await (await hrRequest("/api/hr/escalations", "GET")).json()) as { id: string; response_id: string }[];
  return list.find((row) => row.response_id === responseId)!;
}

before(async () => {
  await resetDemo();
  await freezeClock("2026-10-15T15:00:00.000Z");
  const chats = [yes, noThanks, silent, plain, passport, crisis, leaver, stopper];
  for (const chat of chats) await joined(chat, "2026-10-02");
  const res = await hrRequest("/api/hr/demo/advance", "POST", { day: 14 });
  assert.equal((await res.json()).sent, chats.length);
  for (const chat of chats) {
    await tap(chat, "4");
    await tap(chat, "3");
    await tap(chat, "5");
  }
  for (const chat of [yes, noThanks, silent]) await twoReplies(chat);
  for (const chat of [plain, stopper]) {
    await scriptModel("omniroute", [{ kind: "json", content: classifierTag() }]);
    await answer(chat, quote);
    replies[chat] = await responseIds(chat);
  }
  await scriptModel("omniroute", [
    { kind: "json", content: classifierTag({ evidence_quote: "The agent holds my passport" }) },
  ]);
  await answer(passport, "The agent holds my passport");
  for (const chat of [crisis, leaver]) {
    await scriptModel("omniroute", [{ kind: "timeout" }]);
    await scriptModel("deepseek", [{ kind: "timeout" }]);
    await answer(chat, "I can't take it anymore, I want to kill myself");
  }
  await db.from("organisations").update({ demo_mode: false }).neq("id", "00000000-0000-0000-0000-000000000000");
});

test("R39: the offer waits for the next working-hours slot, one open offer per person, one per reply, Yes creates a task due in 2 working days", async () => {
  const [first, second] = replies[yes];
  for (const chat of [yes, noThanks, silent]) assert.equal((await offer(replies[chat][0])).status, 200);
  assert.equal((await offer(first)).status, 409);
  assert.equal((await offer(second)).status, 409);

  await dispatch();
  for (const chat of [yes, noThanks, silent]) assert.ok(!(await texts(chat)).includes(en.offer.text));

  await freezeClock("2026-10-16T02:00:00.000Z");
  await dispatch();
  for (const chat of [yes, noThanks, silent]) {
    const sent = (await sentTo(chat)).find((m) => m.text === en.offer.text)!;
    assert.deepEqual(
      (sent.reply_markup as { inline_keyboard: { text: string }[][] }).inline_keyboard.flat().map((b) => b.text),
      ["Yes", "No thanks"],
    );
  }

  await tap(noThanks, "No thanks");
  assert.equal((await texts(noThanks)).at(-1), en.offer.declined);
  await tap(yes, "Yes");
  assert.equal((await texts(yes)).at(-1), en.offer.accepted);
  const task = (await offers()).find((row) => row.response_id === first)!;
  assert.equal(task.answer, "yes");
  assert.equal(new Date(task.contact_due_at as string).toISOString(), "2026-10-20T02:00:00.000Z");
  assert.equal(task.contact_done_at, null);
  assert.equal((await hrRequest(`/api/hr/offers/${task.id}/contact-done`, "POST")).status, 200);
  assert.equal((await hrRequest(`/api/hr/offers/${task.id}/contact-done`, "POST")).status, 409);
});

test("R39: only a reply marked as needing follow-up, and not an escalation, can get an offer", async () => {
  const [reply] = replies[plain];
  assert.equal((await hrRequest(`/api/hr/replies/${reply}/follow-up`, "POST", { value: false })).status, 200);
  assert.equal((await offer(reply)).status, 409);
  assert.equal((await hrRequest(`/api/hr/replies/${reply}/follow-up`, "POST", { value: true })).status, 200);
  assert.equal((await offer(reply)).status, 200);

  const [escalated] = await responseIds(passport);
  assert.equal((await offer(escalated)).status, 409);
});

test("R29: the closure message goes out, and is blocked for don't-contact and for a stopped person with the one generic reason", async () => {
  const sentBefore = (await texts(passport)).length;
  const sent = await hrRequest(`/api/hr/escalations/${(await escalationFor(passport)).id}/close`, "POST", { send_closure: true });
  assert.deepEqual(await sent.json(), { closed_at: "2026-10-16T02:00:00.000Z", closure: "sent" });
  assert.deepEqual((await texts(passport)).slice(sentBefore), [[en.closure, ...organisation.escalation_contacts.general].join("\n")]);
  assert.equal((await hrRequest(`/api/hr/escalations/${(await escalationFor(passport)).id}/close`, "POST", {})).status, 409);

  const crisisEscalation = await escalationFor(crisis);
  assert.equal((await hrRequest(`/api/hr/escalations/${crisisEscalation.id}/dont-contact`, "POST")).status, 200);
  const crisisBefore = (await texts(crisis)).length;
  const blocked = await hrRequest(`/api/hr/escalations/${crisisEscalation.id}/close`, "POST", { send_closure: true });
  assert.deepEqual(await blocked.json(), { closed_at: "2026-10-16T02:00:00.000Z", closure: "blocked", reason: generic });
  assert.equal((await texts(crisis)).length, crisisBefore);
});

test("R41, R29, R39: an offer or a closure to a stopped person shows only the generic reason", async () => {
  await say(stopper, "/stop");
  const res = await offer(replies[stopper][0]);
  assert.equal(res.status, 409);
  assert.deepEqual(await res.json(), { error: generic, code: 409 });

  await say(leaver, "/stop");
  const closed = await hrRequest(`/api/hr/escalations/${(await escalationFor(leaver)).id}/close`, "POST", { send_closure: true });
  assert.deepEqual((await closed.json()).reason, generic);
});

test("R39: no answer in 7 days closes the offer", async () => {
  await freezeClock("2026-10-22T02:00:00.000Z");
  await dispatch();
  const open = async () => (await offers()).find((row) => row.response_id === replies[silent][0])!;
  assert.equal((await open()).open, true);
  await freezeClock("2026-10-23T02:00:00.000Z");
  await dispatch();
  assert.deepEqual(
    { answer: (await open()).answer, open: (await open()).open },
    { answer: "none", open: false },
  );
  assert.equal((await offer(replies[silent][1])).status, 200);
});

test("R39: after No thanks, no new offer for 30 days", async () => {
  await freezeClock("2026-11-14T02:00:00.000Z");
  assert.equal((await offer(replies[noThanks][1])).status, 409);
  await freezeClock("2026-11-15T02:00:00.000Z");
  assert.equal((await offer(replies[noThanks][1])).status, 200);
});
