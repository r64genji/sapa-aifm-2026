import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { before, test } from "node:test";
import {
  appUrl,
  classifierTag,
  db,
  dispatch,
  freezeClock,
  hrRequest,
  hrToken,
  joined,
  link,
  liveInvite,
  resetDemo,
  say,
  scriptModel,
  sentTo,
  tap,
  tapData,
} from "./helpers.ts";

const read = (path: string) => JSON.parse(readFileSync(new URL(path, import.meta.url), "utf8"));
const en = read("../data/packs/en.json");
const [organisation] = read("../data/seed/organisations.json");
const live = 5550001401;
const other = 5550001402;
const exported = 5550001403;
const reply = "Boss bagi 3 task semua urgent, tak tahu mana nak buat dulu";
const summary = "The employee does not know which task to do first.";
const threat = "My supervisor threatened to cut my pay if I complain";
const question = "Where do I park my motorbike?";
let seedWorkload = 0;

type Message = { text: string; reply_markup?: { inline_keyboard: { text: string; callback_data: string }[][] } };

const messages = async (chat: number) => (await sentTo(chat)) as unknown as Message[];
const texts = async (chat: number) => (await messages(chat)).map((m) => m.text);
const buttons = (m: Message) => m.reply_markup?.inline_keyboard.flat().map((b) => b.text) ?? [];

async function newMessages(chat: number, act: () => Promise<void>) {
  const count = (await messages(chat)).length;
  await act();
  return (await messages(chat)).slice(count);
}

const card = async (driver: string) => {
  const body = await (await hrRequest("/api/hr/themes", "GET")).json();
  const { n, m } = body.cards.find((c: { driver: string }) => c.driver === driver);
  return { n, m };
};

async function personId(code: string) {
  const { data } = await db.from("people").select("id").eq("code_name", code).single();
  return data!.id as string;
}

