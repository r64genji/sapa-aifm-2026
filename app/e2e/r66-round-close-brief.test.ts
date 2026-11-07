import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { before, test } from "node:test";
import { classifierTag, dispatch, freezeClock, hrRequest, joined, link, modelCalls, resetDemo, say, scriptModel, sentTo, tap, tapScore } from "./helpers.ts";

const en = JSON.parse(readFileSync(new URL("../data/packs/en.json", import.meta.url), "utf8"));
const SENT = "2026-10-15T15:00:00.000Z";
const BOTH = [4, 1, 4, 1, 4, 4];
const ONE = [4, 1, 4, 4, 4, 4];
const MANAGER = "Manager support:";
const WORKPLACE = "Workplace:";

async function team(name: string, leadChat: number, hire: number) {
  await joined(hire, "2026-10-02");
  const made = await (await hrRequest("/api/hr/managers", "POST", { display_name: name, email: `${name.toLowerCase()}-r66b@contoh.test` })).json();
  await link(leadChat, String(made.telegram_link).split("?start=")[1]);
  await hrRequest(`/api/hr/managers/${made.manager_id}/hires`, "POST", { code_names: [`Hire ${hire}`] });
  assert.equal((await hrRequest("/api/hr/demo/outreach", "POST", { touchpoint: 14 })).status, 200);
}

async function checkin(hire: number, text: string, share: "meet" | "tell" | "no" | null, taps = BOTH, drivers = ["MANAGER_SUPPORT"]) {
  for (const score of taps) await tapScore(hire, score);
  await scriptModel("omniroute", [{ kind: "json", content: classifierTag({ drivers, evidence_quote: text }) }]);
  await say(hire, text);
  if (share) await tap(hire, en.checkin.share[share]);
}

const areas = (list: { area: string; ask: boolean; brief: string }[]) => ({ kind: "json" as const, content: { areas: list } });
const closeRound = async () => (await (await hrRequest("/api/hr/demo/close-round", "POST", {})).json()) as { sent: number };
const lastText = async (chat: number) => String((await sentTo(chat)).at(-1)?.text ?? "");
const message = (...blocks: string[][]) => [en.lead.opening, ...blocks.map((b) => b.join("\n")), en.lead.side].join("\n\n");

before(async () => {
  await resetDemo();
  await freezeClock(SENT);
});

test("R66: an area with no hard tap that the AI marks as not a problem for the team lead is left out of the brief", async () => {
  const [leadChat, hire] = [5550008001, 5550008101];
  await team("Siti", leadChat, hire);
  await checkin(hire, "The canteen has no halal food and my lead takes days to answer", "no", ONE, ["MANAGER_SUPPORT", "ONBOARDING"]);
  const brief = "New hires say your answers to their questions take days.";
  await scriptModel("omniroute", [areas([{ area: "MANAGER_SUPPORT", ask: true, brief }, { area: "ONBOARDING", ask: false, brief: "The canteen has no halal food." }])]);
  assert.deepEqual(await closeRound(), { sent: 1 });
  assert.equal(await lastText(leadChat), message([MANAGER, brief]));
  const rows = (await (await hrRequest("/api/hr/lead-briefs", "GET")).json()) as { lead: string; items: { driver: string }[] }[];
  assert.deepEqual(rows.find((row) => row.lead === "Siti")!.items.map((item) => item.driver), ["MANAGER_SUPPORT"]);
});

test("R66: when the AI marks every area with no hard tap as not a problem for the team lead, nothing is sent", async () => {
  const [leadChat, hire] = [5550008002, 5550008102];
  await team("Wei", leadChat, hire);
  await checkin(hire, "Parking near the office costs too much", null, [4, 4, 4, 4, 4, 4], ["MANAGER_SUPPORT", "ONBOARDING"]);
  const before = (await sentTo(leadChat)).length;
  await scriptModel("omniroute", [areas([{ area: "MANAGER_SUPPORT", ask: false, brief: "Parking costs too much." }, { area: "ONBOARDING", ask: false, brief: "Parking costs too much." }])]);
  assert.deepEqual(await closeRound(), { sent: 0 });
  assert.equal((await sentTo(leadChat)).length, before);
  const rows = (await (await hrRequest("/api/hr/lead-briefs", "GET")).json()) as { lead: string }[];
  assert.equal(rows.some((row) => row.lead === "Wei"), false);
});

test("R66: with the AI unreachable, every area gets its fixed brief", async () => {
  const [leadChat, hire] = [5550008003, 5550008103];
  await team("Arun", leadChat, hire);
  await checkin(hire, "My lead is never at his desk", "no");
  assert.deepEqual(await closeRound(), { sent: 1 });
  const text = await lastText(leadChat);
  assert.ok(text.includes([MANAGER, en.lead.briefs.MANAGER_SUPPORT].join("\n")));
  assert.ok(text.includes([WORKPLACE, en.lead.briefs.ONBOARDING].join("\n")));
});

