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
  resetDemo,
  say,
  scriptModel,
  sentTo,
  tap,
  tapScore,
  tapData,
} from "./helpers.ts";

const en = JSON.parse(readFileSync(new URL("../data/packs/en.json", import.meta.url), "utf8"));
const raj = "6f1c2a3e-0000-4000-8000-000000000101";
const [sharer, hrOnly] = [5550001101, 5550001102];
const aishaChat = 5550001001;
const sharerText = "Boss bagi 3 task semua urgent, tak tahu mana nak buat dulu";
const hrOnlyText = "Nobody told me who to ask when the line stops";
const nightly = () =>
  fetch(`${appUrl}/api/nightly`, { method: "POST", headers: { authorization: `Bearer ${process.env.DISPATCH_SECRET}` } });
const asManager = (path: string, token: string, method = "GET", body?: Record<string, unknown>) =>
  fetch(`${appUrl}${path}`, {
    method,
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: body && JSON.stringify(body),
  });

const library = (n: number) => `6f1c2a3e-0000-4000-8000-0000000004${String(n).padStart(2, "0")}`;

async function reply(chat: number, text: string) {
  await tapScore(chat, 4);
  await tapScore(chat, 3);
  await tapScore(chat, 5);
  await tapScore(chat, 3);
  await tapScore(chat, 3);
  await tapScore(chat, 3);
  await tapScore(chat, 3);
  await scriptModel("omniroute", [{ kind: "json", content: classifierTag({ evidence_quote: text }) }]);
  await say(chat, text);
}

async function replyId(text: string) {
  const queue = await (await hrRequest("/api/hr/queue", "GET")).json();
  return queue.find((row: { text: string }) => row.text === text).id as string;
}

async function draft(title: string, driver: string, libraryNumber: number, responseId?: string) {
  const res = await hrRequest("/api/hr/actions", "POST", { driver, ...(responseId && { response_id: responseId }) });
  const body = await res.json();
  if (res.status === 201) {
    assert.equal((await hrRequest(`/api/hr/actions/${body.id}`, "PATCH", { library_entry_id: library(libraryNumber), title })).status, 200);
    await hrRequest(`/api/hr/actions/${body.id}/notice`, "POST", { no_notice_reason: "Not needed for this test" });
  }
  return { status: res.status, body };
}

async function board() {
  const rows = (await (await hrRequest("/api/hr/actions", "GET")).json()) as Record<string, unknown>[];
  return rows.filter((row) => String(row.created_at) >= "2026-10-15");
}

async function alertTo(chat: number, title: string) {
  return (await sentTo(chat)).filter((m) => String(m.text).includes(title));
}

function buttonOf(message: Record<string, unknown>, label: string) {
  const markup = message.reply_markup as { inline_keyboard: { text: string; callback_data: string }[][] };
  return markup.inline_keyboard.flat().find((b) => b.text === label)!.callback_data;
}

let rajToken: string;
let aisha: string;
let budi: string;

before(async () => {
  await resetDemo();
  await freezeClock("2026-10-15T15:00:00.000Z");
  rajToken = await hrToken("raj@contoh.test");
  await joined(sharer, "2026-10-02");
  await joined(hrOnly, "2026-10-02");
  assert.equal((await hrRequest("/api/hr/demo/outreach", "POST", { touchpoint: 14 })).status, 200);
  await reply(sharer, sharerText);
  await reply(hrOnly, hrOnlyText);

  const made = await hrRequest("/api/hr/managers", "POST", { display_name: "Aisha", email: "aisha-r10@contoh.test" });
  const invite = await made.json();
  aisha = invite.manager_id;
  await link(aishaChat, String(invite.telegram_link).split("?start=")[1]);
  const other = await (await hrRequest("/api/hr/managers", "POST", { display_name: "Budi", email: "budi-r10@contoh.test" })).json();
  budi = other.manager_id;
  await hrRequest(`/api/hr/managers/${aisha}/hires`, "POST", {
    code_names: ["Deepa R.", "Zhi Hao R.", "Najwa R.", "Vinod R.", "Danish R."],
  });
  await hrRequest(`/api/hr/managers/${budi}/hires`, "POST", { code_names: ["Kalai R.", "Anitha R."] });
});

