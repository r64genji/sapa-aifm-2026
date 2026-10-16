import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { before, test } from "node:test";
import {
  addHire,
  appUrl,
  classifierTag,
  db,
  freezeClock,
  hrRequest,
  hrToken,
  link,
  resetDemo,
  say,
  scriptModel,
  tap,
  tapData,
} from "./helpers.ts";

type Person = { id: string; code_name: string; team: string; start_date: string; role: string; agency?: string };
type Response = { id: string; person_id: string; question_id: string; scale_value?: number };
type Tag = { response_id: string; status: string; counted: boolean; drivers: string[] };

const read = (path: string) => JSON.parse(readFileSync(new URL(path, import.meta.url), "utf8"));
const people: Person[] = read("../data/seed/people.json");
const responses: Response[] = read("../data/seed/responses.json");
const tags: Tag[] = read("../data/seed/ai_tags.json");
const outcomes: { intake: string; agency: string | null; hired: number; employed: number }[] = read("../data/seed/intake_outcomes.json");
const groups: { id: string; text: string }[] = read("../data/seed/question_groups.json");
const ms = read("../data/packs/ms.json");
const overtime = groups.find((g) => g.text === "How do I claim overtime?")!;
const payday = groups.find((g) => g.text === "When is my first payday?")!;
const DRIVERS = ["ROLE_CLARITY", "MANAGER_SUPPORT", "BELONGING", "ONBOARDING_TRAINING", "WORKLOAD"];
const trend = "This shows a trend, not proof that Sapa caused it";

function seededThemes(match: (person: Person) => boolean) {
  const ids = new Set(people.filter(match).map((p) => p.id));
  const byResponse = new Map(tags.map((t) => [t.response_id, t]));
  const counted = responses
    .filter((r) => r.question_id === "OPEN" && ids.has(r.person_id))
    .map((r) => ({ person: r.person_id, tag: byResponse.get(r.id)! }))
    .filter(({ tag }) => tag.status === "reviewed" || (tag.status === "ok" && tag.counted));
  const m = new Set(counted.map((c) => c.person)).size;
  const n = (driver: string) => new Set(counted.filter((c) => c.tag.drivers.includes(driver)).map((c) => c.person)).size;
  return { m, n };
}

function themesOf(counts: { m: number; n: (driver: string) => number }, extraRoleClarity = 0, extraRespondents = 0) {
  const m = counts.m + extraRespondents;
  const message = `Not enough people yet (${m} of 5 needed)`;
  return DRIVERS.map((driver) =>
    m >= 5
      ? { driver, enough: true, n: counts.n(driver) + (driver === "ROLE_CLARITY" ? extraRoleClarity : 0), m }
      : { driver, enough: false, message },
  );
}

function seededJobMatch(match: (person: Person) => boolean) {
  const byPerson = new Map(people.filter(match).map((p) => [p.id, p]));
  const cards = new Map<string, { m: number; n: number }>();
  for (const r of responses.filter((r) => r.question_id === "JOB_MATCH" && byPerson.has(r.person_id))) {
    const role = byPerson.get(r.person_id)!.role;
    const card = cards.get(role) ?? { m: 0, n: 0 };
    card.m += 1;
    if (r.scale_value! <= 2) card.n += 1;
    cards.set(role, card);
  }
  return [...cards.entries()]
    .map(([role, { m, n }]) =>
      m >= 5
        ? { role, enough: true, n, m, label: `${role}: ${n} of ${m} said 'not really' at Day 14` }
        : { role, enough: false, message: `Not enough people yet (${m} of 5 needed)` },
    )
    .sort((a, b) => a.role.localeCompare(b.role));
}

const asAgency = async (token: string, path: string) =>
  fetch(`${appUrl}${path}`, { headers: { authorization: `Bearer ${token}` } });

const overview = async (token: string) => {
  const body = await (await asAgency(token, "/api/agency/overview")).json();
  return { ...body, job_match: [...body.job_match].sort((a: { role: string }, b: { role: string }) => a.role.localeCompare(b.role)) };
};

const maju = (person: Person) => person.agency === "Maju Staffing";
const bintang = (person: Person) => person.agency === "Bintang Resource";

