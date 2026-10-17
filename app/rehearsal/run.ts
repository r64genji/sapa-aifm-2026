import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { appUrl, db, dispatch, hrRequest, hrToken, link, postUpdate, tapData, update } from "../e2e/helpers.ts";

const chat = Number(process.env.REHEARSAL_CHAT_ID);
const seededActions = JSON.parse(readFileSync(new URL("../data/seed/actions.json", import.meta.url), "utf8")).length;
let livePerson = "";
const raj = "6f1c2a3e-0000-4000-8000-000000000101";
const reply = "Boss bagi 3 task semua urgent, tak tahu mana nak buat dulu";
const notes = { en: "Your team now has a weekly priority list every Monday.", ms: "Pasukan anda kini ada senarai keutamaan mingguan setiap Isnin." };
const button = (id: string, value: string) => `chat:${JSON.stringify({ a: id, v: value })}`;

async function until<T>(label: string, read: () => Promise<T | undefined | false>, seconds = 90): Promise<T> {
  const deadline = Date.now() + seconds * 1000;
  for (;;) {
    const value = await read();
    if (value) return value;
    if (Date.now() > deadline) throw new Error(`timed out waiting for ${label}`);
    await new Promise((resolve) => setTimeout(resolve, 1500));
  }
}

async function json(res: Response, expected: number, label: string) {
  if (res.status !== expected) throw new Error(`${label}: expected ${expected}, got ${res.status} ${await res.text()}`);
  return res.json();
}

async function resetDemo() {
  const res = await fetch(`${appUrl}/api/demo/reset`, {
    method: "POST",
    headers: { authorization: `Bearer ${process.env.DEMO_RESET_SECRET}` },
  });
  const { team_links } = await json(res, 200, "demo reset");
  return String(team_links[0].link).split("?start=")[1];
}

const roleClarity = async () => {
  const body = await json(await hrRequest("/api/hr/themes", "GET"), 200, "theme cards");
  return body.cards.find((card: { driver: string }) => card.driver === "ROLE_CLARITY");
};

const board = async () => (await json(await hrRequest("/api/hr/actions", "GET"), 200, "action board")) as Record<string, any>[];

async function run() {
  await link(chat, await resetDemo());
  await tapData(chat, button("lang", "en"));
  await tapData(chat, button("consent", "yes"));
  await tapData(chat, button("visibility", "share_with_manager"));
  await until("the live hire to be active", async () => {
    const { data } = await db.from("people").select("id, state").eq("telegram_chat_id", chat).maybeSingle();
    livePerson = data?.id ?? "";
    return data?.state === "active";
  });

  const before = await roleClarity();
  assert.deepEqual([before.n, before.m], [7, 18], "role clarity card before the live reply");
  await json(await hrRequest("/api/hr/demo/advance", "POST", { day: 14 }), 200, "advance to Day 14");
  await until("the Day 14 check-in to be sent", async () => {
    const { data } = await db.from("checkin_schedule").select("status").eq("person_id", livePerson).eq("touchpoint", 14).single();
    return data?.status === "sent";
  });
  for (const [progress, score] of [[0, 4], [1, 3], [2, 5]]) await tapData(chat, button("ans", `${progress}.${score}`));
  await postUpdate(update("text", { chat_id: chat, text: reply }));
  const waiting = await until("the reply in the HR queue", async () => {
    const queue = (await json(await hrRequest("/api/hr/queue", "GET"), 200, "HR queue")) as { id: string; text: string }[];
    return queue.find((row) => row.text === reply);
  });
  await json(await hrRequest(`/api/hr/replies/${waiting.id}/review`, "POST"), 200, "confirm label");
  const after = await roleClarity();
  assert.deepEqual([after.n, after.m], [8, 19], "role clarity card after Confirm label");

  const draft = await json(await hrRequest("/api/hr/actions", "POST", { driver: "ROLE_CLARITY" }), 201, "draft action");
  const id = draft.id as string;
  await json(await hrRequest(`/api/hr/actions/${id}`, "PATCH", { scope: { type: "team", team: "Accounts Payable Asia" } }), 200, "scope");
  await json(await hrRequest(`/api/hr/actions/${id}/notice`, "POST", { notes }), 200, "approve notice");
  await json(await hrRequest(`/api/hr/actions/${id}/assign`, "POST", { owner: { manager_id: raj } }), 200, "assign");

  const managerAuth = { authorization: `Bearer ${await hrToken("raj@contoh.test")}`, "content-type": "application/json" };
  const listed = (await json(await fetch(`${appUrl}/api/manager/actions`, { headers: managerAuth }), 200, "manager list")) as { id: string }[];
  assert.ok(listed.some((row) => row.id === id), "Raj sees the assigned action");
  await json(await fetch(`${appUrl}/api/manager/actions/${id}/accept`, { method: "POST", headers: managerAuth }), 200, "accept");
  await json(
    await fetch(`${appUrl}/api/manager/actions/${id}/done`, { method: "POST", headers: managerAuth, body: JSON.stringify({ outcome: "Weekly priority list every Monday" }) }),
    200,
    "done",
  );

  const sent = await until("the notice to be sent", async () => {
    assert.equal((await dispatch()).status, 200, "dispatch");
    const card = (await board()).find((row) => row.id === id)!;
    return card.notice.status === "sent" && card;
  });
  assert.equal(sent.status, "done");
  assert.equal(sent.notice.sent_count, 1);

  await json(await hrRequest("/api/hr/demo/advance", "POST", { day: 30 }), 200, "advance to Day 30");
  const recheck = await until("the Day 30 check-in to be sent", async () => {
    const { data } = await db
      .from("checkin_schedule")
      .select("status, recheck_action_id, recheck_driver")
      .eq("person_id", livePerson)
      .eq("touchpoint", 30)
      .single();
    return data?.status === "sent" && data;
  });
  assert.deepEqual([recheck.recheck_action_id, recheck.recheck_driver], [id, "ROLE_CLARITY"]);
  await tapData(chat, button("ans", "0.4"));
  const answer = await until("the recheck answer", async () => {
    const { data } = await db.from("responses").select("question_id, scale_value").eq("action_id", id);
    return data?.length ? data : undefined;
  });
  assert.deepEqual(answer, [{ question_id: "ROLE_CLARITY", scale_value: 4 }]);
}

async function restored() {
  const { data: person } = await db.from("people").select("id").eq("telegram_chat_id", chat);
  assert.deepEqual(person, []);
  const { data: org } = await db.from("organisations").select("demo_offset_days");
  assert.deepEqual(org, [{ demo_offset_days: 0 }]);
  assert.equal((await board()).length, seededActions);
  const { count } = await db.from("responses").select("*", { count: "exact", head: true }).eq("person_id", livePerson);
  assert.equal(count, 0);
}

let failure: unknown;
try {
  if (!chat) throw new Error("set REHEARSAL_CHAT_ID to a Telegram chat that has started the bot");
  await run();
} catch (error) {
  failure = error;
}
try {
  await resetDemo();
  await restored();
} catch (error) {
  failure ??= new Error(`seed not restored: ${error instanceof Error ? error.message : error}`);
}
if (failure) {
  console.log(`REHEARSAL FAIL: ${failure instanceof Error ? failure.message : failure}`);
  process.exit(1);
}
console.log(`REHEARSAL PASS: ${appUrl}, action done, notice sent, Day 30 recheck is the 1-5 question, seed restored`);
