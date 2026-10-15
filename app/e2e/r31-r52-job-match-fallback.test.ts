import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { before, test } from "node:test";
import {
  appUrl,
  dispatch,
  freezeClock,
  hrRequest,
  hrToken,
  joined,
  resetDemo,
  say,
  scriptModel,
  sentTo,
  settle,
  telegramCalls,
} from "./helpers.ts";

const en = JSON.parse(readFileSync(new URL("../data/packs/en.json", import.meta.url), "utf8"));
const [organisation] = JSON.parse(readFileSync(new URL("../data/seed/organisations.json", import.meta.url), "utf8"));
const raj = "6f1c2a3e-0000-4000-8000-000000000101";
const asker = 5550001601;

type Card = { role: string; enough: boolean; n?: number; m?: number; label?: string; message?: string };

async function cards() {
  const res = await hrRequest("/api/hr/job-match", "GET");
  assert.equal(res.status, 200);
  return ((await res.json()) as { cards: Card[] }).cards;
}

async function board() {
  return (await (await hrRequest("/api/hr/actions", "GET")).json()) as Record<string, unknown>[];
}

before(async () => {
  await resetDemo();
  await freezeClock("2026-10-15T15:00:00.000Z");
  await joined(asker, "2026-10-14");
});

test("R52: the seeded Accounts payable analyst card reads 12 of 26 said 'not really' at Day 14", async () => {
  const card = (await cards()).find((c) => c.role === "Accounts payable analyst")!;
  assert.deepEqual(card, {
    role: "Accounts payable analyst",
    enough: true,
    n: 12,
    m: 26,
    label: "Accounts payable analyst: 12 of 26 said 'not really' at Day 14",
  });
});

test("R52: the Accounts payable analyst card counts the 'not really' answers out of those who answered", async () => {
  const card = (await cards()).find((c) => c.role === "Accounts payable analyst")!;
  assert.equal(card.enough, true);
  assert.equal(card.label, `Accounts payable analyst: ${card.n} of ${card.m} said 'not really' at Day 14`);
  assert.ok(card.n! > 0 && card.n! < card.m!);
});

test("R52: a role with fewer than 5 people shows 'Not enough people yet' and no count", async () => {
  const all = await cards();
  assert.deepEqual(
    all.filter((c) => c.role !== "Accounts payable analyst").map((c) => [c.role, c.enough, c.message]),
    [
      ["AP analyst (German)", false, "Not enough people yet (1 of 5 needed)"],
      ["AP analyst (Mandarin)", false, "Not enough people yet (1 of 5 needed)"],
      ["AP analyst (Thai)", false, "Not enough people yet (1 of 5 needed)"],
      ["AP analyst (Vietnamese)", false, "Not enough people yet (2 of 5 needed)"],
      ["Billing analyst", false, "Not enough people yet (2 of 5 needed)"],
      ["Collections analyst", false, "Not enough people yet (3 of 5 needed)"],
      ["Customer care agent (Japanese)", false, "Not enough people yet (4 of 5 needed)"],
      ["Customer care agent (Korean)", false, "Not enough people yet (3 of 5 needed)"],
      ["Customer care agent (Thai)", false, "Not enough people yet (2 of 5 needed)"],
      ["General ledger accountant", false, "Not enough people yet (3 of 5 needed)"],
      ["IT service desk analyst", false, "Not enough people yet (4 of 5 needed)"],
      ["IT service desk analyst (Europe shift)", false, "Not enough people yet (3 of 5 needed)"],
      ["IT service desk analyst (German)", false, "Not enough people yet (2 of 5 needed)"],
      ["Order-to-Cash analyst", false, "Not enough people yet (4 of 5 needed)"],
      ["Reconciliations analyst", false, "Not enough people yet (3 of 5 needed)"],
    ],
  );
  const refused = await hrRequest("/api/hr/job-match/actions", "POST", { role: "IT service desk analyst" });
  assert.equal(refused.status, 422);
  assert.equal(((await refused.json()) as { error: string }).error, "Not enough people yet (4 of 5 needed)");
});

test("R52: a manager is refused on the card and on drafting from it", async () => {
  const headers = { authorization: `Bearer ${await hrToken("raj@contoh.test")}`, "content-type": "application/json" };
  assert.equal((await fetch(`${appUrl}/api/hr/job-match`, { headers })).status, 401);
  const draft = await fetch(`${appUrl}/api/hr/job-match/actions`, {
    method: "POST",
    headers,
    body: JSON.stringify({ role: "Accounts payable analyst" }),
  });
  assert.equal(draft.status, 401);
});

test("R52, R28: the hiring-side action stays with HR, names nobody and completing it sends no notice", async () => {
  const res = await hrRequest("/api/hr/job-match/actions", "POST", { role: "Accounts payable analyst" });
  assert.equal(res.status, 201);
  const { id } = (await res.json()) as { id: string };

  const drafted = (await board()).find((a) => a.id === id)!;
  assert.equal(drafted.title, "Update the job ad and the interview script for this role (Accounts payable analyst)");
  assert.equal(drafted.hiring_side, true);
  assert.equal(drafted.status, "draft");

  const toManager = await hrRequest(`/api/hr/actions/${id}/assign`, "POST", { owner: { manager_id: raj } });
  assert.equal(toManager.status, 422);
  const named = await hrRequest(`/api/hr/actions/${id}`, "PATCH", { scope: { type: "person", code_name: "Live hire" } });
  assert.equal(named.status, 422);
  const team = await hrRequest(`/api/hr/actions/${id}`, "PATCH", { scope: { type: "team", team: "Accounts Payable Asia" } });
  assert.equal(team.status, 422);
  assert.equal((await board()).find((a) => a.id === id)!.status, "draft");

  const assigned = await hrRequest(`/api/hr/actions/${id}/assign`, "POST", { owner: "hr", due_in_days: 14 });
  assert.equal(assigned.status, 200);
  assert.equal((await board()).find((a) => a.id === id)!.owner, "HR");

  assert.equal((await hrRequest(`/api/hr/actions/${id}/accept`, "POST")).status, 200);
  const sentBefore = (await telegramCalls("sendMessage")).length;
  const done = await hrRequest(`/api/hr/actions/${id}/done`, "POST", { outcome: "New job ad published." });
  assert.equal(done.status, 200);
  assert.equal((await board()).find((a) => a.id === id)!.status, "done");
  await dispatch();
  await settle(1500);
  assert.equal((await telegramCalls("sendMessage")).length, sentBefore);
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
  for (let i = 0; i < 60 && (await sentTo(asker)).length === before; i++) await settle(500);
  await settle(300);
  const replies = (await sentTo(asker)).slice(before).map((m) => String(m.text));
  assert.deepEqual(replies, [
    [
      en.qa.label,
      "Letakkan kereta anda di Lot B dengan pas daripada HR.",
      `${en.qa.from} "${quote}" (facilities/parking.md)`,
      `${en.qa.hr} ${organisation.escalation_contacts.general[0]}`,
      "This answer is in Bahasa Malaysia. Ask HR if it is not clear.",
    ].join("\n"),
  ]);
});
