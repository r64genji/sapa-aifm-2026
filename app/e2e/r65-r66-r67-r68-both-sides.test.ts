import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { before, test } from "node:test";
import {
  addHire,
  classifierTag,
  db,
  freezeClock,
  hrRequest,
  joined,
  link,
  modelCalls,
  resetDemo,
  say,
  scriptModel,
  sentTo,
  tap,
  tapData,
  tapScore,
  PLAN,
} from "./helpers.ts";

const en = JSON.parse(readFileSync(new URL("../data/packs/en.json", import.meta.url), "utf8"));
const [minaChat, omarChat] = [5550006001, 5550006002];
const [named, anonymous, other] = [5550006101, 5550006102, 5550006103];
const namedText = "I asked about the month-end report twice and got no reply";
const anonymousText = "Nobody answers when I ask how to file the claims";
const otherText = "My lead is always in meetings so I wait days for an answer";

async function lead(name: string, chat: number, hires: string[]) {
  const made = await (await hrRequest("/api/hr/managers", "POST", { display_name: name, email: `${name.toLowerCase()}-r66@contoh.test` })).json();
  await link(chat, String(made.telegram_link).split("?start=")[1]);
  await hrRequest(`/api/hr/managers/${made.manager_id}/hires`, "POST", { code_names: hires });
  return made.manager_id as string;
}

async function answer(chat: number, text: string) {
  for (const score of [4, 1, 4, 4, 4, 4]) await tapScore(chat, score);
  await scriptModel("omniroute", [{ kind: "json", content: classifierTag({ drivers: ["MANAGER_SUPPORT"], evidence_quote: text }) }]);
  await say(chat, text);
}

const last = async (chat: number) => (await sentTo(chat)).at(-1)!;
const labels = (message: Record<string, unknown>) =>
  ((message.reply_markup as { inline_keyboard?: { text: string }[][] } | undefined)?.inline_keyboard ?? []).flat().map((b) => b.text);
const briefs = (areas: string[], brief: string) => ({ kind: "json" as const, content: { areas: areas.map((area) => ({ area, ask: true, brief })) } });
const ALL = ["ROLE_CLARITY", "MANAGER_SUPPORT", "BELONGING", "ONBOARDING", "TRAINING", "WORKLOAD"];

before(async () => {
  await resetDemo();
  await freezeClock("2026-10-15T15:00:00.000Z");
  await joined(named, "2026-10-02");
  const { token } = await addHire({ code_name: `Hire ${anonymous}`, start_date: "2026-10-02" });
  await link(anonymous, token);
  await tap(anonymous, "English");
  await tap(anonymous, "I agree");
  await tapData(anonymous, 'chat:{"a":"privacy","v":"anonymous"}');
  await lead("Mina", minaChat, [`Hire ${named}`, `Hire ${anonymous}`]);
  assert.equal((await hrRequest("/api/hr/demo/outreach", "POST", { touchpoint: 14 })).status, 200);
});

test("R65: a named hire with a hard tap is asked if Sapa can tell the team lead; an anonymous hire is not", async () => {
  await answer(named, namedText);
  const asked = await last(named);
  assert.equal(asked.text, en.checkin.share.question);
  assert.deepEqual(labels(asked), [en.checkin.share.meet, en.checkin.share.tell, en.checkin.share.no]);
  await say(named, "maybe");
  assert.equal((await last(named)).text, en.checkin.share.question);
  await tap(named, en.checkin.share.meet);
  assert.equal((await last(named)).text, en.checkin.chat.remarks);

  await answer(anonymous, anonymousText);
  assert.equal((await last(anonymous)).text, en.checkin.chat.remarks);
  const { data } = await db.from("checkin_schedule").select("share_with_lead, people!inner(telegram_chat_id)").eq("touchpoint", 14).in("people.telegram_chat_id", [named, anonymous]);
  assert.deepEqual(data!.map((row) => row.share_with_lead).sort(), ["meet", null]);
});

test("R66: Close round sends the team lead one message with the brief, the name of the hire who agreed and the side question", async () => {
  const brief = "New hires say your answers to their questions are slow, mostly at month end.";
  await scriptModel("omniroute", [briefs(ALL, brief)]);
  const before = (await sentTo(minaChat)).length;
  const res = await hrRequest("/api/hr/demo/close-round", "POST", {});
  assert.deepEqual(await res.json(), { sent: 1 });
  const messages = (await sentTo(minaChat)).slice(before);
  assert.equal(messages.length, 1);
  assert.equal(
    messages[0].text,
    [en.lead.opening, ["Manager support:", brief, en.lead.meet.replace("{name}", "Test Hire")].join("\n"), en.lead.side].join("\n\n"),
  );
  const [call] = (await modelCalls("omniroute")).slice(-1);
  const input = call.body.messages[1].content;
  assert.ok(input.includes(namedText) && input.includes(anonymousText) && input.includes("Test Hire"));
  assert.equal((await (await hrRequest("/api/hr/demo/close-round", "POST", {})).json()).sent, 0);
});