before(async () => {
  await resetDemo();
  await freezeClock("2026-10-15T03:00:00.000Z");
});

test("R48: an agency user sees its own placements, pooled, with the job-match card and retention below 30", async () => {
  const token = await hrToken("agency@maju.test");
  const hired = outcomes.filter((o) => o.agency === "Maju Staffing").reduce((total, o) => total + o.hired, 0);
  assert.deepEqual(await overview(token), {
    agency: "Maju Staffing",
    touchpoint: 14,
    themes: themesOf(seededThemes(maju)),
    job_match: seededJobMatch(maju),
    retention: { enough: false, message: `Too few to tell yet (${hired} of 30)`, note: trend },
  });
  const view = await overview(token);
  assert.equal(view.themes[0].enough, true);
  assert.equal(view.job_match[0].enough, true);
});

test("R48: a pool of 4 shows 'Not enough people yet' and an HR admin grants another agency access", async () => {
  const denied = await hrRequest("/api/hr/agency-grants", "POST", { email: "second@maju.test", agency: "Maju Staffing" });
  assert.equal(denied.status, 403);
  const granted = await fetch(`${appUrl}/api/hr/agency-grants`, {
    method: "POST",
    headers: { authorization: `Bearer ${await hrToken("admin@contoh.test")}`, "content-type": "application/json" },
    body: JSON.stringify({ email: "second@maju.test", agency: "Maju Staffing" }),
  });
  assert.equal(granted.status, 201);
  assert.equal((await granted.json()).agency, "Maju Staffing");
  const { data: rows } = await db.from("audit_log").select("target").eq("action", "grant_agency");
  assert.deepEqual(rows, [{ target: "Maju Staffing" }]);

  const view = await overview(await hrToken("agency@bintang.test"));
  assert.equal(view.agency, "Bintang Resource");
  assert.equal(people.filter(bintang).length, 4);
  assert.deepEqual(view.themes, themesOf(seededThemes(bintang)));
  assert.ok(view.themes.every((card: { enough: boolean; message: string }) => !card.enough && card.message === "Not enough people yet (4 of 5 needed)"));
  assert.deepEqual(view.job_match, seededJobMatch(bintang));
  assert.ok(view.job_match.every((card: { enough: boolean }) => !card.enough));
});

test("R48: retention pools every intake of the agency from 30 people and never another agency's", async () => {
  const put = await hrRequest("/api/hr/intake-outcomes", "PUT", { intake: "2026-03", agency: "Maju Staffing", hired: 30, employed: 24 });
  assert.equal(put.status, 200);
  const seeded = outcomes.filter((o) => o.agency === "Maju Staffing");
  const k = seeded.reduce((total, o) => total + o.employed, 0) + 24;
  const n = seeded.reduce((total, o) => total + o.hired, 0) + 30;
  assert.deepEqual((await overview(await hrToken("agency@maju.test"))).retention, {
    enough: true,
    k,
    n,
    text: `${k} of ${n} still employed at Month 6`,
    note: trend,
  });
  assert.deepEqual((await overview(await hrToken("agency@bintang.test"))).retention, {
    enough: false,
    message: "Too few to tell yet (0 of 30)",
    note: trend,
  });
});

test("R48: the agency user is refused on a reply, a question and an escalation, and others are refused the agency view", async () => {
  const token = await hrToken("agency@maju.test");
  for (const path of ["/api/hr/replies", "/api/hr/questions", "/api/hr/escalations", "/api/hr/queue", "/api/hr/actions", "/api/hr/hires"]) {
    assert.equal((await asAgency(token, path)).status, 401, path);
  }
  assert.equal((await asAgency(await hrToken(), "/api/agency/overview")).status, 401);
  assert.equal((await asAgency(await hrToken("raj@contoh.test"), "/api/agency/overview")).status, 401);
  assert.equal((await fetch(`${appUrl}/api/agency/overview`)).status, 401);
});

const exportChats = Array.from({ length: 9 }, (_, i) => 5550004700 + i);
const [askers, answerers] = [exportChats.slice(0, 6), exportChats.slice(6)];

