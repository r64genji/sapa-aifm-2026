import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { before, test } from "node:test";
import { appUrl, freezeClock, hrRequest, hrToken, joined, resetDemo } from "./helpers.ts";

const exported = 5550004700;
const people: { code_name: string; team: string }[] = JSON.parse(readFileSync(new URL("../data/seed/people.json", import.meta.url), "utf8"));

before(async () => {
  await resetDemo();
  await freezeClock("2026-10-15T03:00:00.000Z");
  await joined(exported, "2026-10-02");
});

const teamNames = [...new Set(people.map((p) => p.team))];
const managerNames = ["Raj"];

function sideBySide(value: unknown, labels: string[]): string[] {
  if (Array.isArray(value)) {
    const grouped = new Set<string>();
    for (const row of value) {
      if (typeof row !== "object" || row === null) continue;
      const label = Object.values(row).find((v) => typeof v === "string" && labels.includes(v));
      if (label && Object.values(row).some((v) => typeof v === "number")) grouped.add(label as string);
    }
    return [...(grouped.size > 1 ? [`array groups ${[...grouped].join(", ")}`] : []), ...value.flatMap((row) => sideBySide(row, labels))];
  }
  if (typeof value === "object" && value !== null) {
    const entries = Object.entries(value);
    const keyed = entries.filter(([key]) => labels.includes(key));
    return [...(keyed.length > 1 ? [`object keys ${keyed.map(([key]) => key).join(", ")}`] : []), ...entries.flatMap(([, v]) => sideBySide(v, labels))];
  }
  return [];
}

test("R51: no HR or export endpoint returns teams or managers side by side", async () => {
  const admin = await hrToken("admin@contoh.test");
  const post = (path: string, body: Record<string, unknown>) =>
    fetch(`${appUrl}${path}`, { method: "POST", headers: { authorization: `Bearer ${admin}`, "content-type": "application/json" }, body: JSON.stringify(body) });
  const bodies: [string, unknown][] = [];
  for (const path of [
    "/api/hr/themes",
    "/api/hr/impact",
    "/api/hr/milestones",
    "/api/hr/quality",
    "/api/hr/queue",
    "/api/hr/hires",
    "/api/hr/actions",
    "/api/hr/escalations",
    "/api/hr/replies",
    "/api/hr/questions",
  ]) {
    const res = await hrRequest(path, "GET");
    assert.equal(res.status, 200, path);
    bodies.push([path, await res.json()]);
  }
  const person = await post("/api/hr/exports", { code_name: `Hire ${exported}`, reason: "Subject access request" });
  assert.equal(person.status, 200);
  bodies.push(["person export", await person.json()]);

  for (const [path, body] of bodies) {
    assert.ok(path === "/api/hr/milestones" || JSON.stringify(body).length > 2, `${path} returned an empty body`);
    assert.deepEqual(sideBySide(body, teamNames), [], path);
    assert.deepEqual(sideBySide(body, managerNames), [], path);
  }
});

test("R51: a manager's snapshots hold one team, not teams side by side", async () => {
  const res = await fetch(`${appUrl}/api/manager/snapshots`, { headers: { authorization: `Bearer ${await hrToken("raj@contoh.test")}` } });
  assert.equal(res.status, 200);
  const rows = (await res.json()) as { team: string }[];
  assert.ok(rows.length > 0);
  assert.equal(new Set(rows.map((row) => row.team)).size, 1);
});

test("R51: HR can open the themes of one chosen team, and the Korean desk reads Not enough people yet (3 of 5 needed)", async () => {
  const res = await hrRequest("/api/hr/themes?team=Korean%20Desk", "GET");
  assert.equal(res.status, 200);
  const message = "Not enough people yet (3 of 5 needed)";
  assert.deepEqual((await res.json()).cards, [
    { driver: "ROLE_CLARITY", enough: false, message },
    { driver: "MANAGER_SUPPORT", enough: false, message },
    { driver: "BELONGING", enough: false, message },
    { driver: "ONBOARDING", enough: false, message },
    { driver: "TRAINING", enough: false, message },
    { driver: "WORKLOAD", enough: false, message },
  ]);
});
