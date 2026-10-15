import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { before, test } from "node:test";
import { addHire, appUrl, db, freezeClock, hrRequest, hrToken, joined, resetDemo, say, tap } from "./helpers.ts";

const en = JSON.parse(readFileSync(new URL("../data/packs/en.json", import.meta.url), "utf8"));
const organisation = "6f1c2a3e-0000-4000-8000-000000000001";
const trend = "This shows a trend, not proof that Sapa caused it";
const mondays = ["2026-10-19", "2026-10-26", "2026-11-02", "2026-11-09"];

async function seedTags(language: string, driver: string, count: number, counted: boolean) {
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
      counted,
      created_at,
    })),
  );
  if (tagError) throw tagError;
  return ids;
}

const impact = async () => (await (await hrRequest("/api/hr/impact", "GET")).json()).retention;
const nightly = () =>
  fetch(`${appUrl}/api/nightly`, { method: "POST", headers: { authorization: `Bearer ${process.env.DISPATCH_SECRET}` } });
const review = (id: string, drivers?: string[]) =>
  hrRequest(`/api/hr/replies/${id}/review`, "POST", drivers ? { drivers } : undefined);
type Panel = {
  driver: string;
  language: string;
  state: string;
  reason: string | null;
  spot_checks: number;
  changed: number;
  changed_share: number | null;
  challenges: number;
};
const panel = async (driver: string, language: string) =>
  ((await (await hrRequest("/api/hr/quality", "GET")).json()) as Panel[]).find(
    (row) => row.driver === driver && row.language === language,
  )!;
const spotChecked = async (ids: string[]) => {
  const { data } = await db.from("ai_tags").select("response_id").in("response_id", ids).not("spot_check_at", "is", null);
  return data!.map((row) => row.response_id as string);
};

before(async () => {
  await resetDemo();
  await freezeClock("2026-10-15T03:00:00.000Z");
});

test("R42: the seed shows 26 of 31 against the usual 4 of 5, with the trend line, and only an HR admin sets the baseline", async () => {
  assert.deepEqual(await impact(), {
    enough: true,
    k: 26,
    n: 31,
    text: "26 of 31 still employed at Month 6, against a usual 4 of 5",
    note: trend,
  });
  assert.equal((await hrRequest("/api/hr/settings/retention-baseline", "PUT", { kept: 3, of: 5 })).status, 403);
  const admin = await fetch(`${appUrl}/api/hr/settings/retention-baseline`, {
    method: "PUT",
    headers: { authorization: `Bearer ${await hrToken("admin@contoh.test")}`, "content-type": "application/json" },
    body: JSON.stringify({ kept: 3, of: 5 }),
  });
  assert.equal(admin.status, 200);
  assert.equal((await impact()).text, "26 of 31 still employed at Month 6, against a usual 3 of 5");
});

test("R42: a confirmed DELETE leaves the retention figure unchanged", async () => {
  const before = await impact();
  const chat = 5550004201;
  await joined(chat, "2026-10-02");
  await say(chat, "DELETE");
  await tap(chat, en.delete.yes);
  const { data } = await db.from("people").select("telegram_chat_id").eq("code_name", `Hire ${chat}`).single();
  assert.equal(data!.telegram_chat_id, null);
  assert.deepEqual(await impact(), before);
});

test("R42: a pool under 30 says Too few to tell yet, and HR can only enter an intake that has passed Month 6", async () => {
  assert.equal((await hrRequest("/api/hr/intake-outcomes", "PUT", { intake: "2026-03", hired: 1, employed: 2 })).status, 400);
  assert.equal((await hrRequest("/api/hr/intake-outcomes", "PUT", { intake: "2026-04", hired: 5, employed: 4 })).status, 409);
  assert.equal((await hrRequest("/api/hr/intake-outcomes", "PUT", { intake: "2026-03", hired: 1, employed: 1 })).status, 200);
  assert.deepEqual(await impact(), { enough: false, message: "Too few to tell yet (21 of 30)", note: trend });
  assert.equal(
    (await hrRequest("/api/hr/intake-outcomes", "PUT", { intake: "2026-03", agency: "Maju Staffing", hired: 9, employed: 9 })).status,
    200,
  );
  assert.equal((await impact()).enough, true);
  assert.equal((await impact()).n, 30);
});