test("R10: a fix from one reply goes only to that hire's own manager, at once, with the hire's name and no words", async () => {
  const citraChat = 5550001003;
  const citra = await (await hrRequest("/api/hr/managers", "POST", { display_name: "Citra", email: "citra-r10@contoh.test" })).json();
  await link(citraChat, String(citra.telegram_link).split("?start=")[1]);
  await hrRequest(`/api/hr/managers/${citra.manager_id}/hires`, "POST", { code_names: [`Hire ${hrOnly}`] });

  const made = await draft("Name the escalation contact", "ROLE_CLARITY", 1, await replyId(hrOnlyText));
  assert.equal(made.status, 201);
  const view = await (await hrRequest(`/api/hr/actions/${made.body.id}/draft`, "GET")).json();
  assert.deepEqual(view.scopes.map((s: { type: string; label: string; managers: { name: string }[] }) => [s.type, s.label, s.managers.map((m) => m.name)]), [
    ["person", "Test Hire (Accounts Payable Asia)", ["Citra"]],
  ]);

  const wrong = await hrRequest(`/api/hr/actions/${made.body.id}/assign`, "POST", { owner: { manager_id: aisha }, due_in_days: 7 });
  assert.equal(wrong.status, 422);
  const right = await hrRequest(`/api/hr/actions/${made.body.id}/assign`, "POST", { owner: { manager_id: citra.manager_id }, due_in_days: 7 });
  assert.equal(right.status, 200);
  assert.equal((await right.json()).alert_sent, true);

  const [message] = await alertTo(citraChat, "Name the escalation contact");
  assert.match(String(message.text), /This is about Test Hire, one of your new hires\./);
  assert.doesNotMatch(String(message.text), /Nobody told me|last weekly snapshot/);
});

test("R10: scope one person is refused unless the action starts from a reply", async () => {
  const fromCard = await draft("Card action", "ROLE_CLARITY", 2);
  assert.equal(fromCard.status, 201);

  const person = (code_name: string) => ({ scope: { type: "person", code_name } });
  const patch = (id: string, body: Record<string, unknown>) => hrRequest(`/api/hr/actions/${id}`, "PATCH", body);

  assert.equal((await patch(fromCard.body.id, person("Synthetic hire 1"))).status, 422);
  assert.equal((await patch(fromCard.body.id, person(`Hire ${sharer}`))).status, 422);
  assert.equal((await patch(fromCard.body.id, person(`Hire ${hrOnly}`))).status, 422);
  assert.equal((await patch(fromCard.body.id, { scope: { type: "team", team: "Accounts Payable Asia" } })).status, 200);
  assert.equal((await hrRequest(`/api/hr/actions/${fromCard.body.id}/dismiss`, "POST", { reason: "Test setup" })).status, 200);
});

test("R10: in demo mode the alert goes at once, says it normally waits until Monday, and a snapshot count of 2 is not called several", async () => {
  const made = await draft("Workload check", "WORKLOAD", 9);
  assert.equal(
    (await hrRequest(`/api/hr/actions/${made.body.id}`, "PATCH", { scope: { type: "team", team: "Accounts Payable Asia" } })).status,
    200,
  );
  const res = await hrRequest(`/api/hr/actions/${made.body.id}/assign`, "POST", { owner: { manager_id: aisha }, due_in_days: 7 });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.alert_sent, true);
  assert.equal(body.alert_label, "In real use this alert waits until Monday");

  const [message] = await alertTo(aishaChat, "Workload check");
  assert.match(String(message.text), /Fewer than 5 new hires in Accounts Payable Asia named workload in the last weekly snapshot\./);
  assert.doesNotMatch(String(message.text), /several/i);
  assert.doesNotMatch(String(message.text), /\b2\b/);
  assert.deepEqual(
    (message.reply_markup as { inline_keyboard: { text: string }[][] }).inline_keyboard.flat().map((b) => b.text),
    ["Accept", "Mark done"],
  );
});

test("R10: with demo mode off an action from the theme card waits for the snapshot day, goes only to a manager with 5 or more in-scope hires, and quotes the snapshot count only", async () => {
  await db.from("organisations").update({ demo_mode: false }).neq("id", "00000000-0000-0000-0000-000000000000");
  const made = await draft("Weekly priorities talk", "ROLE_CLARITY", 1);
  const id = made.body.id as string;
  await hrRequest(`/api/hr/actions/${id}`, "PATCH", { scope: { type: "team", team: "Accounts Payable Asia" } });

  const tooFew = await hrRequest(`/api/hr/actions/${id}/assign`, "POST", { owner: { manager_id: budi } });
  assert.equal(tooFew.status, 422);
  assert.match((await tooFew.json()).error, /fewer than 5/);

  const res = await hrRequest(`/api/hr/actions/${id}/assign`, "POST", { owner: { manager_id: aisha }, due_in_days: 7 });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.held, true);
  assert.equal(body.alert_sent, false);
  assert.equal(body.alert_label, null);

  const rajAction = await draft("Weekly one-to-one", "MANAGER_SUPPORT", 3);
  await hrRequest(`/api/hr/actions/${rajAction.body.id}`, "PATCH", { scope: { type: "team", team: "Accounts Payable Asia" } });
  assert.equal((await hrRequest(`/api/hr/actions/${rajAction.body.id}/assign`, "POST", { owner: { manager_id: raj } })).status, 200);

  assert.equal((await (await nightly()).json()).alerts, 0);
  assert.deepEqual(await alertTo(aishaChat, "Weekly priorities talk"), []);
  assert.deepEqual(await (await asManager("/api/manager/actions", rajToken)).json(), []);

  for (const text of [sharerText, hrOnlyText]) {
    assert.equal((await hrRequest(`/api/hr/replies/${await replyId(text)}/review`, "POST")).status, 200);
  }
  await freezeClock("2026-10-19T10:00:00.000Z");
  assert.equal((await (await nightly()).json()).alerts, 2);
  const [message] = await alertTo(aishaChat, "Weekly priorities talk");
  assert.match(
    String(message.text),
    /Several new hires in Accounts Payable Asia named role clarity in the last weekly snapshot \(8 of 11 who answered\)\./,
  );
  assert.match(String(message.text), /Due Mon 26 Oct\./);
  assert.equal((await (await nightly()).json()).alerts, 0);
});

