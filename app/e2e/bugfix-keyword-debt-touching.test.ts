import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { before, test } from "node:test";
import { db, freezeClock, hrRequest, joined, resetDemo, say, sentTo, tap, tapScore } from "./helpers.ts";

const read = (path: string) => JSON.parse(readFileSync(new URL(path, import.meta.url), "utf8"));
const en = read("../data/packs/en.json");
const [organisation] = read("../data/seed/organisations.json");
const seeded = new Set(read("../data/seed/escalations.json").map((e: { id: string }) => e.id));
const safeReply = [en.safety.message, ...organisation.escalation_contacts.general].join("\n");

const cases = [
  { chat: 5550000901, text: "He also keeps touching my shoulder and comments on my body when nobody is around.", category: "sexual_harassment" },
  { chat: 5550000902, text: "Saya berhutang dengan ejen RM8,000 untuk dapat kerja ni. Kalau berhenti kena bayar sekali gus.", category: "forced_labour_indicator" },
  { chat: 5550000903, text: "老板说我们要还清机票和办证费用才能离开。", category: "forced_labour_indicator" },
];

before(async () => {
  await resetDemo();
  await freezeClock("2026-10-15T15:00:00.000Z");
  for (const { chat } of cases) await joined(chat, "2026-10-02");
  assert.equal((await hrRequest("/api/hr/demo/outreach", "POST", { touchpoint: 14 })).status, 200);
  for (const { chat } of cases) for (const score of [4, 3, 5, 3, 3, 3, 3]) await tapScore(chat, score);
});

for (const { chat, text, category } of cases) {
  test(`R13: with the AI down, the keyword check alone escalates "${text}"`, async () => {
    const before = (await sentTo(chat)).length;
    await say(chat, text);
    assert.deepEqual((await sentTo(chat)).slice(before).map((m) => String(m.text)), [safeReply]);

    const { data: who } = await db.from("people").select("id").eq("telegram_chat_id", chat).single();
    const { data: reply } = await db.from("responses").select("id").eq("person_id", who!.id).eq("question_id", "OPEN").single();
    const rows = (await (await hrRequest("/api/hr/escalations", "GET")).json()) as { id: string; response_id: string; category: string; source: string }[];
    const alert = rows.find((row) => !seeded.has(row.id) && row.response_id === reply!.id)!;
    assert.deepEqual([alert.category, alert.source], [category, "keyword"]);
  });
}
