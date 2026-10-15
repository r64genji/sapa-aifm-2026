import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { before, test } from "node:test";
import {
  addHire,
  classifierTag,
  db,
  dispatch,
  freezeClock,
  hrRequest,
  link,
  modelCalls,
  resetDemo,
  say,
  scriptModel,
  sentTo,
  settle,
  tap,
} from "./helpers.ts";

const read = (path: string) => JSON.parse(readFileSync(new URL(path, import.meta.url), "utf8"));
const en = read("../data/packs/en.json");
const ms = read("../data/packs/ms.json");
const question = (pack: typeof en, id: string) => pack.checkin.questions.find((q: { id: string }) => q.id === id).text;
const library = (n: number) => `6f1c2a3e-0000-4000-8000-0000000004${String(n).padStart(2, "0")}`;
const [p1, p2, p3, p4, p5, p6] = [1, 2, 3, 4, 5, 6].map((n) => 5550002000 + n);
const notices = (texts: string[]) => texts.filter((text) => text.startsWith("Update from HR") || text.startsWith("Kemas kini daripada HR"));
const heard = async (chat: number) => (await sentTo(chat)).map((m) => String(m.text));

const mainNote = { en: "Supervisors will check in with you every week.", ms: "Penyelia akan bertanya khabar setiap minggu.", zh: "主管每周会和你沟通。" };
const droppedNote = { en: "Dropped note for nobody.", ms: "Nota yang digugurkan." };
const secretOutcome = "Raj said the real reason was staffing";

async function onboard(chat: number, fields: Record<string, string>, language = "English", agree = en.agree) {
  const { token } = await addHire({ start_date: "2026-10-02", ...fields });
  await link(chat, token);
  await tap(chat, language);
  await tap(chat, agree);
}

async function baseline(chat: number, scores: number[], text: string) {
  for (const score of scores) await tap(chat, String(score));
  await scriptModel("omniroute", [{ kind: "json", content: classifierTag({ evidence_quote: text }) }]);
  await say(chat, text);
  await settle();
}

async function draft(driver: string, entry: number, title: string, notes: Record<string, string>) {
  await scriptModel("omniroute", [
    { kind: "json", content: { library_entry_id: library(entry), reason: "Fits.", title, steps: "Do the thing each week.", notes } },
  ]);
  const res = await hrRequest("/api/hr/actions", "POST", { driver });
  assert.equal(res.status, 201);
  return (await res.json()).id as string;
}

const action = (id: string, path: string, body?: Record<string, unknown>) => hrRequest(`/api/hr/actions/${id}${path}`, "POST", body);
const setTeam = (id: string, team: string) => hrRequest(`/api/hr/actions/${id}`, "PATCH", { scope: { type: "team", team } });
const card = async (id: string) =>
  ((await (await hrRequest("/api/hr/actions", "GET")).json()) as Record<string, any>[]).find((row) => row.id === id)!;

let main: string;
let noNotice: string;

before(async () => {
  await resetDemo();
  await freezeClock("2026-10-15T15:00:00.000Z");
  await onboard(p1, { code_name: "Hire 1" });
  await onboard(p2, { code_name: "Hire 2", language: "ms" }, "Bahasa Malaysia", ms.agree);
  for (const [chat, name] of [[p3, "Hire 3"], [p4, "Hire 4"], [p5, "Hire 5"]] as const) await onboard(chat, { code_name: name });
  await onboard(p6, { code_name: "Hire 6", team: "IT Service Desk" });
  assert.equal((await hrRequest("/api/hr/demo/advance", "POST", { day: 14 })).status, 200);
  await baseline(p1, [3, 2, 5, 3, 3, 3], "Boss bagi 3 task semua urgent, tak tahu mana nak buat dulu");
  await baseline(p2, [4, 3, 5, 3, 3, 3], "Tak ada orang beritahu saya siapa nak tanya");
  await baseline(p6, [2, 4, 3, 3, 3, 3], "The training felt rushed to me");
  await say(p3, "/stop");
  await say(p4, "DELETE");
  await tap(p4, en.delete.yes);
  assert.equal((await hrRequest("/api/hr/hires/left", "POST", { code_name: "Hire 5", reason: "resigned" })).status, 200);
});

