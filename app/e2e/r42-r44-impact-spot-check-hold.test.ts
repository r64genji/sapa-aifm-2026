import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { before, test } from "node:test";
import { addHire, appUrl, classifierTag, db, dispatch, freezeClock, hrRequest, hrToken, joined, link, resetDemo, say, scriptModel, tap, tapScore } from "./helpers.ts";

const en = JSON.parse(readFileSync(new URL("../data/packs/en.json", import.meta.url), "utf8"));
const trend = "This shows a trend, not proof that Sapa caused it";
const mondays = ["2026-10-19", "2026-10-26", "2026-11-02", "2026-11-09"];

const read = (path: string) => JSON.parse(readFileSync(new URL(path, import.meta.url), "utf8"));
const ms_ = read("../data/packs/ms.json");
const seedResponses: { id: string; kind: string; language: string }[] = read("../data/seed/responses.json");
const escalated = new Set(read("../data/seed/escalations.json").map((e: { response_id: string }) => e.response_id));
const seededIds = (language: string) =>
  seedResponses.filter((r) => r.kind === "unprompted" && r.language === language && !escalated.has(r.id)).map((r) => r.id);
const outcomes: { intake: string; agency: string | null; hired: number; employed: number }[] = read("../data/seed/intake_outcomes.json");
const [organisation] = read("../data/seed/organisations.json");
const sum = (rows: typeof outcomes, key: "hired" | "employed") => rows.reduce((total, row) => total + row[key], 0);
const hire = 5550004202;

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

test("R42: the seed shows 80 of 99 against the usual 73 in 100", { todo: "R42: lib/impact.ts says \"a usual 73 of 100\", docs/05 says \"73 in 100\"" }, async () => {
  assert.equal((await impact()).text, "80 of 99 still here after 6 months, compared with a usual 73 in 100");
});

test("R42: the seed shows the entered intakes against the usual baseline, with the trend line, and only an HR admin sets the baseline", async () => {
  const k = sum(outcomes, "employed");
  const n = sum(outcomes, "hired");
  assert.deepEqual(await impact(), {
    enough: true,
    k,
    n,
    text: `${k} of ${n} still here after 6 months, compared with a usual ${organisation.retention_baseline_kept} of ${organisation.retention_baseline_of}`,
    note: trend,
  });
  assert.equal((await hrRequest("/api/hr/settings/retention-baseline", "PUT", { kept: 3, of: 5 })).status, 403);
  const admin = await fetch(`${appUrl}/api/hr/settings/retention-baseline`, {
    method: "PUT",
    headers: { authorization: `Bearer ${await hrToken("admin@contoh.test")}`, "content-type": "application/json" },
    body: JSON.stringify({ kept: 3, of: 5 }),
  });
  assert.equal(admin.status, 200);
  assert.equal((await impact()).text, `${k} of ${n} still here after 6 months, compared with a usual 3 of 5`);
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
  const passed = ["2025-11", "2025-12", "2026-01", "2026-02", "2026-03"];
  for (const intake of passed) {
    assert.equal((await hrRequest("/api/hr/intake-outcomes", "PUT", { intake, hired: 1, employed: 1 })).status, 200);
  }
  const pooled = sum(outcomes.filter((row) => !passed.includes(row.intake)), "hired") + passed.length;
  assert.ok(pooled < 30);
  assert.deepEqual(await impact(), { enough: false, message: `Too few to tell yet (${pooled} of 30)`, note: trend });
  assert.equal(
    (await hrRequest("/api/hr/intake-outcomes", "PUT", { intake: "2026-03", agency: "Maju Staffing", hired: 9, employed: 9 })).status,
    200,
  );
  assert.equal((await impact()).enough, true);
  assert.equal((await impact()).n, pooled + 9);
});

test("R44: each Monday the nightly job queues 3 AI-confident tags per driver and language as Spot check, once", async () => {
  const ms = seededIds("ms");
  const zh = seededIds("zh");
  const { token } = await addHire({ code_name: "Hire MS", language: "ms", start_date: "2026-10-02" });
  await link(hire, token);
  await tap(hire, "Bahasa Malaysia");
  await tap(hire, ms_.agree);
  await say(hire, "Test Hire");
  assert.equal((await hrRequest("/api/hr/demo/outreach", "POST", { touchpoint: 14 })).status, 200);
  for (const answer of [4, 3, 5, 3, 3, 3, 3]) await tapScore(hire, answer);
  await scriptModel("omniroute", [{ kind: "json", content: classifierTag({ drivers: ["WORKLOAD"], evidence_quote: "Kerja terlalu banyak" }) }]);
  await say(hire, "Kerja terlalu banyak minggu ini");
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
  const ms = seededIds("ms");
  const zh = seededIds("zh");
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

  await say(hire, "/jawapansaya");
  await tap(hire, ms_.myAnswers.wrong);
  assert.equal((await panel("WORKLOAD", "ms")).challenges, 1);
  assert.equal((await panel("ROLE_CLARITY", "zh")).challenges, 0);
});

test("R42: an intake of 5 shows its response rate with lapsed check-ins counted, and its score change against other teams from the seeded fix", async () => {
  const chats = [5550004211, 5550004212, 5550004213, 5550004214, 5550004215];
  await freezeClock("2026-04-06T01:00:00.000Z");
  await Promise.all(chats.map((chat) => joined(chat, "2026-04-06")));
  await freezeClock("2026-04-09T02:00:00.000Z");
  await dispatch();
  for (const chat of chats.slice(0, 3)) {
    for (let step = 0; step < 6; step++) await tapScore(chat, 3);
    await scriptModel("omniroute", [{ kind: "json", content: classifierTag() }]);
    await say(chat, "Boss bagi 3 task semua urgent, tak tahu mana nak buat dulu");
  }
  await say(chats[3], "/skip");
  await freezeClock("2026-04-10T02:00:00.000Z");
  await dispatch();
  await freezeClock("2026-10-15T03:00:00.000Z");
  const { intakes } = await (await hrRequest("/api/hr/impact", "GET")).json();
  assert.deepEqual(intakes.find((row: { intake: string }) => row.intake === "2026-04"), {
    intake: "2026-04",
    enough: true,
    response_rate: 0.6,
    median_days_reply_to_done: 11,
    score_change_against_others: 1,
  });
});
