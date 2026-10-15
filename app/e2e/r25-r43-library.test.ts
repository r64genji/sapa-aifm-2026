import assert from "node:assert/strict";
import { before, test } from "node:test";
import { db, freezeClock, hrRequest, resetDemo, scriptModel } from "./helpers.ts";

const seeded = "6f1c2a3e-0000-4000-8000-000000000401";
const notes = { en: "Mentors will meet you weekly.", ms: "Mentor akan berjumpa anda setiap minggu.", zh: "导师每周会见你。" };
const list = async () =>
  (await (await hrRequest("/api/hr/actions/library?driver=ROLE_CLARITY", "GET")).json()) as {
    id: string;
    title: string;
    text: string;
    result: string;
  }[];
const newDraft = async () => {
  await scriptModel("omniroute", [
    { kind: "json", content: { library_entry_id: seeded, reason: "Fits.", title: "Priorities", steps: "Talk weekly.", notes } },
  ]);
  const res = await hrRequest("/api/hr/actions", "POST", { driver: "ROLE_CLARITY" });
  assert.equal(res.status, 201);
  return (await res.json()).id as string;
};

before(async () => {
  await resetDemo();
  await freezeClock("2026-10-15T15:00:00.000Z");
});

test("R43, R25: a fix sent with Add your own fix is listed in the library, can be picked for a new draft, and each change writes an audit row", async () => {
  const first = await newDraft();
  await scriptModel("omniroute", [
    { kind: "json", content: { steps: "Raj pairs each new hire with a mentor.", notes } },
  ]);
  const drafted = await hrRequest(`/api/hr/actions/${first}/own-fix`, "POST", { name: "Weekly 1:1 with a mentor" });
  assert.equal(drafted.status, 200);
  assert.deepEqual(await drafted.json(), { id: first, title: "Weekly 1:1 with a mentor", steps: "Raj pairs each new hire with a mentor.", notes });
  assert.equal((await list()).some((entry) => entry.title === "Weekly 1:1 with a mentor"), false);

  assert.equal((await hrRequest(`/api/hr/actions/${first}`, "PATCH", { scope: { type: "team", team: "Accounts Payable Asia" } })).status, 200);
  assert.equal((await hrRequest(`/api/hr/actions/${first}/notice`, "POST", { no_notice_reason: "Not needed" })).status, 200);
  assert.equal((await hrRequest(`/api/hr/actions/${first}/assign`, "POST", { owner: "hr" })).status, 200);

  const added = (await list()).find((entry) => entry.title === "Weekly 1:1 with a mentor")!;
  assert.equal(added.text, "Raj pairs each new hire with a mentor.");
  assert.equal(added.result, "New · no result yet");
  assert.equal((await list()).find((entry) => entry.id === seeded)!.result, "Not used here yet");

  const second = await newDraft();
  assert.equal((await hrRequest(`/api/hr/actions/${second}`, "PATCH", { library_entry_id: added.id, steps: added.text })).status, 200);
  const { data: row } = await db.from("actions").select("library_entry_id, steps").eq("id", second).single();
  assert.deepEqual(row, { library_entry_id: added.id, steps: "Raj pairs each new hire with a mentor." });

  assert.equal((await hrRequest(`/api/hr/actions/library/${added.id}`, "DELETE")).status, 200);
  assert.equal((await list()).some((entry) => entry.id === added.id), false);
  assert.equal((await hrRequest(`/api/hr/actions/library/${added.id}/restore`, "POST")).status, 200);
  assert.equal((await list()).some((entry) => entry.id === added.id), true);

  const { data: audits } = await db
    .from("audit_log")
    .select("action, target")
    .in("action", ["draft_own_fix", "add_library_entry", "delete_library_entry", "restore_library_entry"])
    .order("at");
  assert.deepEqual(audits!.map((row) => row.action).sort(), ["add_library_entry", "delete_library_entry", "draft_own_fix", "restore_library_entry"]);
  assert.equal(audits!.find((row) => row.action === "add_library_entry")!.target, added.id);
});
