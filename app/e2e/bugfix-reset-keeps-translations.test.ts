import assert from "node:assert/strict";
import { before, test } from "node:test";
import { callReset, freezeClock, hrRequest, modelCalls, resetDemo, scriptModel } from "./helpers.ts";

const translated = "I am not sure yet what my tasks are.";

before(async () => {
  await resetDemo();
  await freezeClock("2026-10-15T15:00:00.000Z");
});

test("Bug fix: Reset to seed keeps the translations HR already opened", async () => {
  const replies = (await (await hrRequest("/api/hr/replies", "GET")).json()) as { id: string; language: string }[];
  const malay = replies.find((reply) => reply.language === "ms")!;
  await scriptModel("omniroute", [{ kind: "json", content: { translation: translated } }]);
  const first = await (await hrRequest(`/api/hr/replies/${malay.id}/translation`, "GET")).json();
  assert.deepEqual(first.translation, { label: "AI translation", text: translated });
  await callReset();
  const again = await (await hrRequest(`/api/hr/replies/${malay.id}/translation`, "GET")).json();
  assert.deepEqual(again.translation, { label: "AI translation", text: translated });
  assert.equal((await modelCalls("omniroute")).length, 0);
});
