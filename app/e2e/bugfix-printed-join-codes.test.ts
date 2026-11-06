import assert from "node:assert/strict";
import { before, test } from "node:test";
import { appUrl, hrToken, resetDemo } from "./helpers.ts";

before(async () => {
  await resetDemo();
});

test("Bug fix: a full reset shows the printed join code 8UMXtBs24oGqmuk1xQljl7 for Accounts Payable Asia", async () => {
  const res = await fetch(`${appUrl}/api/hr/demo/reset`, {
    method: "POST",
    headers: { authorization: `Bearer ${await hrToken("admin@contoh.test")}`, "content-type": "application/json" },
    body: JSON.stringify({ full: true }),
  });
  assert.equal(res.status, 200);
  const { team_links } = await res.json();
  const link = team_links.find((row: { team: string }) => row.team === "Accounts Payable Asia").link;
  assert.equal(String(link).split("?start=")[1], "8UMXtBs24oGqmuk1xQljl7");
});