test("Telegram: Mark done finishes the action at once, even before Accept, and asks for no outcome line", async () => {
  const [message] = await alertTo(aishaChat, "Weekly priorities talk");
  await alertTo(aishaChat, "Workload check");

  await tapData(aishaChat, buttonOf(message, "Mark done"));
  assert.equal((await sentTo(aishaChat)).at(-1)!.text, `You tapped "Mark done". ${en.action.finished}`);
  assert.equal((await board()).find((row) => row.title === "Weekly priorities talk")!.status, "done");
  assert.equal((await board()).find((row) => row.title === "Workload check")!.status, "assigned");
});

test("R10: the supervisor's web card shows the released action with the snapshot context; done without an outcome note is refused", async () => {
  const cards = await (await asManager("/api/manager/actions", rajToken)).json();
  assert.equal(cards.length, 1);
  assert.equal(cards[0].title, "Weekly one-to-one");
  assert.equal(cards[0].status, "assigned");
  const id = cards[0].id as string;

  assert.equal((await asManager(`/api/manager/actions/${id}/done`, rajToken, "POST", { outcome: "Too early" })).status, 409);
  assert.equal((await asManager(`/api/manager/actions/${id}/accept`, await hrToken(), "POST")).status, 401);
  assert.equal((await asManager(`/api/manager/actions/${id}/accept`, rajToken, "POST")).status, 200);
  assert.equal((await asManager(`/api/manager/actions/${id}/done`, rajToken, "POST", {})).status, 422);
  assert.equal((await asManager(`/api/manager/actions/${id}/done`, rajToken, "POST", { outcome: "   " })).status, 422);
  assert.equal((await board()).find((row) => row.id === id)!.status, "accepted");
  assert.equal((await asManager(`/api/manager/actions/${id}/done`, rajToken, "POST", { outcome: "Booked weekly slots" })).status, 200);
  assert.equal((await board()).find((row) => row.id === id)!.status, "done");
});

test("R10: only HR assigns or dismisses, dismiss needs a reason, and an action HR owns is moved by HR", async () => {
  const made = await draft("Welcome round", "BELONGING", 6);
  const id = made.body.id as string;
  await hrRequest(`/api/hr/actions/${id}`, "PATCH", { scope: { type: "team", team: "Accounts Payable Asia" } });

  assert.equal((await asManager(`/api/hr/actions/${id}/assign`, rajToken, "POST", { owner: "hr" })).status, 401);
  assert.equal((await asManager(`/api/hr/actions/${id}/dismiss`, rajToken, "POST", { reason: "No" })).status, 401);
  assert.equal((await hrRequest(`/api/hr/actions/${id}/dismiss`, "POST", {})).status, 422);
  assert.equal((await hrRequest(`/api/hr/actions/${id}/dismiss`, "POST", { reason: "  " })).status, 422);
  assert.equal((await hrRequest(`/api/hr/actions/${id}/dismiss`, "POST", { reason: "Handled in the orientation" })).status, 200);
  const dismissed = (await board()).find((row) => row.id === id)!;
  assert.equal(dismissed.status, "dismissed");
  assert.equal(dismissed.dismiss_reason, "Handled in the orientation");
  assert.equal((await hrRequest(`/api/hr/actions/${id}/assign`, "POST", { owner: "hr" })).status, 409);

  const own = await draft("Team lunch", "BELONGING", 5);
  await hrRequest(`/api/hr/actions/${own.body.id}`, "PATCH", { scope: { type: "team", team: "Accounts Payable Asia" } });
  assert.equal((await hrRequest(`/api/hr/actions/${own.body.id}/assign`, "POST", { owner: "hr" })).status, 200);
  assert.equal((await hrRequest(`/api/hr/actions/${own.body.id}/done`, "POST", { outcome: "Too early" })).status, 409);
  assert.equal((await hrRequest(`/api/hr/actions/${own.body.id}/accept`, "POST")).status, 200);
  assert.equal((await hrRequest(`/api/hr/actions/${own.body.id}/done`, "POST", {})).status, 422);
  assert.equal((await hrRequest(`/api/hr/actions/${own.body.id}/done`, "POST", { outcome: "Lunch held" })).status, 200);
});

test("HR board: an assigned action past its due date shows as overdue, and not before", async () => {
  const open = (await board()).find((row) => row.title === "Workload check")!;
  assert.equal(open.due_on, "2026-10-22");
  assert.equal(open.overdue, false);
  await freezeClock("2026-10-27T10:00:00.000Z");
  assert.equal((await board()).find((row) => row.title === "Workload check")!.overdue, true);
});
