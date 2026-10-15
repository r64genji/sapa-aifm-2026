import assert from "node:assert/strict";
import { before, test } from "node:test";
import { appUrl, db, freezeClock, hrRequest, hrToken, resetDemo } from "./helpers.ts";

const organisation = "6f1c2a3e-0000-4000-8000-000000000001";
const raj = "6f1c2a3e-0000-4000-8000-000000000101";
let counter = 0;

async function hires(count: number, fields: { agency: string | null; role: string; start: string; answers?: number[] }) {
  const ids: string[] = [];
  for (let i = 0; i < count; i++) {
    counter += 1;
    const { data: person, error } = await db
      .from("people")
      .insert({
        organisation_id: organisation,
        code_name: `Test hire ${counter}`,
        team: "Accounts Payable Asia",
        manager_id: raj,
        start_date: fields.start,
        role: fields.role,
        language: "en",
        invite_token: `test-hire-${counter}`,
        invite_expires_at: "2026-12-01T00:00:00Z",
        state: "active",
        agency: fields.agency,
      })
      .select("id")
      .single();
    if (error) throw error;
    const { data: schedule, error: scheduleError } = await db
      .from("checkin_schedule")
      .insert({ organisation_id: organisation, person_id: person.id, touchpoint: 14, due_at: "2026-09-20T02:00:00Z", status: "answered" })
      .select("id")
      .single();
    if (scheduleError) throw scheduleError;
    const { data: response, error: responseError } = await db
      .from("responses")
      .insert({
        organisation_id: organisation,
        person_id: person.id,
        schedule_id: schedule.id,
        question_id: "OPEN",
        language: "en",
        created_at: "2026-09-20T03:00:00Z",
      })
      .select("id")
      .single();
    if (responseError) throw responseError;
    const { error: tagError } = await db.from("ai_tags").insert({
      organisation_id: organisation,
      response_id: response.id,
      status: "ok",
      drivers: ["ROLE_CLARITY"],
      context_tags: [],
      escalate: false,
      counted: true,
      created_at: "2026-09-20T03:00:00Z",
    });
    if (tagError) throw tagError;
    if (fields.answers) {
      const { error: answerError } = await db.from("responses").insert({
        organisation_id: organisation,
        person_id: person.id,
        schedule_id: schedule.id,
        question_id: "JOB_MATCH",
        scale_value: fields.answers[i],
        language: "en",
        created_at: "2026-09-20T03:01:00Z",
      });
      if (answerError) throw answerError;
    }
    ids.push(person.id);
  }
  return ids;
}

async function agencyToken(email: string) {
  const { data } = await db.auth.admin.listUsers({ perPage: 1000 });
  const user = data.users.find((u) => u.email === email)!;
  await db.auth.admin.updateUserById(user.id, { password: process.env.SEED_USER_PASSWORD! });
  return hrToken(email);
}

const asAgency = async (token: string, path: string) =>
  fetch(`${appUrl}${path}`, { headers: { authorization: `Bearer ${token}` } });

const overview = async (token: string) => (await asAgency(token, "/api/agency/overview")).json();

const themes = (n: number, m: number) => [
  { driver: "ROLE_CLARITY", enough: true, n, m },
  { driver: "MANAGER_SUPPORT", enough: true, n: 0, m },
  { driver: "BELONGING", enough: true, n: 0, m },
  { driver: "ONBOARDING_TRAINING", enough: true, n: 0, m },
  { driver: "WORKLOAD", enough: true, n: 0, m },
];

let maju: string;

before(async () => {
  await resetDemo();
  await freezeClock("2026-10-15T03:00:00.000Z");
  await db.from("people").update({ agency: null }).eq("organisation_id", organisation);
  await hires(5, { agency: "Maju Staffing", role: "Welder", start: "2026-09-01", answers: [1, 2, 2, 4, 5] });
  await hires(4, { agency: "Bintang Resource", role: "Cutter", start: "2026-09-01", answers: [1, 1, 1, 1] });
  await hires(7, { agency: null, role: "Welder", start: "2026-09-01", answers: [1, 1, 1, 1, 1, 1, 1] });
  maju = await agencyToken("agency@maju.test");
});

test("R48: an agency user sees its own placements, pooled, with the job-match card and retention below 30", async () => {
  assert.deepEqual(await overview(maju), {
    agency: "Maju Staffing",
    touchpoint: 14,
    themes: themes(5, 5),
    job_match: [{ role: "Welder", enough: true, n: 3, m: 5, label: "Welder: 3 of 5 said 'not really' at Day 14" }],
    retention: { enough: false, message: "Too few to tell yet (6 of 30)", note: "This shows a trend, not proof that Sapa caused it" },
  });
});

