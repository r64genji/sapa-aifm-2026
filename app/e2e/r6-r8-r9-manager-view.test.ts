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
  link,
  liveInvite,
  chatPerson,
  postUpdate,
  resetDemo,
  say,
  scriptModel,
  sentTo,
  sessionClient,
  settle,
  tap,
  tapScore,
  update,
} from "./helpers.ts";

const en = JSON.parse(readFileSync(new URL("../data/packs/en.json", import.meta.url), "utf8"));
const raj = "6f1c2a3e-0000-4000-8000-000000000101";
const [shared, hrOnly, escalated, waiting] = [601, 602, 603, 604].map((n) => 5550000000 + n);
const live = 5550000201;
const sharedText = "Boss bagi 3 task semua urgent, tak tahu mana nak buat dulu";
const hrOnlyText = "Nobody told me who to ask when the line stops";
const escalatedText = "The agent holds my passport";

const asManager = (path: string, token: string) =>
  fetch(`${appUrl}${path}`, { headers: { authorization: `Bearer ${token}` } });

async function reply(chat: number, text: string, tag: Record<string, unknown>) {
  await tapScore(chat, 4);
  await tapScore(chat, 3);
  await tapScore(chat, 5);
  await tapScore(chat, 3);
  await tapScore(chat, 3);
  await tapScore(chat, 3);
  await scriptModel("omniroute", [{ kind: "json", content: classifierTag({ evidence_quote: text, ...tag }) }]);
  await say(chat, text);
}

const production = {
  team: "Accounts Payable Asia",
  week: "2026-10-12",
  enough: true,
  respondents: 9,
  drivers: {
    ROLE_CLARITY: 6,
    MANAGER_SUPPORT: "fewer than 3",
    BELONGING: "fewer than 3",
    ONBOARDING_TRAINING: "fewer than 3",
    WORKLOAD: "fewer than 3",
  },
};

let rajToken: string;

before(async () => {
  await resetDemo();
  await freezeClock("2026-10-15T15:00:00.000Z");
  rajToken = await hrToken("raj@contoh.test");
  await link(live, liveInvite);
  await tap(live, "English");
  await tap(live, en.agree);
  await tap(live, en.visibilityHrManager);
  await joined(shared, "2026-10-02");
  await tap(shared, en.visibilityHrManager);
  await joined(hrOnly, "2026-10-02");
  await joined(escalated, "2026-10-02");
  await tap(escalated, en.visibilityHrManager);
  await joined(waiting, "2026-10-02");
  await tap(waiting, en.visibilityHrManager);
  assert.equal((await hrRequest("/api/hr/demo/outreach", "POST", { touchpoint: 14 })).status, 200);
});

test("R9: the supervisor sees only the last weekly snapshot, with counts under 3 shown as fewer than 3", async () => {
  const res = await asManager("/api/manager/snapshots", rajToken);
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), [production]);

  const hr = await hrToken();
  assert.equal((await asManager("/api/manager/snapshots", hr)).status, 401);
  assert.equal((await fetch(`${appUrl}/api/manager/snapshots`)).status, 401);
});

test("R6, R7: the supervisor reads reply text only from hires who chose share with manager, never an escalated one", async () => {
  await reply(live, sharedText, {});
  await reply(shared, "My supervisor never says which job matters most", { evidence_quote: "never says which job matters most" });
  await reply(hrOnly, hrOnlyText, { evidence_quote: "Nobody told me who to ask" });
  await reply(escalated, escalatedText, { evidence_quote: escalatedText });

  const res = await asManager("/api/manager/replies", rajToken);
  assert.equal(res.status, 200);
  const replies = (await res.json()) as { team: string; text: string }[];
  assert.deepEqual(
    replies.map(({ team, text }) => ({ team, text })),
    [
      { team: "Accounts Payable Asia", text: sharedText },
      { team: "Accounts Payable Asia", text: "My supervisor never says which job matters most" },
    ],
  );
  assert.ok(replies.every((r) => !("author" in r)));
  assert.equal((await asManager("/api/manager/replies", await hrToken())).status, 401);
});

test("R6: a hire who changes to HR only takes their words away from the supervisor at once", async () => {
  await tap(shared, en.visibilityHrOnly);
  const replies = (await (await asManager("/api/manager/replies", rajToken)).json()) as { text: string }[];
  assert.deepEqual(replies.map((r) => r.text), [sharedText]);
});

test("R9: the snapshot does not move when HR confirms a label, and the nightly job takes it only on the snapshot day", async () => {
  const queue = await (await hrRequest("/api/hr/queue", "GET")).json();
  const liveReply = queue.find((row: { text: string }) => row.text === sharedText);
  assert.equal((await hrRequest(`/api/hr/replies/${liveReply.id}/review`, "POST")).status, 200);

  const key = { authorization: `Bearer ${process.env.DISPATCH_SECRET}` };
  assert.equal((await fetch(`${appUrl}/api/nightly`, { method: "POST" })).status, 401);
  const thursday = await fetch(`${appUrl}/api/nightly`, { method: "POST", headers: key });
  assert.equal((await thursday.json()).snapshots, 0);
  assert.deepEqual(await (await asManager("/api/manager/snapshots", rajToken)).json(), [production]);

  await freezeClock("2026-10-19T10:00:00.000Z");
  const monday = await fetch(`${appUrl}/api/nightly`, { method: "POST", headers: key });
  assert.equal((await monday.json()).snapshots, 8);
  assert.equal((await (await fetch(`${appUrl}/api/nightly`, { method: "POST", headers: key })).json()).snapshots, 0);
  assert.deepEqual(await (await asManager("/api/manager/snapshots", rajToken)).json(), [
    {
      team: "Accounts Payable Asia",
      week: "2026-10-19",
      enough: true,
      respondents: 12,
      drivers: {
        ROLE_CLARITY: 9,
        MANAGER_SUPPORT: "fewer than 3",
        BELONGING: "fewer than 3",
        ONBOARDING_TRAINING: "fewer than 3",
        WORKLOAD: "fewer than 3",
      },
    },
  ]);
  await freezeClock("2026-10-15T15:00:00.000Z");
});

