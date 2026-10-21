import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { before, test } from "node:test";
import {
  appUrl,
  classifierTag,
  freezeClock,
  hrRequest,
  hrToken,
  joined,
  resetDemo,
  say,
  scriptModel,
  tap,
  tapScore,
} from "./helpers.ts";

const seeded = new Set(JSON.parse(readFileSync(new URL("../data/seed/escalations.json", import.meta.url), "utf8")).map((e: { id: string }) => e.id));
const chat = 5550000801;
const text = "The agent holds my passport";
const summary = "The agent keeps the employee's passport.";

before(async () => {
  await resetDemo();
  await freezeClock("2026-10-15T15:00:00.000Z");
  await joined(chat, "2026-10-02");
  assert.equal((await hrRequest("/api/hr/demo/outreach", "POST", { touchpoint: 14 })).status, 200);
  await tapScore(chat, 4);
  await tapScore(chat, 3);
  await tapScore(chat, 5);
  await tapScore(chat, 3);
  await tapScore(chat, 3);
  await tapScore(chat, 3);
  await tapScore(chat, 3);
  await scriptModel("omniroute", [{ kind: "json", content: classifierTag({ evidence_quote: text, summary }) }]);
  await say(chat, text);
});

test("R7: a reply escalated by keyword alone, with a label HR confirmed, is in no theme count or manager snapshot", async () => {
  const escalations = ((await (await hrRequest("/api/hr/escalations", "GET")).json()) as { id: string; response_id: string; source: string }[]).filter(
    (e) => !seeded.has(e.id),
  );
  assert.equal(escalations.length, 1);
  assert.equal(escalations[0].source, "keyword");
  assert.equal((await hrRequest(`/api/hr/replies/${escalations[0].response_id}/review`, "POST")).status, 200);

  const themes = await (await hrRequest("/api/hr/themes", "GET")).json();
  const card = themes.cards.find((c: { driver: string }) => c.driver === "ROLE_CLARITY");
  assert.deepEqual([card.n, card.m], [23, 64]);

  await freezeClock("2026-10-19T10:00:00.000Z");
  const nightly = await fetch(`${appUrl}/api/nightly`, {
    method: "POST",
    headers: { authorization: `Bearer ${process.env.DISPATCH_SECRET}` },
  });
  assert.equal(nightly.status, 200);
  const res = await fetch(`${appUrl}/api/manager/snapshots`, { headers: { authorization: `Bearer ${await hrToken("raj@contoh.test")}` } });
  const snapshots = (await res.json()) as { team: string }[];
  assert.deepEqual(
    snapshots.find((s) => s.team === "Accounts Payable Asia"),
    {
      team: "Accounts Payable Asia",
      week: "2026-10-19",
      enough: true,
      respondents: 9,
      drivers: {
        ROLE_CLARITY: 6,
        MANAGER_SUPPORT: "fewer than 3",
        BELONGING: "fewer than 3",
        ONBOARDING: "fewer than 3",
        TRAINING: "fewer than 3",
        WORKLOAD: "fewer than 3",
      },
    },
  );
});