test("R48: a pool of 4 shows 'Not enough people yet' and an HR admin grants another agency access", async () => {
  const denied = await hrRequest("/api/hr/agency-grants", "POST", { email: "agency@bintang.test", agency: "Bintang Resource" });
  assert.equal(denied.status, 403);
  const granted = await fetch(`${appUrl}/api/hr/agency-grants`, {
    method: "POST",
    headers: { authorization: `Bearer ${await hrToken("admin@contoh.test")}`, "content-type": "application/json" },
    body: JSON.stringify({ email: "agency@bintang.test", agency: "Bintang Resource" }),
  });
  assert.equal(granted.status, 201);
  const bintang = await agencyToken("agency@bintang.test");
  const view = await overview(bintang);
  const message = "Not enough people yet (4 of 5 needed)";
  assert.deepEqual(view.themes, [
    { driver: "ROLE_CLARITY", enough: false, message },
    { driver: "MANAGER_SUPPORT", enough: false, message },
    { driver: "BELONGING", enough: false, message },
    { driver: "ONBOARDING_TRAINING", enough: false, message },
    { driver: "WORKLOAD", enough: false, message },
  ]);
  assert.deepEqual(view.job_match, [{ role: "Cutter", enough: false, message }]);
  assert.equal(view.agency, "Bintang Resource");
  const { data: rows } = await db.from("audit_log").select("target").eq("action", "grant_agency");
  assert.deepEqual(rows, [{ target: "Bintang Resource" }]);
});

test("R48: retention pools every intake of the agency from 30 people and never another agency's", async () => {
  await db.from("intake_outcomes").insert({
    organisation_id: organisation,
    intake: "2026-03",
    agency: "Maju Staffing",
    hired: 30,
    employed: 24,
    entered_by: "test",
    entered_at: "2026-10-01T01:00:00Z",
  });
  assert.deepEqual((await overview(maju)).retention, {
    enough: true,
    k: 29,
    n: 36,
    text: "29 of 36 still employed at Month 6",
    note: "This shows a trend, not proof that Sapa caused it",
  });
  const bintang = await agencyToken("agency@bintang.test");
  assert.deepEqual((await overview(bintang)).retention, {
    enough: false,
    message: "Too few to tell yet (0 of 30)",
    note: "This shows a trend, not proof that Sapa caused it",
  });
});

test("R48: the agency user is refused on a reply, a question and an escalation, and others are refused the agency view", async () => {
  for (const path of ["/api/hr/replies", "/api/hr/questions", "/api/hr/escalations", "/api/hr/queue", "/api/hr/actions", "/api/hr/hires"]) {
    assert.equal((await asAgency(maju, path)).status, 401, path);
  }
  assert.equal((await asAgency(await hrToken(), "/api/agency/overview")).status, 401);
  assert.equal((await asAgency(await hrToken("raj@contoh.test"), "/api/agency/overview")).status, 401);
  assert.equal((await fetch(`${appUrl}/api/agency/overview`)).status, 401);
});

async function intakeHires() {
  return hires(6, { agency: null, role: "Press operator", start: "2026-04-20" });
}

async function concern(personId: string, createdAt: string, acknowledgedAt: string | null) {
  const { data: response, error } = await db
    .from("responses")
    .insert({ organisation_id: organisation, person_id: personId, question_id: "UNPROMPTED", language: "en", kind: "unprompted", created_at: createdAt })
    .select("id")
    .single();
  if (error) throw error;
  const { error: escalationError } = await db.from("escalations").insert({
    organisation_id: organisation,
    response_id: response.id,
    source: "keyword",
    category: "wage_or_legal",
    created_at: createdAt,
    acknowledged_at: acknowledgedAt,
  });
  if (escalationError) throw escalationError;
}

const exportIntake = (intake: string) => hrRequest("/api/hr/exports/worker-voice", "POST", { intake });