test("R66: a brief with a digit is retried once, then the fixed brief is used", async () => {
  const [leadChat, hire] = [5550008004, 5550008104];
  await team("Lena", leadChat, hire);
  await checkin(hire, "My lead answers my questions very late", "no", ONE);
  const digit = areas([{ area: "MANAGER_SUPPORT", ask: true, brief: "New hires wait 3 days for your answers." }, { area: "ONBOARDING", ask: false, brief: "Nothing." }]);
  await scriptModel("omniroute", [digit, digit]);
  assert.deepEqual(await closeRound(), { sent: 1 });
  assert.equal(await lastText(leadChat), message([MANAGER, en.lead.briefs.MANAGER_SUPPORT]));
});

test("R66: a brief that names a hire who did not tap Yes is retried once, then the fixed brief is used", async () => {
  const [leadChat, hire] = [5550008005, 5550008105];
  await team("Kumar", leadChat, hire);
  await checkin(hire, "My lead answers my questions very late", "no", ONE);
  const named = areas([{ area: "MANAGER_SUPPORT", ask: true, brief: "Test Hire says your answers come late." }, { area: "ONBOARDING", ask: false, brief: "Nothing." }]);
  await scriptModel("omniroute", [named, named]);
  assert.deepEqual(await closeRound(), { sent: 1 });
  assert.equal(await lastText(leadChat), message([MANAGER, en.lead.briefs.MANAGER_SUPPORT]));
});

test("R66: an escalated reply is left out of the AI input", async () => {
  const [leadChat, hire] = [5550008006, 5550008106];
  await team("Farah", leadChat, hire);
  const text = "The agent holds my passport";
  for (const score of BOTH) await tapScore(hire, score);
  await scriptModel("omniroute", [{ kind: "json", content: classifierTag({ evidence_quote: text, summary: "The agent keeps the passport." }) }]);
  await say(hire, text);
  const [brief, workplace] = ["New hires say it is hard to reach you.", "New hires say their desk setup is not ready."];
  await scriptModel("omniroute", [areas([{ area: "MANAGER_SUPPORT", ask: true, brief }, { area: "ONBOARDING", ask: false, brief: workplace }])]);
  assert.deepEqual(await closeRound(), { sent: 1 });
  const input = (await modelCalls("omniroute")).at(-1)!.body.messages[1].content;
  assert.ok(input.includes("MANAGER_SUPPORT"));
  assert.equal(input.includes("passport"), false);
  assert.equal(await lastText(leadChat), message([MANAGER, brief], [WORKPLACE, workplace]));
});

test("R66: a round closes by itself 24 hours after the check-in was sent", async () => {
  const [leadChat, hire] = [5550008007, 5550008107];
  await team("Daniel", leadChat, hire);
  await checkin(hire, "My lead answers my questions very late", "no", ONE);
  const before = (await sentTo(leadChat)).length;
  await freezeClock("2026-10-16T14:59:00.000Z");
  await dispatch();
  assert.equal((await sentTo(leadChat)).length, before);
  const brief = "New hires say your answers to their questions come late.";
  await scriptModel("omniroute", [areas([{ area: "MANAGER_SUPPORT", ask: true, brief }, { area: "ONBOARDING", ask: false, brief: "Nothing." }])]);
  await freezeClock("2026-10-16T15:00:00.000Z");
  await dispatch();
  assert.equal(await lastText(leadChat), message([MANAGER, brief]));
});

test("R66: an area the hire wrote about is in the brief even without a hard tap on it", async () => {
  await freezeClock(SENT);
  const [leadChat, hire] = [5550008008, 5550008108];
  await team("Mei", leadChat, hire);
  for (const score of [1, 3, 4, 4, 4, 4]) await tapScore(hire, score);
  const text = "My lead was too busy to reply to me this week";
  await scriptModel("omniroute", [{ kind: "json", content: classifierTag({ drivers: ["MANAGER_SUPPORT"], evidence_quote: text }) }]);
  await say(hire, text);
  assert.deepEqual(await closeRound(), { sent: 1 });
  assert.equal(await lastText(leadChat), message(["Role clarity:", en.lead.briefs.ROLE_CLARITY], [MANAGER, en.lead.briefs.MANAGER_SUPPORT]));
});

test("R66: with hard taps and no text, the brief is sent even when the AI marks the area as not a problem", async () => {
  const [leadChat, hire] = [5550008009, 5550008109];
  await team("Hana", leadChat, hire);
  for (const score of BOTH) await tapScore(hire, score);
  const [manager, workplace] = ["New hires say it is hard to get answers from you.", "New hires say their desk setup is not ready."];
  await scriptModel("omniroute", [areas([{ area: "MANAGER_SUPPORT", ask: false, brief: manager }, { area: "ONBOARDING", ask: false, brief: workplace }])]);
  assert.deepEqual(await closeRound(), { sent: 1 });
  assert.equal(await lastText(leadChat), message([MANAGER, manager], [WORKPLACE, workplace]));
});
