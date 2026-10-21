import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { before, test } from "node:test";
import {
  classifierTag,
  db,
  freezeClock,
  hrRequest,
  link,
  liveInvite,
  resetDemo,
  say,
  scriptModel,
  tap,
  tapScore,
} from "./helpers.ts";

const en = JSON.parse(readFileSync(new URL("../data/packs/en.json", import.meta.url), "utf8"));
const live = 5550000201;
const quote = "tak tahu mana nak buat dulu";
const written = `Boss bagi 3 task semua urgent, ${quote}. Call me 012-345 6789 or aisyah.tan@example.com`;
const interviewerDone = {
  action: "done",
  question: "",
  goals_met: ["what_happened"],
  work_detail: true,
  serious_concern: false,
  concern_category: "none",
  ask_hr: false,
  stop_reason: "nothing_to_dig",
};
const paths = [
  "/api/hr/replies",
  "/api/hr/queue",
  "/api/hr/escalations?preview=1",
  "/api/hr/actions",
  "/api/hr/hires",
  "/api/hr/questions",
  "/api/hr/offers",
  "/api/hr/milestones",
  "/api/hr/managers",
  "/api/hr/themes?touchpoint=14",
  "/api/hr/impact",
  "/api/hr/intake-outcomes",
  "/api/hr/team-links",
  "/api/hr/teams",
];

before(async () => {
  await resetDemo();
  await freezeClock("2026-10-15T15:00:00.000Z");
  await link(live, liveInvite);
  await tap(live, "English");
  await tap(live, en.agree);
  await hrRequest("/api/hr/demo/outreach", "POST", { touchpoint: 14 });
  for (const score of [4, 3, 5, 3, 3, 3, 3]) await tapScore(live, score);
  await scriptModel("omniroute:chat", [{ kind: "json", content: interviewerDone }]);
  await scriptModel("omniroute", [{ kind: "json", content: classifierTag({ evidence_quote: quote }) }]);
  await say(live, written);
});

async function hrBodies() {
  const bodies: Record<string, string> = {};
  for (const path of paths) {
    const res = await hrRequest(path, "GET");
    if (res.status === 200) bodies[path] = await res.text();
  }
  const escalations = JSON.parse(bodies["/api/hr/escalations?preview=1"] ?? "[]") as { id: string }[];
  for (const { id } of escalations) bodies[`/api/hr/escalations/${id}`] = await (await hrRequest(`/api/hr/escalations/${id}`, "GET")).text();
  const actions = JSON.parse(bodies["/api/hr/actions"] ?? "[]") as { id: string }[];
  for (const { id } of actions) bodies[`/api/hr/actions/${id}`] = await (await hrRequest(`/api/hr/actions/${id}`, "GET")).text();
  return bodies;
}

test("R14, R41: no HR response holds a code name or a person ID", async () => {
  const { data: people } = await db.from("people").select("id, code_name");
  const bodies = await hrBodies();
  assert.ok(Object.keys(bodies).length >= 8);
  for (const [path, body] of Object.entries(bodies)) {
    for (const person of people!) {
      assert.ok(!body.includes(person.code_name), `${path} holds a code name`);
      assert.ok(!body.includes(person.id), `${path} holds a person ID`);
    }
    assert.ok(!/"(person_id|code_name|start_date|scope_person)"/.test(body), `${path} holds a person field`);
  }
});

test("R14, R41: HR sees a reply with its team and day, and a phone number and an email are masked around the highlighted quote", async () => {
  const replies = (await (await hrRequest("/api/hr/replies", "GET")).json()) as { text: string; evidence_quote: string; byline: string }[];
  const mine = replies.find((r) => r.text.includes(quote))!;
  assert.equal(mine.text, `Boss bagi 3 task semua urgent, ${quote}. Call me [PHONE] or [EMAIL]`);
  assert.equal(mine.evidence_quote, quote);
  assert.equal(mine.byline, "A new hire · Accounts Payable Asia · Day 14");
  const queue = (await (await hrRequest("/api/hr/queue", "GET")).json()) as { text: string | null }[];
  for (const row of queue) assert.ok(!/012-345 6789|aisyah\.tan@example\.com/.test(row.text ?? ""));
});

test("R41: a fix scoped to one person is refused with 422", async () => {
  const made = await hrRequest("/api/hr/actions", "POST", { driver: "ROLE_CLARITY" });
  assert.equal(made.status, 201);
  const { id } = (await made.json()) as { id: string };
  const { data: person } = await db.from("people").select("code_name").eq("telegram_chat_id", live).single();
  const named = await hrRequest(`/api/hr/actions/${id}`, "PATCH", { scope: { type: "person", code_name: person!.code_name } });
  assert.equal(named.status, 422);
  const team = await hrRequest(`/api/hr/actions/${id}`, "PATCH", { scope: { type: "team", team: "Accounts Payable Asia" } });
  assert.equal(team.status, 200);
  const view = (await (await hrRequest(`/api/hr/actions/${id}/draft`, "GET")).json()) as { scopes: { type: string }[] };
  assert.ok(view.scopes.every((s) => s.type === "team" || s.type === "intake"));
});
