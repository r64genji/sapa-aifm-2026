import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { before, test } from "node:test";
import { classifierTag, freezeClock, hrRequest, link, resetDemo, say, scriptModel, sentTo, tap, tapScore, teamInvites } from "./helpers.ts";

const en = JSON.parse(readFileSync(new URL("../data/packs/en.json", import.meta.url), "utf8"));
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
const bigTeam = 5550006201;
const smallTeam = 5550006202;
const bigReply = "Nobody told me which reports are mine, tak tahu mana nak buat dulu";
const smallReply = "Saya tak tahu mana nak buat dulu setiap pagi";
const texts = async (chat: number) => (await sentTo(chat)).map((m) => m.text);

async function joinAnonymous(chat: number, token: string) {
  await link(chat, token);
  await tap(chat, "English");
  await tap(chat, en.agree);
  await tap(chat, en.privacy.anonymous);
  await tap(chat, en.firstJob.no);
}

async function answer(chat: number, text: string) {
  for (const score of [4, 3, 5, 3, 3, 3]) await tapScore(chat, score);
  await scriptModel("omniroute:chat", [{ kind: "json", content: interviewerDone }]);
  await scriptModel("omniroute", [{ kind: "json", content: classifierTag() }]);
  await say(chat, text);
}

before(async () => {
  await resetDemo();
  await freezeClock("2026-10-15T15:00:00.000Z");
  await joinAnonymous(bigTeam, teamInvites["Accounts Payable Asia"]);
  await joinAnonymous(smallTeam, teamInvites["Korean Desk"]);
  assert.equal((await (await hrRequest("/api/hr/demo/outreach", "POST", { touchpoint: 14 })).json()).sent, 2);
  await answer(bigTeam, bigReply);
  await answer(smallTeam, smallReply);
});

test("R62: after consent the hire picks named or anonymous, and an anonymous hire is told HR will not see their name", async () => {
  const sent = await texts(bigTeam);
  assert.ok(sent.includes(`You tapped "${en.agree}". ${en.help}`));
  assert.ok(sent.includes(en.privacy.question));
  assert.ok(sent.includes(`You tapped "${en.privacy.anonymous}". ${en.privacy.anonymousDone}`));
  assert.ok(!sent.includes(en.yourName.question));
  assert.ok(sent.some((t) => String(t).startsWith("Hi, it's time for your Sapa check-in. You are anonymous.\n\n")));
});

test("R62: HR sees an anonymous reply only when 5 or more people in its team named the same problem area, and never with a name", async () => {
  const replies = (await (await hrRequest("/api/hr/replies", "GET")).json()) as { text: string; byline: string }[];
  const big = replies.find((reply) => reply.text.includes("Nobody told me which reports are mine"));
  assert.ok(big);
  assert.equal(big.byline, "A new hire · Accounts Payable Asia · Day 14");
  assert.equal(replies.find((reply) => reply.text.includes("setiap pagi")), undefined);
});

test("R62: /privacy shows the current choice; switching to named asks the name and keeps old replies anonymous", async () => {
  await say(bigTeam, "/privacy");
  assert.equal((await texts(bigTeam)).at(-1), en.privacy.nowAnonymous);
  await tap(bigTeam, en.privacy.named);
  assert.equal((await texts(bigTeam)).at(-1), `You tapped "${en.privacy.named}". ${en.yourName.question}`);
  await say(bigTeam, "Nur Aina");
  assert.equal((await texts(bigTeam)).at(-1), en.privacy.namedDone);
  const replies = (await (await hrRequest("/api/hr/replies", "GET")).json()) as { text: string; byline: string }[];
  assert.equal(replies.find((reply) => reply.text.includes("Nobody told me which reports are mine"))?.byline, "A new hire · Accounts Payable Asia · Day 14");
});
