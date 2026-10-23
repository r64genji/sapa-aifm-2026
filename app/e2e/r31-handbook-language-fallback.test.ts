import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { before, test } from "node:test";
import { freezeClock, hrRequest, joined, resetDemo, say, scriptModel, sentTo } from "./helpers.ts";

const en = JSON.parse(readFileSync(new URL("../data/packs/en.json", import.meta.url), "utf8"));
const asker = 5550001601;

before(async () => {
  await resetDemo();
  await freezeClock("2026-10-15T15:00:00.000Z");
  await joined(asker, "2026-10-14");
});

test("R31: an English question on a page that exists only in Bahasa Malaysia gets that page's answer and the fixed note", async () => {
  const quote = "Kereta boleh diletakkan di Lot B dengan pas yang dikeluarkan oleh HR.";
  const saved = await hrRequest("/api/hr/handbook", "PUT", {
    path: "facilities/parking.md",
    language: "ms",
    body: `# Tempat letak kereta\n\n${quote}`,
  });
  assert.equal(saved.status, 200);
  const published = await hrRequest("/api/hr/handbook/status", "POST", {
    path: "facilities/parking.md",
    language: "ms",
    status: "published",
  });
  assert.equal(published.status, 200);
  await scriptModel("omniroute", [
    {
      kind: "json",
      content: {
        kind: "question",
        important_topic: "none",
        answer: "Letakkan kereta anda di Lot B dengan pas daripada HR.",
        cited_path: "facilities/parking.md",
        supporting_quote: quote,
        group: { id: "new", text: "Where can I park my car?" },
      },
    },
  ]);
  const before = (await sentTo(asker)).length;
  await say(asker, "Where can I park my car?");
  const replies = (await sentTo(asker)).slice(before).map((m) => String(m.text));
  assert.deepEqual(replies, [
    [
      "Letakkan kereta anda di Lot B dengan pas daripada HR.",
      "This answer is in Bahasa Malaysia. Ask HR if it is not clear.",
      `\n${en.qa.disclaimer}`,
    ].join("\n"),
  ]);
});