test("R44: each Monday the nightly job queues 3 AI-confident tags per driver and language as Spot check, once", async () => {
  const ms = await seedTags("ms", "ROLE_CLARITY", 15, true);
  const zh = await seedTags("zh", "ROLE_CLARITY", 15, true);
  await db.from("quality_holds").insert(
    ["ms", "zh"].map((language) => ({
      organisation_id: organisation,
      driver: "ROLE_CLARITY",
      language,
      state: "trusted",
      started_at: "2026-10-01T01:00:00Z",
    })),
  );
  await freezeClock(`${mondays[0]}T03:00:00.000Z`);
  assert.equal((await nightly()).status, 200);
  assert.equal((await spotChecked(ms)).length, 3);
  assert.equal((await spotChecked(zh)).length, 3);
  assert.equal((await nightly()).status, 200);
  assert.equal((await spotChecked(ms)).length, 3);

  const queue = await (await hrRequest("/api/hr/queue", "GET")).json();
  const waiting = queue.filter((entry: { id: string; note: string | null }) => ms.includes(entry.id) && entry.note === "Spot check");
  assert.deepEqual(waiting.map((entry: { id: string }) => entry.id).sort(), (await spotChecked(ms)).sort());
});

test("R44: HR changing 3 of 10 ROLE_CLARITY spot checks in one language holds that language, says why, and leaves the other language alone", async () => {
  const { data: all } = await db.from("responses").select("id, language").eq("kind", "unprompted");
  const ms = all!.filter((r) => r.language === "ms").map((r) => r.id as string);
  const zh = all!.filter((r) => r.language === "zh").map((r) => r.id as string);
  const reviewed: string[] = [];
  for (const [week, monday] of mondays.entries()) {
    await freezeClock(`${monday}T03:00:00.000Z`);
    assert.equal((await nightly()).status, 200);
    const queue = await (await hrRequest("/api/hr/queue", "GET")).json();
    const sampled = queue
      .filter((entry: { id: string; note: string | null }) => ms.includes(entry.id) && entry.note === "Spot check")
      .map((entry: { id: string }) => entry.id as string);
    assert.equal(sampled.length, 3);
    for (const [index, id] of sampled.slice(0, week === 3 ? 1 : 3).entries()) {
      assert.equal((await review(id, index === 0 && week < 3 ? ["BELONGING"] : undefined)).status, 200);
      reviewed.push(id);
    }
    if (week < 3) assert.equal((await panel("ROLE_CLARITY", "ms")).state, "trusted");
  }
  assert.equal(reviewed.length, 10);

  const held = await panel("ROLE_CLARITY", "ms");
  assert.deepEqual(
    { state: held.state, reason: held.reason, spot_checks: held.spot_checks, changed: held.changed, share: held.changed_share },
    { state: "held", reason: "HR changed 3 of 10 spot checks, more than 20%", spot_checks: 10, changed: 3, share: 0.3 },
  );
  const { data: msTags } = await db.from("ai_tags").select("status, counted").in("response_id", ms).eq("status", "ok");
  assert.ok(msTags!.length > 0 && msTags!.every((tag) => tag.counted === false));
  const { data: zhTags } = await db.from("ai_tags").select("status, counted").in("response_id", zh);
  assert.ok(zhTags!.length === 15 && zhTags!.every((tag) => tag.counted === true));
  assert.equal((await panel("ROLE_CLARITY", "zh")).state, "trusted");

  const themes = await (await hrRequest("/api/hr/themes", "GET")).json();
  const card = themes.cards.find((c: { driver: string }) => c.driver === "ROLE_CLARITY");
  assert.deepEqual(card.held, [{ language: "ms", reason: "HR changed 3 of 10 spot checks, more than 20%" }]);

  const queue = await (await hrRequest("/api/hr/queue", "GET")).json();
  const heldEntry = queue.find((entry: { id: string }) => ms.includes(entry.id) && !reviewed.includes(entry.id));
  assert.equal(heldEntry.note, "HR changed 3 of 10 spot checks, more than 20%");

  await db.from("ai_tags").update({ challenged_at: `${mondays[3]}T01:00:00Z` }).eq("response_id", zh[0]);
  assert.equal((await panel("ROLE_CLARITY", "zh")).challenges, 1);
});

test("R42: an intake of 5 shows its response rate with lapsed check-ins counted, and its score change against other teams from the seeded fix", async () => {
  const statuses = ["answered", "answered", "answered", "skipped", "reminded"];
  for (const [index, status] of statuses.entries()) {
    assert.equal((await addHire({ code_name: `April hire ${index}`, start_date: "2026-04-06" })).status, 201);
    const { data: person } = await db.from("people").select("id").eq("code_name", `April hire ${index}`).single();
    const { error } = await db
      .from("checkin_schedule")
      .upsert({ organisation_id: organisation, person_id: person!.id, touchpoint: 3, due_at: "2026-04-09T01:00:00Z", status }, { onConflict: "person_id,touchpoint" });
    if (error) throw error;
  }
  const { intakes } = await (await hrRequest("/api/hr/impact", "GET")).json();
  assert.deepEqual(intakes.find((row: { intake: string }) => row.intake === "2026-04"), {
    intake: "2026-04",
    enough: true,
    response_rate: 0.6,
    median_days_reply_to_done: 11,
    score_change_against_others: 1.2,
  });
});
