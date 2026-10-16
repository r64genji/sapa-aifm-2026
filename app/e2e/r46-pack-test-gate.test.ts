import assert from "node:assert/strict";
import { before, test } from "node:test";
import { appUrl, classifierTag, db, freezeClock, hrRequest, hrToken, joined, resetSeed, say, scriptModel, tap } from "./helpers.ts";

const [first, second] = [5550004601, 5550004602];

async function tagOf(chat: number) {
  const { data: who } = await db.from("people").select("id").eq("telegram_chat_id", chat).single();
  const { data: response } = await db.from("responses").select("id").eq("person_id", who!.id).eq("question_id", "OPEN").single();
  const { data } = await db.from("ai_tags").select("status, counted").eq("response_id", response!.id).single();
  return data;
}

async function reply(chat: number) {
  await tap(chat, "4");
  await tap(chat, "3");
  await tap(chat, "5");
  await tap(chat, "3");
  await tap(chat, "3");
  await tap(chat, "3");
  await scriptModel("omniroute", [{ kind: "json", content: classifierTag() }]);
  await say(chat, "Boss bagi 3 task semua urgent, tak tahu mana nak buat dulu");
}

const passTest = async (language: string, body: Record<string, unknown>, email?: string) =>
  fetch(`${appUrl}/api/hr/language-packs/${language}/test-passed`, {
    method: "POST",
    headers: { authorization: `Bearer ${await hrToken(email)}`, "content-type": "application/json" },
    body: JSON.stringify(body),
  });

before(async () => {
  await resetSeed();
  await freezeClock("2026-10-15T15:00:00.000Z");
  await joined(first, "2026-10-02");
  await joined(second, "2026-10-02");
  assert.equal((await hrRequest("/api/hr/demo/advance", "POST", { day: 14 })).status, 200);
});

test("R46: a pack that has not passed its test sends every tag to needs review, even an AI-confident one", async () => {
  await reply(first);
  assert.deepEqual(await tagOf(first), { status: "needs_review", counted: false });
});

test("R46: only an HR admin records that a pack passed, naming the results file, and the tags then count", async () => {
  assert.equal((await passTest("en", { results_file: "eval/results/en.json" }, "hr@contoh.test")).status, 403);
  assert.equal((await passTest("en", { results_file: "somewhere/else.json" }, "admin@contoh.test")).status, 400);
  assert.equal((await passTest("en", { results_file: "eval/results/en-gemini-2026-10-16.json" }, "admin@contoh.test")).status, 200);
  const { data: pack } = await db.from("language_packs").select("test_passed_on, test_results_file").eq("language", "en").single();
  assert.deepEqual(pack, { test_passed_on: "2026-10-15", test_results_file: "eval/results/en-gemini-2026-10-16.json" });
  const { data: audited } = await db.from("audit_log").select("target").eq("action", "pass_language_pack_test");
  assert.deepEqual(audited, [{ target: "en:eval/results/en-gemini-2026-10-16.json" }]);

  await reply(second);
  assert.deepEqual(await tagOf(second), { status: "ok", counted: true });
});

test("R44: the language panel shows Not evaluated for a pack that has not passed, false alarms closed as not serious, and the share sent to review", async () => {
  const { data: seeded } = await db.from("responses").select("id").eq("language", "en").limit(1).single();
  const { data: escalation, error } = await db
    .from("escalations")
    .insert({
      organisation_id: "6f1c2a3e-0000-4000-8000-000000000001",
      response_id: seeded!.id,
      source: "keyword",
      category: "wage_or_legal",
      created_at: "2026-10-14T02:00:00Z",
    })
    .select("id")
    .single();
  if (error) throw error;
  const close = await hrRequest(`/api/hr/escalations/${escalation!.id}/close`, "POST", { not_serious: true });
  assert.equal(close.status, 200);

  const res = await hrRequest("/api/hr/quality/languages", "GET");
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), [
    { language: "en", evaluation: "Evaluated", false_alarms: 2, sent_to_review_share: 1 / 16 },
    { language: "ms", evaluation: "Not evaluated", false_alarms: 0, sent_to_review_share: 0 },
    { language: "zh", evaluation: "Not evaluated", false_alarms: 0, sent_to_review_share: 0 },
  ]);
});