test("R6, R7, R8, R9: the supervisor's own session reads no reply, tag, escalation or live count straight from the tables, and only masked snapshots", async () => {
  const client = await sessionClient("raj@contoh.test");
  for (const table of ["responses", "ai_tags", "escalations", "theme_tags", "theme_snapshots", "consents", "people", "audit_log"]) {
    const { data, error } = await client.from(table).select("*");
    assert.equal(error, null);
    assert.deepEqual(data, [], table);
  }
  const { data, error } = await client.from("manager_snapshots").select("team, week, drivers").eq("team", "Accounts Payable Asia");
  assert.equal(error, null);
  assert.deepEqual(data, [
    {
      team: "Accounts Payable Asia",
      week: "2026-10-19",
      drivers: { ROLE_CLARITY: 9, MANAGER_SUPPORT: "fewer than 3", WORKLOAD: "fewer than 3" },
    },
  ]);
  const { data: hrSees } = await (await sessionClient("hr@contoh.test")).from("manager_snapshots").select("team");
  assert.deepEqual(hrSees, []);
});

test("Telegram link: HR invites a manager, the one-time link binds one chat, and linking hires moves them to that manager", async () => {
  const res = await hrRequest("/api/hr/managers", "POST", { display_name: "Aisha", email: "aisha@contoh.test" });
  assert.equal(res.status, 201);
  const invite = await res.json();
  const token = String(invite.telegram_link).split("?start=")[1];

  const chat = 5550000701;
  await link(chat, token);
  assert.deepEqual((await sentTo(chat)).map((m) => m.text), [en.managerLinked]);
  await say(chat, "/whatican");
  assert.equal((await sentTo(chat)).at(-1)!.text, en.whatICanSee);
  await link(5550000702, token);
  assert.deepEqual((await sentTo(5550000702)).map((m) => m.text), [en.invalidInvite]);
  const { data: manager } = await db.from("managers").select("telegram_chat_id").eq("id", invite.manager_id).single();
  assert.equal(manager!.telegram_chat_id, chat);

  const linked = await hrRequest(`/api/hr/managers/${invite.manager_id}/hires`, "POST", { code_names: [`Hire ${hrOnly}`] });
  assert.deepEqual(await linked.json(), { linked: 1 });
  const { data: hire } = await db.from("people").select("manager_id").eq("code_name", `Hire ${hrOnly}`).single();
  assert.equal(hire!.manager_id, invite.manager_id);
  assert.equal((await hrRequest("/api/hr/managers", "POST", { display_name: "Again", email: "aisha@contoh.test" })).status, 422);
});

async function lastTextTo(chat: number) {
  return String((await sentTo(chat)).at(-1)?.text);
}

test("R7, R49: the supervisor never reads a crisis reply while it is being checked, nor a sharing hire's unprompted text", async () => {
  await tapScore(waiting, 4);
  await tapScore(waiting, 3);
  await tapScore(waiting, 5);
  await scriptModel("omniroute", [{ kind: "timeout" }]);
  await scriptModel("deepseek", [{ kind: "timeout" }]);
  const crisisText = "I can't take it anymore, I want to kill myself";
  const pending = postUpdate(update("text", { chat_id: waiting, text: crisisText }));
  await settle(1000);
  const during = (await (await asManager("/api/manager/replies", rajToken)).json()) as { text: string }[];
  assert.ok(!during.some((r) => r.text === crisisText));
  await pending;
  for (let i = 0; i < 60 && !(await lastTextTo(waiting)).includes(en.safety.message); i++) await settle(500);

  await scriptModel("omniroute", [
    {
      kind: "json",
      content: { kind: "feedback", important_topic: "none", answer: "", cited_path: "", supporting_quote: "", group: { id: "new", text: "" } },
    },
    { kind: "json", content: classifierTag({ drivers: [], positive: true, concern_level: "none", evidence_quote: "the team is kind" }) },
  ]);
  await say(escalated, "The canteen queue is long but the team is kind");
  assert.equal(await lastTextTo(escalated), en.checkin.thanks);
  const after = (await (await asManager("/api/manager/replies", rajToken)).json()) as { text: string }[];
  assert.deepEqual(after.map((r) => r.text), [sharedText]);
});

test("R6, R9: HR removes a manager and the supervisor's still-valid session is refused at once, by the API and by the tables", async () => {
  const before = (await (await asManager("/api/manager/replies", rajToken)).json()) as unknown[];
  assert.equal(before.length, 1);

  assert.equal((await hrRequest(`/api/hr/managers/${raj}/revoke`, "POST")).status, 200);
  assert.equal((await asManager("/api/manager/replies", rajToken)).status, 401);
  assert.equal((await asManager("/api/manager/snapshots", rajToken)).status, 401);
  const { data } = await (await sessionClient("raj@contoh.test")).from("manager_snapshots").select("team");
  assert.deepEqual(data, []);
  assert.equal((await hrRequest(`/api/hr/managers/${raj}/revoke`, "POST")).status, 404);
});