test("R66: a brief that copies a reply falls back to the fixed brief, and a hire who said no is not named", async () => {
  const { token } = await addHire({ code_name: `Hire ${other}`, start_date: "2026-10-02" });
  await link(other, token);
  await tap(other, "English");
  await tap(other, "I agree");
  await tapData(other, 'chat:{"a":"privacy","v":"named"}');
  await say(other, "Other Hire");
  await lead("Omar", omarChat, [`Hire ${other}`]);
  assert.equal((await hrRequest("/api/hr/demo/outreach", "POST", { touchpoint: 14 })).status, 200);
  await answer(other, otherText);
  await tap(other, en.checkin.share.no);
  const copied = "Other Hire says the lead is always in meetings so they wait.";
  await scriptModel("omniroute", [briefs(ALL, copied), briefs(ALL, copied)]);
  assert.deepEqual(await (await hrRequest("/api/hr/demo/close-round", "POST", {})).json(), { sent: 1 });
  assert.equal((await last(omarChat)).text, [en.lead.opening, ["Manager support:", en.lead.briefs.MANAGER_SUPPORT].join("\n"), en.lead.side].join("\n\n"));
});

test("R67: the team lead's next message is stored as their side and HR sees it with the brief", async () => {
  await say(minaChat, "I was on a client audit for 3 weeks. Call me on 012-345 6789.");
  assert.equal((await last(minaChat)).text, en.lead.thanks);
  const rows = (await (await hrRequest("/api/hr/lead-briefs?driver=MANAGER_SUPPORT", "GET")).json()) as { lead: string; side: string; items: { hires: { name: string; share: string }[] }[] }[];
  const row = rows.find((r) => r.lead === "Mina")!;
  assert.equal(row.side, "I was on a client audit for 3 weeks. Call me on [PHONE].");
  assert.deepEqual(row.items[0].hires, [{ name: "Test Hire", share: "meet" }]);
  await say(minaChat, "One more thing");
  assert.equal((await last(minaChat)).text, en.action.idle);
});

test("R68: a fix with an empty part or a When with no time cannot be assigned; the AI fills the six parts from the team lead's side", async () => {
  const { id } = await (await hrRequest("/api/hr/actions", "POST", { driver: "MANAGER_SUPPORT" })).json();
  assert.equal((await hrRequest(`/api/hr/actions/${id}`, "PATCH", { scope: { type: "team", team: "Accounts Payable Asia" } })).status, 200);
  assert.equal((await hrRequest(`/api/hr/actions/${id}/notice`, "POST", { no_notice_reason: "Not needed for this test" })).status, 200);
  assert.equal((await hrRequest(`/api/hr/actions/${id}/assign`, "POST", { owner: "hr" })).status, 422);
  assert.equal((await hrRequest(`/api/hr/actions/${id}`, "PATCH", { plan: { ...PLAN, when: "Soon" } })).status, 200);
  assert.equal((await hrRequest(`/api/hr/actions/${id}/assign`, "POST", { owner: "hr" })).status, 422);
  assert.equal((await hrRequest(`/api/hr/actions/${id}`, "PATCH", { plan: { ...PLAN, talk_about: " " } })).status, 200);
  assert.equal((await hrRequest(`/api/hr/actions/${id}/assign`, "POST", { owner: "hr" })).status, 422);

  const { problem, who, when, talk_about, done_when } = PLAN;
  await scriptModel("omniroute", [{ kind: "json", content: { problem, who, action: "Hold a 15-minute 1-on-1 with each new hire.", when, talk_about, done_when } }]);
  const filled = await hrRequest(`/api/hr/actions/${id}/plan`, "POST");
  assert.equal(filled.status, 200);
  assert.deepEqual(await filled.json(), { id, steps: "Hold a 15-minute 1-on-1 with each new hire.", plan: PLAN });
  const [call] = (await modelCalls("omniroute")).slice(-1);
  assert.ok(call.body.messages[1].content.includes("client audit"));
  assert.equal((await hrRequest(`/api/hr/actions/${id}/assign`, "POST", { owner: "hr" })).status, 200);
});
