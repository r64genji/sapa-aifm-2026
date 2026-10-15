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
  modelCalls,
  resetDemo,
  say,
  scriptModel,
  sentTo,
  settle,
  tap,
} from "./helpers.ts";

const seeded = new Set(JSON.parse(readFileSync(new URL("../data/seed/escalations.json", import.meta.url), "utf8")).map((e: { id: string }) => e.id));
const chat = 5550000801;
const text = "The agent holds my passport";
const summary = "The agent keeps the employee's passport.";

before(async () => {
  await resetDemo();
  await freezeClock("2026-10-15T15:00:00.000Z");
  await joined(chat, "2026-10-02");
  assert.equal((await hrRequest("/api/hr/demo/advance", "POST", { day: 14 })).status, 200);
  await tap(chat, "4");
  await tap(chat, "3");
  await tap(chat, "5");
  await tap(chat, "3");
  await tap(chat, "3");
  await tap(chat, "3");
  await scriptModel("omniroute", [{ kind: "json", content: classifierTag({ evidence_quote: text, summary }) }]);
  const sent = (await sentTo(chat)).length;
  await say(chat, text);
  for (let i = 0; i < 60 && (await sentTo(chat)).length === sent; i++) await settle(500);
  await settle();
});

test("R7: a reply escalated by keyword alone, with a label HR confirmed, is in no theme count, narrative or manager snapshot", async () => {
  const escalations = ((await (await hrRequest("/api/hr/escalations", "GET")).json()) as { id: string; response_id: string; source: string }[]).filter(
    (e) => !seeded.has(e.id),
  );
  assert.equal(escalations.length, 1);
  assert.equal(escalations[0].source, "keyword");
  assert.equal((await hrRequest(`/api/hr/replies/${escalations[0].response_id}/review`, "POST")).status, 200);

  const themes = await (await hrRequest("/api/hr/themes", "GET")).json();
  const card = themes.cards.find((c: { driver: string }) => c.driver === "ROLE_CLARITY");
  assert.deepEqual([card.n, card.m], [23, 64]);

  const narrative = { text: "Role clarity was raised by 23 of 64 people who answered." };
  await scriptModel("omniroute", [{ kind: "json", content: narrative }]);
  assert.deepEqual(await (await hrRequest("/api/hr/themes/narrative", "GET")).json(), { narrative: narrative.text });
  const prompt = JSON.stringify((await modelCalls("omniroute")).at(-1)!.body);
  assert.ok(prompt.includes("ROLE_CLARITY"));
  assert.ok(!prompt.includes("passport"));

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
        ROLE_CLARITY: 5,
        MANAGER_SUPPORT: "fewer than 3",
        BELONGING: "fewer than 3",
        ONBOARDING_TRAINING: "fewer than 3",
        WORKLOAD: "fewer than 3",
      },
    },
  );
});
