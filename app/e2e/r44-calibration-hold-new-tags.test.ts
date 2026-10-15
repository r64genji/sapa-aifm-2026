import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { before, test } from "node:test";
import { appUrl, classifierTag, db, freezeClock, hrRequest, hrToken, joined, link, resetDemo, say, scriptModel, tap } from "./helpers.ts";

const en = JSON.parse(readFileSync(new URL("../data/packs/en.json", import.meta.url), "utf8"));
const organisation = "6f1c2a3e-0000-4000-8000-000000000001";
const live = 5550000201;
const second = 5550004401;
const reply = "Boss bagi 3 task semua urgent, tak tahu mana nak buat dulu";

async function seedWaiting(language: string, driver: string, count: number) {
  const { data: person } = await db.from("people").select("id").eq("synthetic", true).limit(1).single();
  const created_at = "2026-10-15T01:00:00Z";
  const { data: responses, error } = await db
    .from("responses")
    .insert(
      Array.from({ length: count }, () => ({
        organisation_id: organisation,
        person_id: person!.id,
        question_id: "UNPROMPTED",
        language,
        kind: "unprompted",
        created_at,
      })),
    )
    .select("id");
  if (error) throw error;
  const ids = responses!.map((r) => r.id as string);
  const { error: tagError } = await db.from("ai_tags").insert(
    ids.map((response_id) => ({
      organisation_id: organisation,
      response_id,
      status: "ok",
      drivers: [driver],
      context_tags: [],
      escalate: false,
      counted: false,
      created_at,
    })),
  );
  if (tagError) throw tagError;
  return ids;
}

const review = (id: string, change: boolean) =>
  hrRequest(`/api/hr/replies/${id}/review`, "POST", change ? { drivers: ["WORKLOAD"] } : undefined);
const state = async (driver: string, language: string) =>
  ((await (await hrRequest("/api/hr/quality", "GET")).json()) as { driver: string; language: string; state: string }[]).find(
    (row) => row.driver === driver && row.language === language,
  )!.state;
const roleClarity = async () =>
  (await (await hrRequest("/api/hr/themes", "GET")).json()).cards.find((c: { driver: string }) => c.driver === "ROLE_CLARITY");
const counted = async (chat: number) => {
  const { data: who } = await db.from("people").select("id").eq("telegram_chat_id", chat).single();
  const { data: response } = await db.from("responses").select("id").eq("person_id", who!.id).eq("question_id", "OPEN").single();
  return (await db.from("ai_tags").select("status, counted").eq("response_id", response!.id).single()).data;
};

before(async () => {
  await resetDemo();
  await freezeClock("2026-10-15T15:00:00.000Z");
});

test("R44: a new driver and language waits for HR until 20 spot checks with at most 10% changed", async () => {
  const belonging = await seedWaiting("ms", "BELONGING", 20);
  for (const [index, id] of belonging.entries()) assert.equal((await review(id, index < 3)).status, 200);
  assert.equal(await state("BELONGING", "ms"), "calibrating");

  const roleClarityTags = await seedWaiting("en", "ROLE_CLARITY", 17);
  for (const [index, id] of roleClarityTags.slice(0, 16).entries()) assert.equal((await review(id, index < 2)).status, 200);
  assert.equal(await state("ROLE_CLARITY", "en"), "calibrating");
  assert.equal((await review(roleClarityTags[16], false)).status, 200);
  assert.equal(await state("ROLE_CLARITY", "en"), "trusted");
});

test("R44: once calibrated, a new AI-confident tag counts without review, and the hold-new-tags setting (HR admin only) holds it", async () => {
  await link(live, "live-hire-invite");
  await tap(live, "English");
  await tap(live, en.agree);
  await joined(second, "2026-10-02");
  assert.equal((await hrRequest("/api/hr/demo/advance", "POST", { day: 14 })).status, 200);
  const before = await roleClarity();
  assert.deepEqual([before.n, before.m, before.note], [7, 18, null]);

  assert.equal((await hrRequest("/api/hr/settings/hold-new-tags", "PUT", { value: true })).status, 403);
  const admin = (value: boolean) =>
    hrToken("admin@contoh.test").then((token) =>
      fetch(`${appUrl}/api/hr/settings/hold-new-tags`, {
        method: "PUT",
        headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
        body: JSON.stringify({ value }),
      }),
    );
  assert.equal((await admin(true)).status, 200);
  for (const answer of ["4", "3", "5"]) await tap(live, answer);
  await scriptModel("omniroute", [{ kind: "json", content: classifierTag() }]);
  await say(live, reply);
  assert.deepEqual(await counted(live), { status: "ok", counted: false });
  const held = await roleClarity();
  assert.deepEqual([held.n, held.m], [7, 18]);

  assert.equal((await admin(false)).status, 200);
  for (const answer of ["4", "3", "5"]) await tap(second, answer);
  await scriptModel("omniroute", [{ kind: "json", content: classifierTag() }]);
  await say(second, reply);
  assert.deepEqual(await counted(second), { status: "ok", counted: true });
  const moved = await roleClarity();
  assert.deepEqual([moved.n, moved.m, moved.reviewed, moved.ai_confident], [8, 19, 5, 3]);
});