async function adminExport(body: Record<string, unknown>, email = "admin@contoh.test") {
  return fetch(`${appUrl}/api/hr/exports`, {
    method: "POST",
    headers: { authorization: `Bearer ${await hrToken(email)}`, "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function nightly() {
  const res = await fetch(`${appUrl}/api/nightly`, {
    method: "POST",
    headers: { authorization: `Bearer ${process.env.DISPATCH_SECRET}` },
  });
  assert.equal(res.status, 200);
}

before(async () => {
  await resetDemo();
  await freezeClock("2026-10-15T15:00:00.000Z");
});

test("R40: /myanswers shows own replies, escalated ones with date and text only, and This is wrong takes the tags out of counts until HR reviews", async () => {
  seedWorkload = (await card("WORKLOAD")).n;
  await link(live, liveInvite);
  await tap(live, "English");
  await tap(live, en.agree);
  assert.equal((await hrRequest("/api/hr/demo/advance", "POST", { day: 14 })).status, 200);
  await tap(live, "4");
  await tap(live, "3");
  await tap(live, "5");
  await scriptModel("omniroute", [{ kind: "json", content: classifierTag() }]);
  await say(live, reply);
  const [queued] = await (await hrRequest("/api/hr/queue", "GET")).json();
  assert.equal((await hrRequest(`/api/hr/replies/${queued.id}/review`, "POST")).status, 200);
  assert.deepEqual(await card("ROLE_CLARITY"), { n: 8, m: 19 });
  await freezeClock("2026-10-15T15:01:00.000Z");
  await say(live, threat);

  const shown = await newMessages(live, () => say(live, "/myanswers"));
  assert.deepEqual(
    shown.map((m) => [m.text, buttons(m)]),
    [
      [`2026-10-15\n${reply}\n${en.myAnswers.aiReading}: ${summary}\n${en.myAnswers.labels}: ${en.labels.ROLE_CLARITY}`, [en.myAnswers.wrong]],
      [`2026-10-15\n${threat}`, []],
    ],
  );

  await joined(other, "2026-10-14");
  assert.deepEqual(await newMessages(other, () => say(other, "/jawapansaya")).then((m) => m.map((x) => x.text)), [en.myAnswers.none]);
  const wrongButton = shown[0].reply_markup!.inline_keyboard.flat()[0];
  await tapData(other, wrongButton.callback_data);
  assert.deepEqual(await card("ROLE_CLARITY"), { n: 8, m: 19 });

  assert.deepEqual(
    await newMessages(live, () => tapData(live, wrongButton.callback_data)).then((m) => m.map((x) => x.text)),
    [en.myAnswers.challenged],
  );
  assert.deepEqual(await card("ROLE_CLARITY"), { n: 7, m: 18 });
  const challenged = (await (await hrRequest("/api/hr/queue", "GET")).json()).find((r: { id: string }) => r.id === queued.id);
  assert.equal(challenged.note, "Challenged by new hire");
  assert.equal(challenged.status, "needs_review");

  const resolved = await newMessages(live, async () => {
    assert.equal((await hrRequest(`/api/hr/replies/${queued.id}/review`, "POST", { drivers: ["WORKLOAD"] })).status, 200);
  });
  assert.deepEqual(resolved.map((m) => m.text), [`${en.myAnswers.resolved} ${en.labels.WORKLOAD}`]);
  assert.deepEqual(await card("ROLE_CLARITY"), { n: 7, m: 19 });
  assert.deepEqual(await card("WORKLOAD"), { n: seedWorkload + 1, m: 19 });

  const again = await newMessages(live, () => say(live, "/myanswers"));
  assert.equal(again[0].text, `2026-10-15\n${reply}\n${en.myAnswers.changedByHr}: ${summary}\n${en.myAnswers.labels}: ${en.labels.WORKLOAD}`);
});

test("R4, R35: DELETE asks once, Keep deletes nothing, a confirmed delete removes the hire's rows and questions, drops live counts by one, leaves snapshots alone and writes one anonymous audit row", async () => {
  const id = await personId("Live hire");
  const raj = { authorization: `Bearer ${await hrToken("raj@contoh.test")}` };
  const snapshots = async () => (await fetch(`${appUrl}/api/manager/snapshots`, { headers: raj })).json();
  const published = await snapshots();
  const production = published.find((s: { team: string }) => s.team === "Accounts Payable Asia");
  assert.equal(production.respondents, 9);
  assert.equal(production.drivers.ROLE_CLARITY, 4);

  const rows = async () => {
    const { data: responses } = await db.from("responses").select("id").eq("person_id", id);
    const ids = responses!.map((r) => r.id);
    const count = async (table: string, column: string, values: string[]) =>
      (await db.from(table).select("*").in(column, values)).data!.length;
    return {
      responses: ids.length,
      ai_tags: await count("ai_tags", "response_id", ids),
      escalations: await count("escalations", "response_id", ids),
      checkin_schedule: await count("checkin_schedule", "person_id", [id]),
      asked_questions: await count("asked_questions", "person_id", [id]),
      consents: await count("consents", "person_id", [id]),
      follow_up_offers: await count("follow_up_offers", "person_id", [id]),
    };
  };
  const held = await rows();
  assert.ok(held.responses >= 2 && held.ai_tags >= 1 && held.escalations === 1 && held.asked_questions >= 1);

  const prompt = await newMessages(live, () => say(live, "DELETE"));
  assert.deepEqual(prompt.map((m) => [m.text, buttons(m)]), [[en.delete.confirm, [en.delete.yes, en.delete.no]]]);
  await tap(live, en.delete.no);
  assert.equal((await texts(live)).at(-1), en.delete.kept);
  assert.deepEqual(await rows(), held);

  await say(live, "padam");
  assert.equal((await texts(live)).at(-1), en.delete.confirm);
  await tap(live, en.delete.yes);
  assert.equal((await texts(live)).at(-1), en.delete.done);

  assert.deepEqual(await rows(), {
    responses: 0,
    ai_tags: 0,
    escalations: 0,
    checkin_schedule: 0,
    asked_questions: 0,
    consents: 0,
    follow_up_offers: 0,
  });
  const { data: person } = await db.from("people").select("telegram_chat_id").eq("id", id).single();
  assert.equal(person!.telegram_chat_id, null);
  assert.deepEqual(await card("WORKLOAD"), { n: seedWorkload, m: 18 });
  assert.deepEqual(await card("ROLE_CLARITY"), { n: 7, m: 18 });
  assert.deepEqual(await snapshots(), published);

  const { data: audits } = await db.from("audit_log").select("actor, action, target, reason");
  const deletions = audits!.filter((a) => a.action === "delete_own_data");
  assert.equal(deletions.length, 1);
  assert.ok(![deletions[0].actor, deletions[0].target, deletions[0].reason].some((v) => String(v).includes(id)));
  assert.ok(!audits!.some((a) => a.target === id));

  await say(live, "/myanswers");
  assert.equal((await texts(live)).at(-1), en.start);
});

test("R41: only an HR admin can send a hire's data, only to that hire, only with a reason, and it writes an audit row", async () => {
  await resetDemo();
  await freezeClock("2026-10-16T01:00:00.000Z");
  await joined(exported, "2026-10-13");
  await freezeClock("2026-10-16T03:00:00.000Z");
  assert.equal((await dispatch()).status, 200);
  await tap(exported, "4");
  await tap(exported, "3");
  await tap(exported, "5");
  await scriptModel("omniroute", [{ kind: "json", content: classifierTag() }]);
  await say(exported, reply);
  await scriptModel("omniroute", [
    {
      kind: "json",
      content: {
        kind: "question",
        important_topic: "none",
        answer: "",
        cited_path: "",
        supporting_quote: "",
        group: { id: "new", text: "Where to park" },
      },
    },
  ]);
  await say(exported, `/ask ${question}`);
  assert.equal((await texts(exported)).at(-1), en.qa.unknown);
  const code = `Hire ${exported}`;
  const id = await personId(code);
  const exportAudits = async () =>
    (await db.from("audit_log").select("actor, target, reason").eq("action", "export_person_data")).data!;
  const count = (await messages(exported)).length;

  assert.equal((await adminExport({ code_name: code, reason: "Data access request" }, "hr@contoh.test")).status, 403);
  assert.equal((await adminExport({ code_name: code })).status, 400);
  assert.equal((await adminExport({ code_name: code, reason: "  " })).status, 400);
  assert.equal((await messages(exported)).length, count);
  assert.deepEqual(await exportAudits(), []);

  const res = await adminExport({ code_name: code, reason: "Data access request from the hire" });
  assert.equal(res.status, 200);
  const body = await res.text();
  assert.ok(!body.includes(reply) && !body.includes(summary));
  const sent = (await texts(exported)).slice(count).join("\n");
  assert.ok(sent.startsWith(en.export.intro));
  assert.ok(sent.includes(`${en.export.visibility} ${en.visibilityHrOnly}`));
  assert.ok(sent.includes(reply));
  assert.ok(sent.includes(`${en.export.question} ${question}`));
  const all = await telegramMessagesOutside(exported);
  assert.ok(!all.some((text) => text.includes(reply)));
  const audits = await exportAudits();
  assert.equal(audits.length, 1);
  assert.equal(audits[0].target, id);
  assert.equal(audits[0].reason, "Data access request from the hire");
});

async function telegramMessagesOutside(chat: number) {
  const res = await fetch(`${process.env.TELEGRAM_API_BASE_URL}/calls`);
  const calls: { method: string; body: { chat_id: unknown; text: string } }[] = await res.json();
  return calls.filter((c) => c.method === "sendMessage" && String(c.body.chat_id) !== String(chat)).map((c) => c.body.text);
}

test("R24, R35: the nightly job deletes raw reply and question text once the retention period after the last check-in has passed", async () => {
  const id = await personId(`Hire ${exported}`);
  const stored = async () => (await db.from("responses").select("text_encrypted").eq("person_id", id).not("text_encrypted", "is", null)).data!.length;
  const questions = async () =>
    (await db.from("asked_questions").select("text_encrypted").eq("person_id", id).not("text_encrypted", "is", null)).data!.length;
  const hrSees = async () =>
    (await (await hrRequest("/api/hr/replies", "GET")).json()).filter((r: { text: string }) => r.text === reply).length;
  assert.equal(await stored(), 1);
  assert.equal(await questions(), 1);
  assert.equal(await hrSees(), 1);

  const retention = organisation.retention_days * 24 * 3600 * 1000;
  const lastCheckin = Date.parse("2026-10-16T03:00:00.000Z");
  await freezeClock(new Date(lastCheckin + retention - 3600 * 1000).toISOString());
  await nightly();
  assert.equal(await stored(), 1);
  assert.equal(await questions(), 1);
  assert.equal(await hrSees(), 1);

  await freezeClock(new Date(lastCheckin + retention + 3600 * 1000).toISOString());
  await nightly();
  assert.equal(await stored(), 0);
  assert.equal(await questions(), 0);
  assert.equal(await hrSees(), 0);
  const { data: tags } = await db.from("ai_tags").select("evidence_quote, responses!inner(person_id)").eq("responses.person_id", id);
  assert.deepEqual(tags!.map((t) => t.evidence_quote), [null]);
});
