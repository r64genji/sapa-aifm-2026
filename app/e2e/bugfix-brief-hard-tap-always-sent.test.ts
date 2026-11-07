import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { before, test } from "node:test";
import { classifierTag, freezeClock, hrRequest, joined, link, resetDemo, say, scriptModel, sentTo, tap, tapScore } from "./helpers.ts";

const en = JSON.parse(readFileSync(new URL("../data/packs/en.json", import.meta.url), "utf8"));

before(async () => {
  await resetDemo();
  await freezeClock("2026-10-15T15:00:00.000Z");
});

test("Bug fix: a hard tap reaches the team lead even when the AI says the reply is not a problem for them", async () => {
  const [leadChat, hire] = [5550013001, 5550013101];
  await joined(hire, "2026-10-02");
  const made = await (await hrRequest("/api/hr/managers", "POST", { display_name: "Rina", email: "rina-hardtap@contoh.test" })).json();
  await link(leadChat, String(made.telegram_link).split("?start=")[1]);
  await hrRequest(`/api/hr/managers/${made.manager_id}/hires`, "POST", { code_names: [`Hire ${hire}`] });
  assert.equal((await hrRequest("/api/hr/demo/outreach", "POST", { touchpoint: 14 })).status, 200);
  for (const score of [4, 1, 4, 4, 4, 4]) await tapScore(hire, score);
  await scriptModel("omniroute", [{ kind: "json", content: classifierTag({ drivers: ["MANAGER_SUPPORT"], evidence_quote: "he was busy" }) }]);
  await say(hire, "he was busy");
  await tap(hire, en.checkin.share.no);
  const no = { kind: "json" as const, content: { areas: [{ area: "MANAGER_SUPPORT", ask: false, brief: "This does not show a problem you can address." }] } };
  await scriptModel("omniroute", [no, no]);
  assert.deepEqual(await (await hrRequest("/api/hr/demo/close-round", "POST", {})).json(), { sent: 1 });
  assert.equal(String((await sentTo(leadChat)).at(-1)?.text), [en.lead.opening, ["Manager support:", en.lead.briefs.MANAGER_SUPPORT].join("\n"), en.lead.side].join("\n\n"));
});