test("R26: the seeded earlier action leads with the score change against other teams and carries the fixed line", async () => {
  const rows = (await (await hrRequest("/api/hr/actions", "GET")).json()) as Record<string, any>[];
  const earlier = rows.find((row) => row.id === "6f1c2a3e-0000-4000-8000-000000000501")!;
  assert.deepEqual(earlier.score, {
    headline: "Role clarity, Raj's team +1.3, other teams +0.1 in the same weeks",
    detail: earlier.score.detail,
    note: "Teams picked for a fix often improve anyway. This compares them with other teams.",
  });
  assert.match(earlier.score.detail, /^2\.5 → 3\.8, \d+ people$/);
  const fewOutside = rows.find((row) => row.id === "6f1c2a3e-0000-4000-8000-000000000504")!;
  assert.equal(fewOutside.score.headline, "Not enough comparison yet (3 of 5)");
  const fewInScope = rows.find((row) => row.id === "6f1c2a3e-0000-4000-8000-000000000503")!;
  assert.equal(fewInScope.score.headline, "Not enough answers yet (4 of 5)");
  assert.equal(fewInScope.score.detail, null);
});

test("R26: the seeded earlier action reads 2.5 → 3.8 for 6 people", { todo: "needs the 100-hire seed (#25)" }, async () => {
  const rows = (await (await hrRequest("/api/hr/actions", "GET")).json()) as Record<string, any>[];
  assert.equal(rows.find((row) => row.id === "6f1c2a3e-0000-4000-8000-000000000501")!.score.detail, "2.5 → 3.8, 6 people");
});

test("R43: the draft screen for Priorities chat and written top-3 list shows 41 people", { todo: "needs the 100-hire seed (#25)" }, async () => {
  const entries = (await (await hrRequest("/api/hr/actions/library?driver=ROLE_CLARITY", "GET")).json()) as { title: string; evidence: string }[];
  assert.equal(
    entries.find((entry) => entry.title === "Priorities chat and written top-3 list")!.evidence,
    "Used 3 times here. Role clarity rose 1.0 more than in other teams (41 people).",
  );
});

test("R43: the draft screen shows what each library entry achieved here, and the draft gets the entries ranked by it", async () => {
  const res = await hrRequest("/api/hr/actions/library?driver=ROLE_CLARITY", "GET");
  const entries = (await res.json()) as { title: string; evidence: string }[];
  assert.equal(entries[0].title, "Priorities chat and written top-3 list");
  assert.match(entries[0].evidence, /^Used 3 times here\. Role clarity rose 1\.0 more than in other teams \(\d+ people\)\.$/);
  assert.deepEqual([entries[1].title, entries[1].evidence], ["Written role checklist", "Used 1 time here. Not enough comparison yet"]);
  assert.equal(entries.length, 2);
  const unused = (await (await hrRequest("/api/hr/actions/library?driver=BELONGING", "GET")).json()) as { evidence: string }[];
  assert.deepEqual(unused.map((entry) => entry.evidence), ["Not enough evidence here yet", "Not enough evidence here yet"]);

  await scriptModel("omniroute", [
    { kind: "json", content: { library_entry_id: library(1), reason: "Worked here.", title: "Priorities", steps: "Talk weekly.", notes: mainNote } },
  ]);
  assert.equal((await hrRequest("/api/hr/actions", "POST", { driver: "ROLE_CLARITY" })).status, 201);
  const prompt = String((await modelCalls("omniroute")).at(-1)!.body.messages.at(-1)!.content);
  const input = JSON.parse(prompt.split("<<<\n")[1].split("\n>>>")[0]);
  assert.deepEqual(
    input.library.map((entry: { title: string; evidence: string }) => [entry.title, entry.evidence]),
    entries.map((entry) => [entry.title, entry.evidence]),
  );
});

test("R28: an action is not assigned without an approved note in English and Bahasa Malaysia, unless no notice has a reason", async () => {
  main = await draft("MANAGER_SUPPORT", 3, "Weekly one-to-one", mainNote);
  const row = await card(main);
  assert.deepEqual(row.draft_notes, mainNote);
  assert.equal((await setTeam(main, "Accounts Payable Asia")).status, 200);

  assert.equal((await action(main, "/assign", { owner: "hr" })).status, 422);
  assert.equal((await action(main, "/notice", { notes: { en: mainNote.en, ms: " " } })).status, 422);
  assert.equal((await action(main, "/notice", { no_notice_reason: "  " })).status, 422);
  assert.equal((await action(main, "/assign", { owner: "hr" })).status, 422);

  noNotice = await draft("WORKLOAD", 9, "Workload check", droppedNote);
  assert.equal((await setTeam(noNotice, "IT Service Desk")).status, 200);
  assert.equal((await action(noNotice, "/notice", { no_notice_reason: "The team already knows" })).status, 200);
  assert.equal((await action(noNotice, "/assign", { owner: "hr" })).status, 200);

  assert.equal((await action(main, "/notice", { notes: mainNote })).status, 200);
  assert.equal((await action(main, "/assign", { owner: "hr" })).status, 200);
});

