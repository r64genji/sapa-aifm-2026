import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { before, test } from "node:test";
import { appUrl, freezeClock, hrRequest, hrToken, link, resetDemo, say, sentTo, tap, tapData, tapScore, teamInvites } from "./helpers.ts";

const en = JSON.parse(readFileSync(new URL("../data/packs/en.json", import.meta.url), "utf8"));
const hire = 5550007801;

before(async () => {
  await resetDemo();
  await freezeClock("2026-10-15T15:00:00.000Z");
  const saved = await fetch(`${appUrl}/api/hr/tracks`, {
    method: "PUT",
    headers: { authorization: `Bearer ${await hrToken("admin@contoh.test")}`, "content-type": "application/json" },
    body: JSON.stringify({
      tracks: [
        { id: "new_hire", name: "New hire", days: [3, 7, 14, 30, 60, 90, 182], questions: ["ROLE_CLARITY", "MANAGER_SUPPORT"] },
        { id: "employee", name: "Employee", days: [273, 365, 456, 547], questions: ["MANAGER_SUPPORT", "BELONGING", "WORKLOAD", "OPEN"] },
      ],
    }),
  });
  assert.equal(saved.status, 200);
  await link(hire, teamInvites["Accounts Payable Asia"]);
  await tap(hire, "English");
  await tap(hire, "I agree");
  await tapData(hire, 'chat:{"a":"privacy","v":"named"}');
  await say(hire, "Abe Tan");
});

test("Bug fix: a check-in with no open chat still asks a named hire with a hard tap if Sapa can tell the team lead", async () => {
  assert.equal((await hrRequest("/api/hr/demo/outreach", "POST", { touchpoint: 14 })).status, 200);
  await tapScore(hire, 1);
  await tapScore(hire, 2);
  assert.equal(String((await sentTo(hire)).at(-1)?.text), `You tapped "Quite hard". ${en.checkin.share.question}`);
});