test("R47: the export holds counts with their base, topics asked by 5 or more, and concerns as 'fewer than 5' below 5", async () => {
  const people = await intakeHires();
  const { data: popular } = await db
    .from("question_groups")
    .insert({ organisation_id: organisation, text: "Where is the canteen?", created_at: "2026-10-01T01:00:00Z" })
    .select("id")
    .single();
  const { data: rare } = await db
    .from("question_groups")
    .insert({ organisation_id: organisation, text: "Can I bring my bicycle?", created_at: "2026-10-01T01:00:00Z" })
    .select("id")
    .single();
  const asks = (group: string, who: string[]) =>
    who.map((person_id) => ({
      organisation_id: organisation,
      person_id,
      group_id: group,
      language: "en",
      outcome: "answered",
      created_at: "2026-10-02T01:00:00Z",
    }));
  await db.from("asked_questions").insert([...asks(popular!.id, people.slice(0, 5)), ...asks(rare!.id, people.slice(0, 4))]);
  await concern(people[0], "2026-10-09T08:00:00Z", "2026-10-12T02:00:00Z");
  await concern(people[1], "2026-10-12T02:00:00Z", "2026-10-12T08:00:00Z");
  await concern(people[2], "2026-10-12T02:00:00Z", null);

  const { count: exportsBefore } = await db.from("audit_log").select("*", { count: "exact", head: true }).eq("action", "export_worker_voice");
  const res = await exportIntake("2026-04");
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), {
    intake: "2026-04",
    themes: themes(6, 6),
    question_topics: [{ topic: "Where is the canteen?", n: 5 }],
    serious_concerns: { received: "fewer than 5", acknowledged_within_1_working_day: "fewer than 5" },
  });
  const { data: audit } = await db.from("audit_log").select("target").eq("action", "export_worker_voice");
  assert.equal(audit!.length, (exportsBefore ?? 0) + 1);
  assert.deepEqual(audit!.at(-1), { target: "2026-04" });
});

test("R47: concerns show their number from 5, counting only those acknowledged within 1 working day", async () => {
  const { data } = await db.from("people").select("id").eq("role", "Press operator");
  const ids = data!.map((row) => row.id as string);
  await concern(ids[3], "2026-10-12T02:00:00Z", "2026-10-13T01:00:00Z");
  await concern(ids[4], "2026-10-12T02:00:00Z", "2026-10-13T02:00:00Z");
  await concern(ids[5], "2026-10-12T02:00:00Z", "2026-10-14T03:00:00Z");
  const body = await (await exportIntake("2026-04")).json();
  assert.deepEqual(body.serious_concerns, { received: 6, acknowledged_within_1_working_day: "fewer than 5" });
  await db.from("escalations").update({ acknowledged_at: "2026-10-13T01:00:00Z" }).is("acknowledged_at", null);
  await db.from("escalations").update({ acknowledged_at: "2026-10-13T01:00:00Z" }).eq("acknowledged_at", "2026-10-14T03:00:00Z");
  const after = await (await exportIntake("2026-04")).json();
  assert.deepEqual(after.serious_concerns, { received: 6, acknowledged_within_1_working_day: 6 });
  assert.equal(JSON.stringify(after).includes("Test hire"), false);
  assert.equal((await exportIntake("April")).status, 400);
});

test("R51: no HR endpoint returns teams or managers side by side", async () => {
  const paths = [
    "/api/hr/themes",
    "/api/hr/themes/narrative",
    "/api/hr/impact",
    "/api/hr/milestones",
    "/api/hr/quality",
    "/api/hr/job-match",
    "/api/hr/queue",
  ];
  for (const path of paths) {
    const text = JSON.stringify(await (await hrRequest(path, "GET")).json());
    assert.equal(/"(team|teams|manager|managers|manager_id|manager_name)"/.test(text), false, path);
  }
});

test("R47: the export of an intake older than six months still holds its theme counts", async () => {
  await hires(6, { agency: null, role: "Press operator", start: "2026-01-12" });
  const body = await (await exportIntake("2026-01")).json();
  assert.deepEqual(body.themes, themes(6, 6));
});

test("R48: the agency view pools placements older than six months with the recent ones", async () => {
  await hires(5, { agency: "Maju Staffing", role: "Welder", start: "2026-01-12", answers: [1, 1, 1, 1, 5] });
  const view = await overview(maju);
  assert.deepEqual(view.themes, themes(10, 10));
  assert.deepEqual(view.job_match, [{ role: "Welder", enough: true, n: 7, m: 10, label: "Welder: 7 of 10 said 'not really' at Day 14" }]);
});

test("R51: HR can open the themes of one chosen team, and the Korean desk reads Not enough people yet (4 of 5 needed)", async () => {
  const res = await hrRequest("/api/hr/themes?team=Korean%20Desk", "GET");
  assert.equal(res.status, 200);
  const message = "Not enough people yet (4 of 5 needed)";
  assert.deepEqual((await res.json()).cards, [
    { driver: "ROLE_CLARITY", enough: false, message },
    { driver: "MANAGER_SUPPORT", enough: false, message },
    { driver: "BELONGING", enough: false, message },
    { driver: "ONBOARDING_TRAINING", enough: false, message },
    { driver: "WORKLOAD", enough: false, message },
  ]);
});