test("R28: a dismissed action sends nothing", async () => {
  const dismissed = await draft("BELONGING", 5, "Team lunch", droppedNote);
  await setTeam(dismissed, "Accounts Payable Asia");
  assert.equal((await action(dismissed, "/notice", { notes: droppedNote })).status, 200);
  assert.equal((await action(dismissed, "/assign", { owner: "hr" })).status, 200);
  assert.equal((await action(dismissed, "/dismiss", { reason: "Handled at orientation" })).status, 200);
  await dispatch();
  for (const chat of [p1, p2, p3, p4, p5, p6]) {
    assert.deepEqual((await heard(chat)).filter((text) => text.includes("Dropped note") || text.includes("digugurkan")), []);
  }
  assert.equal((await card(dismissed)).notice.status, "cancelled");
});

test("R28: when done, the note goes once to each consenting person in scope, in their language, in the next working-hours slot; never the outcome note", async () => {
  await db.from("organisations").update({ demo_mode: false }).neq("id", "00000000-0000-0000-0000-000000000000");
  await freezeClock("2026-10-17T03:00:00.000Z");
  for (const id of [main, noNotice]) {
    assert.equal((await action(id, "/accept")).status, 200);
    assert.equal((await action(id, "/done", { outcome: secretOutcome })).status, 200);
  }
  const quiet = await Promise.all([p1, p2, p6].map(async (chat) => (await heard(chat)).length));
  await dispatch();
  assert.deepEqual(await Promise.all([p1, p2, p6].map(async (chat) => (await heard(chat)).length)), quiet);
  assert.equal((await card(main)).notice.status, "pending");

  await freezeClock("2026-10-19T02:00:00.000Z");
  await dispatch();
  await dispatch();
  assert.deepEqual(notices(await heard(p1)), [`Update from HR: ${mainNote.en}`]);
  assert.deepEqual(notices(await heard(p2)), [`Kemas kini daripada HR: ${mainNote.ms}`]);
  for (const chat of [p3, p4, p5, p6]) assert.deepEqual(notices(await heard(chat)), []);
  for (const chat of [p1, p2, p3, p4, p5, p6]) {
    assert.deepEqual((await heard(chat)).filter((text) => text.includes(secretOutcome)), []);
  }
  const sent = await card(main);
  assert.equal(sent.notice.status, "sent");
  assert.equal(sent.notice.label, "Notice sent to 2 new hires, 19 Oct 2026, 10:00");
  assert.equal((await card(noNotice)).notice.status, "none");
});

test("R26: the next check-in of each person in scope starts with the neutral 1-5 question, the answer is linked to the action and the card waits for 5 answers", async () => {
  await freezeClock("2026-11-02T02:00:00.000Z");
  const before = await Promise.all([p1, p2, p6].map(async (chat) => (await heard(chat)).length));
  const stoppedBefore = (await heard(p3)).length;
  await dispatch();
  assert.equal((await heard(p3)).length, stoppedBefore);
  const [first1, first2, first6] = await Promise.all(
    [p1, p2, p6].map(async (chat, i) => (await heard(chat)).slice(before[i])),
  );
  assert.deepEqual(first1, [en.checkin.intro, question(en, "MANAGER_SUPPORT")]);
  assert.deepEqual(first2, [ms.checkin.intro, question(ms, "MANAGER_SUPPORT")]);
  assert.deepEqual(first6, [en.checkin.intro, question(en, "WORKLOAD")]);

  await tap(p1, "4");
  await tap(p1, "3");
  const { data } = await db.from("responses").select("person_id, question_id, scale_value").eq("action_id", main);
  assert.equal(data!.length, 1);
  assert.equal(data![0].question_id, "MANAGER_SUPPORT");
  assert.equal(data![0].scale_value, 4);

  const row = await card(main);
  assert.equal(row.score.headline, "Not enough answers yet (1 of 5)");
  assert.equal(row.score.detail, null);
  const entries = (await (await hrRequest("/api/hr/actions/library?driver=MANAGER_SUPPORT", "GET")).json()) as { id: string; evidence: string }[];
  assert.equal(entries.find((entry) => entry.id === library(3))!.evidence, "Used 1 time here. Not enough evidence here yet");
});