const exportIntake = (intake: string) => hrRequest("/api/hr/exports/worker-voice", "POST", { intake });
const escalationIds = async () =>
  ((await (await hrRequest("/api/hr/escalations", "GET")).json()) as { id: string }[]).map((row) => row.id);
const acknowledge = async (id: string) => assert.equal((await hrRequest(`/api/hr/escalations/${id}/acknowledge`, "POST")).status, 200);

async function ask(chat: number, group: string) {
  await scriptModel("omniroute", [
    {
      kind: "json",
      content: {
        kind: "question",
        important_topic: "none",
        answer: "",
        cited_path: "",
        supporting_quote: "",
        group: { id: group, text: "" },
      },
    },
  ]);
  await say(chat, "Neutral question for the handbook");
}

async function raiseConcern(chat: number) {
  const before = new Set(await escalationIds());
  await say(chat, "The agent holds my passport");
  await tapData(chat, 'chat:{"a":"contact","v":"no"}');
  const after = await escalationIds();
  const created = after.filter((id) => !before.has(id));
  assert.equal(created.length, 1);
  return created[0];
}

test("R47: the export holds counts with their base, topics asked by 5 or more, and concerns as 'fewer than 5' below 5", async () => {
  for (const chat of exportChats) {
    const { token } = await addHire({ code_name: `Export hire ${chat}`, language: "ms", start_date: "2026-10-02" });
    await link(chat, token);
    await tap(chat, "Bahasa Malaysia");
    await tap(chat, ms.agree);
  }
  for (const chat of askers.slice(0, 5)) await ask(chat, overtime.id);
  for (const chat of askers.slice(0, 4)) await ask(chat, payday.id);
  const first = [];
  for (const chat of askers.slice(0, 3)) first.push(await raiseConcern(chat));
  await acknowledge(first[0]);
  await acknowledge(first[1]);

  assert.equal((await hrRequest("/api/hr/demo/advance", "POST", { day: 14 })).status, 200);
  for (const chat of answerers) {
    for (const score of ["4", "3", "5", "3", "3", "3"]) await tap(chat, score);
    await scriptModel("omniroute", [{ kind: "json", content: classifierTag() }]);
    await say(chat, "Bos bagi tiga tugas semua penting, saya tak tahu mana nak buat dulu");
  }

  const { count: exportsBefore } = await db.from("audit_log").select("*", { count: "exact", head: true }).eq("action", "export_worker_voice");
  const res = await exportIntake("2026-10");
  assert.equal(res.status, 200);
  const october = seededThemes((p) => p.start_date.startsWith("2026-10"));
  assert.deepEqual(await res.json(), {
    intake: "2026-10",
    themes: themesOf(october, answerers.length, answerers.length),
    question_topics: [{ topic: overtime.text, n: 11 }],
    serious_concerns: { received: "fewer than 5", acknowledged_within_1_working_day: "fewer than 5" },
  });
  const { data: audit } = await db.from("audit_log").select("target").eq("action", "export_worker_voice");
  assert.equal(audit!.length, (exportsBefore ?? 0) + 1);
  assert.deepEqual(audit!.at(-1), { target: "2026-10" });
});

test("R47: concerns show their number from 5, counting only those acknowledged within 1 working day", async () => {
  const second = [];
  for (const chat of answerers) second.push(await raiseConcern(chat));
  const [one, two, late] = second;
  await acknowledge(one);
  await acknowledge(two);
  assert.equal((await escalationIds()).length, 12);
  const afterOneAck = await (await exportIntake("2026-10")).json();
  assert.deepEqual(afterOneAck.serious_concerns, { received: 6, acknowledged_within_1_working_day: "fewer than 5" });

  const { data: pending } = await db.from("escalations").select("id").is("acknowledged_at", null);
  const open = pending!.map((row) => row.id as string).filter((id) => id !== late);
  for (const id of open) await acknowledge(id);
  assert.deepEqual((await (await exportIntake("2026-10")).json()).serious_concerns, { received: 6, acknowledged_within_1_working_day: 5 });

  await freezeClock("2026-10-20T03:00:00.000Z");
  await acknowledge(late);
  const after = await (await exportIntake("2026-10")).json();
  assert.deepEqual(after.serious_concerns, { received: 6, acknowledged_within_1_working_day: 5 });
  assert.equal(JSON.stringify(after).includes("Export hire"), false);
  assert.equal((await exportIntake("October")).status, 400);
});

