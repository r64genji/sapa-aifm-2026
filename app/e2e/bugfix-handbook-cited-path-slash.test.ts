import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { before, test } from "node:test";
import { freezeClock, joined, resetDemo, say, scriptModel, sentTo } from "./helpers.ts";

const en = JSON.parse(readFileSync(new URL("../data/packs/en.json", import.meta.url), "utf8"));
const chat = 5550007501;
const quote = "To claim overtime, fill in the overtime form on the same day and give it to your supervisor for signing.";

before(async () => {
  await resetDemo();
  await freezeClock("2026-10-15T15:00:00.000Z");
  await joined(chat, "2026-10-14");
});

test("Bug fix: a handbook answer whose cited page starts with a slash is still sent, not replaced by I don't know", async () => {
  await scriptModel("omniroute", [
    {
      kind: "json",
      content: {
        kind: "question",
        important_topic: "none",
        answer: "Fill in the overtime form on the same day and give it to your supervisor.",
        cited_path: "/pay/overtime.md",
        supporting_quote: quote,
        group: { id: "new", text: "How do I claim overtime?" },
      },
    },
  ]);
  const before = (await sentTo(chat)).length;
  await say(chat, "How do I claim overtime?");
  const texts = (await sentTo(chat)).slice(before).map((m) => String(m.text));
  assert.deepEqual(texts, [`Fill in the overtime form on the same day and give it to your supervisor.\n\n${en.qa.disclaimer}`]);
});
