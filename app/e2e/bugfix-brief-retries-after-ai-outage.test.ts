import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { before, test } from "node:test";
import { classifierTag, freezeClock, hrRequest, joined, link, resetDemo, say, scriptModel, sentTo, tap, tapScore } from "./helpers.ts";

const en = JSON.parse(readFileSync(new URL("../data/packs/en.json", import.meta.url), "utf8"));
const [leadChat, hire] = [5550007001, 5550007101];
const text = "The aircon on level 5 is broken and my lead never answers my questions";
const brief = "New hires say your answers to their questions come late.";

before(async () => {
  await resetDemo();
  await freezeClock("2026-10-15T15:00:00.000Z");
  await joined(hire, "2026-10-02");
  const made = await (await hrRequest("/api/hr/managers", "POST", { display_name: "Rina", email: "rina-outage@contoh.test" })).json();
  await link(leadChat, String(made.telegram_link).split("?start=")[1]);
  await hrRequest(`/api/hr/managers/${made.manager_id}/hires`, "POST", { code_names: [`Hire ${hire}`] });
  assert.equal((await hrRequest("/api/hr/demo/outreach", "POST", { touchpoint: 14 })).status, 200);
  for (const score of [4, 1, 4, 4, 4, 4]) await tapScore(hire, score);
  await scriptModel("omniroute", [{ kind: "json", content: classifierTag({ drivers: ["MANAGER_SUPPORT", "ONBOARDING"], evidence_quote: text }) }]);
  await say(hire, text);
  await tap(hire, en.checkin.share.no);
});

test("bug fix: one failed AI call at round close is tried again, so an area the AI leaves out does not reach the team lead", async () => {
  await scriptModel("omniroute", [
    { kind: "error", status: 503 },
    { kind: "json", content: { areas: [{ area: "MANAGER_SUPPORT", ask: true, brief }, { area: "ONBOARDING", ask: false, brief: "The office aircon is broken." }] } },
  ]);
  await scriptModel("deepseek", [{ kind: "error", status: 503 }]);
  assert.deepEqual(await (await hrRequest("/api/hr/demo/close-round", "POST", {})).json(), { sent: 1 });
  assert.equal((await sentTo(leadChat)).at(-1)!.text, [en.lead.opening, ["Manager support:", brief].join("\n"), en.lead.side].join("\n\n"));
});
