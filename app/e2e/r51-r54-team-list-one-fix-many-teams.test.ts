import assert from "node:assert/strict";
import { before, test } from "node:test";
import { appUrl, freezeClock, hrRequest, hrToken, link, resetDemo, sentTo } from "./helpers.ts";

const raj = "6f1c2a3e-0000-4000-8000-000000000101";
const huiLing = "6f1c2a3e-0000-4000-8000-000000000103";
const desks = [
  { id: "6f1c2a3e-0000-4000-8000-000000000104", name: "Aiko" },
  { id: "6f1c2a3e-0000-4000-8000-000000000105", name: "Ji-woo" },
  { id: "6f1c2a3e-0000-4000-8000-000000000108", name: "Nok" },
];
const [aishaChat, budiChat, chenChat] = [5550005401, 5550005402, 5550005403];
const notes = { en: "Team leads will hold a weekly check-in with new hires.", ms: "Ketua pasukan akan mengadakan sesi mingguan dengan pekerja baharu.", zh: "组长将每周与新员工见面一次。" };

const teams = async (driver: string, token?: string) =>
  token ? fetch(`${appUrl}/api/hr/themes/${driver}/teams`, { headers: { authorization: `Bearer ${token}` } }) : hrRequest(`/api/hr/themes/${driver}/teams`, "GET");

async function manager(name: string, chat: number, hires: string[]) {
  const invite = await (await hrRequest("/api/hr/managers", "POST", { display_name: name, email: `${name.toLowerCase()}-r54@contoh.test` })).json();
  await link(chat, String(invite.telegram_link).split("?start=")[1]);
  assert.equal((await hrRequest(`/api/hr/managers/${invite.manager_id}/hires`, "POST", { code_names: hires })).status, 200);
  return invite.manager_id as string;
}

before(async () => {
  await resetDemo();
  await freezeClock("2026-10-15T15:00:00.000Z");
});

test("R51: the team list holds only teams with 5 or more answers at least 2 above expected, in A-Z order, from the latest snapshot", async () => {
  const res = await teams("MANAGER_SUPPORT");
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), {
    enough: true,
    week: "2026-10-12",
    company: { n: 13, m: 64, avg: 3.5 },
    verdict: "some",
    rows: [{ kind: "team", name: "Accounts Payable Europe", teams: ["Accounts Payable Europe"], n: 7, m: 22, avg: 3.3, leads: [{ id: huiLing, name: "Hui Ling" }] }],
    eligible: 3,
    small: 2,
    safety: 0,
  });
  const clarity = await (await teams("ROLE_CLARITY")).json();
  assert.deepEqual([clarity.company, clarity.verdict, clarity.rows], [
    { n: 23, m: 64, avg: 3.1 },
    "some",
    [{ kind: "team", name: "Accounts Payable Asia", teams: ["Accounts Payable Asia"], n: 6, m: 9, avg: 2.4, leads: [{ id: raj, name: "Raj" }], times: 2 }],
  ]);
});

test("R51: teams under 5 in one tower pool into one tower row, listed by the same test", async () => {
  const belonging = await (await teams("BELONGING")).json();
  assert.deepEqual([belonging.company, belonging.rows], [
    { n: 7, m: 64, avg: 3.8 },
    [{ kind: "tower", name: "Customer care language desks", teams: ["Japanese Desk", "Korean Desk", "Thai Desk"], n: 3, m: 8, avg: 3.3, leads: desks }],
  ]);
});

test("R51: a team under 5 never appears alone, and a manager gets a refusal on the list", async () => {
  for (const driver of ["ROLE_CLARITY", "MANAGER_SUPPORT", "BELONGING", "ONBOARDING", "TRAINING", "WORKLOAD"]) {
    const body = await (await teams(driver)).json();
    for (const row of body.rows) assert.ok(!(row.kind === "team" && ["Japanese Desk", "Korean Desk", "Thai Desk", "Order-to-Cash Asia", "Record-to-Report"].includes(row.name)), `${driver} lists ${row.name}`);
  }
  assert.equal((await teams("MANAGER_SUPPORT", await hrToken("raj@contoh.test"))).status, 401);
});

test("R54: one fix goes to three teams as one action per team in one batch; a lead with fewer than 3 in-scope hires on a held fix is not sent", async () => {
  const aisha = await manager("Aisha", aishaChat, ["Syafiq R.", "Ravi R.", "Amir R."]);
  const budi = await manager("Budi", budiChat, ["Kavin R.", "Aisyah R.", "Daniel R."]);
  const chen = await manager("Chen", chenChat, ["Logesh R.", "Yasmin R."]);

  const draft = await hrRequest("/api/hr/actions", "POST", { driver: "MANAGER_SUPPORT" });
  assert.equal(draft.status, 201);
  const { id } = await draft.json();
  assert.equal((await hrRequest(`/api/hr/actions/${id}/notice`, "POST", { notes })).status, 200);

  const res = await hrRequest(`/api/hr/actions/${id}/batch`, "POST", {
    teams: [
      { team: "Japanese Desk", manager_id: aisha },
      { team: "IT Service Desk", manager_id: budi },
      { team: "Record-to-Report", manager_id: chen },
    ],
    due_in_days: 14,
  });
  assert.equal(res.status, 201);
  const body = await res.json();
  const byTeam = Object.fromEntries(body.sent.map((r: { team: string }) => [r.team, r]));
  assert.ok(byTeam["Japanese Desk"].id);
  assert.ok(byTeam["IT Service Desk"].id);
  assert.equal(byTeam["Record-to-Report"].id, undefined);
  assert.match(byTeam["Record-to-Report"].error, /fewer than 3 in-scope new hires/);

  const board = (await (await hrRequest("/api/hr/actions", "GET")).json()) as Record<string, unknown>[];
  const batch = board.filter((row) => row.batch_id === body.batch_id);
  assert.deepEqual(
    batch.map((row) => [row.scope_type, row.scope_team, row.owner, row.status]).sort(),
    [
      ["team", "IT Service Desk", "Budi", "assigned"],
      ["team", "Japanese Desk", "Aisha", "assigned"],
    ],
  );
  assert.equal(board.some((row) => row.id === id), false);

  const title = String(batch[0].title);
  const alerts = async (chat: number) => (await sentTo(chat)).filter((m) => String(m.text).includes(title)).map((m) => String(m.text));
  const [toAisha, toBudi, toChen] = [await alerts(aishaChat), await alerts(budiChat), await alerts(chenChat)];
  assert.equal(toAisha.length, 1);
  assert.equal(toBudi.length, 1);
  assert.equal(toChen.length, 0);
  assert.equal(toAisha[0].includes("IT Service Desk"), false);
  assert.equal(toBudi[0].includes("Japanese Desk"), false);
});