const teamNames = [...new Set(people.map((p) => p.team))];
const managerNames = ["Raj"];

function sideBySide(value: unknown, labels: string[]): string[] {
  if (Array.isArray(value)) {
    const grouped = new Set<string>();
    for (const row of value) {
      if (typeof row !== "object" || row === null) continue;
      const label = Object.values(row).find((v) => typeof v === "string" && labels.includes(v));
      if (label && Object.values(row).some((v) => typeof v === "number")) grouped.add(label as string);
    }
    return [...(grouped.size > 1 ? [`array groups ${[...grouped].join(", ")}`] : []), ...value.flatMap((row) => sideBySide(row, labels))];
  }
  if (typeof value === "object" && value !== null) {
    const entries = Object.entries(value);
    const keyed = entries.filter(([key]) => labels.includes(key));
    return [...(keyed.length > 1 ? [`object keys ${keyed.map(([key]) => key).join(", ")}`] : []), ...entries.flatMap(([, v]) => sideBySide(v, labels))];
  }
  return [];
}

test("R51: no HR or export endpoint returns teams or managers side by side", async () => {
  const admin = await hrToken("admin@contoh.test");
  const post = (path: string, body: Record<string, unknown>) =>
    fetch(`${appUrl}${path}`, { method: "POST", headers: { authorization: `Bearer ${admin}`, "content-type": "application/json" }, body: JSON.stringify(body) });
  const bodies: [string, unknown][] = [];
  for (const path of [
    "/api/hr/themes",
    "/api/hr/themes/narrative",
    "/api/hr/impact",
    "/api/hr/milestones",
    "/api/hr/quality",
    "/api/hr/job-match",
    "/api/hr/queue",
    "/api/hr/hires",
    "/api/hr/actions",
    "/api/hr/escalations",
    "/api/hr/replies",
    "/api/hr/questions",
  ]) {
    const res = await hrRequest(path, "GET");
    assert.equal(res.status, 200, path);
    bodies.push([path, await res.json()]);
  }
  const voice = await post("/api/hr/exports/worker-voice", { intake: "2026-05" });
  assert.equal(voice.status, 200);
  bodies.push(["worker-voice", await voice.json()]);
  const person = await post("/api/hr/exports", { code_name: `Export hire ${exportChats[0]}`, reason: "Subject access request" });
  assert.equal(person.status, 200);
  bodies.push(["person export", await person.json()]);

  for (const [path, body] of bodies) {
    assert.ok(path === "/api/hr/milestones" || JSON.stringify(body).length > 2, `${path} returned an empty body`);
    assert.deepEqual(sideBySide(body, teamNames), [], path);
    assert.deepEqual(sideBySide(body, managerNames), [], path);
  }
});

test("R51: a manager's snapshots hold one team, not teams side by side", async () => {
  const res = await fetch(`${appUrl}/api/manager/snapshots`, { headers: { authorization: `Bearer ${await hrToken("raj@contoh.test")}` } });
  assert.equal(res.status, 200);
  const rows = (await res.json()) as { team: string }[];
  assert.ok(rows.length > 0);
  assert.equal(new Set(rows.map((row) => row.team)).size, 1);
});

test("R51: HR can open the themes of one chosen team, and the Korean desk reads Not enough people yet (3 of 5 needed)", async () => {
  const res = await hrRequest("/api/hr/themes?team=Korean%20Desk", "GET");
  assert.equal(res.status, 200);
  const message = "Not enough people yet (3 of 5 needed)";
  assert.deepEqual((await res.json()).cards, [
    { driver: "ROLE_CLARITY", enough: false, message },
    { driver: "MANAGER_SUPPORT", enough: false, message },
    { driver: "BELONGING", enough: false, message },
    { driver: "ONBOARDING_TRAINING", enough: false, message },
    { driver: "WORKLOAD", enough: false, message },
  ]);
});
