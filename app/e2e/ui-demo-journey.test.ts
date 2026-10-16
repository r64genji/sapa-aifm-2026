import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { after, before, test } from "node:test";
import { chromium, type Browser, type Page } from "playwright-core";
import { appUrl, classifierTag, dispatch, freezeClock, hrRequest, hrToken, link, liveInvite, resetDemo, say, scriptModel, sentTo, settle, tap } from "./helpers.ts";

const en = JSON.parse(readFileSync(new URL("../data/packs/en.json", import.meta.url), "utf8"));
const question = (id: string) => en.checkin.questions.find((q: { id: string }) => q.id === id).text;
const live = 5550000301;
const reply = "Boss bagi 3 task semua urgent, tak tahu mana nak buat dulu";
const priorities = "6f1c2a3e-0000-4000-8000-000000000401";
const note = { en: "Your team now has a weekly priority list every Monday.", ms: "Pasukan anda kini ada senarai keutamaan setiap Isnin.", zh: "你的团队现在每周一都有优先事项清单。" };

let browser: Browser;
let page: Page;

const texts = async () => (await sentTo(live)).map((m) => String(m.text));
const topCard = () => page.locator("text=/\\d+ of \\d+ who answered at Day 14/").first();

before(async () => {
  await resetDemo();
  await freezeClock("2026-10-15T15:00:00.000Z");
  await link(live, liveInvite);
  await tap(live, "English");
  await tap(live, en.agree);
  browser = await chromium.launch();
  page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(`${appUrl}/auth/login`);
  await page.fill("#email", "admin@contoh.test");
  await page.fill("#password", process.env.SEED_USER_PASSWORD!);
  await page.click("button[type=submit]");
  await page.waitForURL(`${appUrl}/`);
});

after(async () => {
  await browser?.close();
});

test("Demo beat 1: Advance to Day 14 sends the live hire one check-in", async () => {
  await page.getByRole("button", { name: "Advance to Day 14" }).click();
  await page.getByText("Advanced to Day 14. 1 message sent.").waitFor();
  assert.ok((await texts()).includes(question("ROLE_CLARITY")));
});

test("Demo beat 2: the reply waits for HR at 23 of 64, and Confirm label moves the card to 24 of 65", async () => {
  for (const answer of ["4", "3", "5", "3", "3", "3"]) await tap(live, answer);
  await scriptModel("omniroute", [{ kind: "json", content: classifierTag() }]);
  await say(live, reply);
  await settle();

  await page.goto(`${appUrl}/`);
  await page.getByText("New labels wait for HR during calibration").first().waitFor();
  assert.equal(await topCard().textContent(), "23 of 64 who answered at Day 14");
  await page.locator(".sp-row", { hasText: reply }).getByRole("button", { name: "Confirm label" }).click();
  await page.getByText("24 of 65 who answered at Day 14").waitFor();
  assert.equal(await page.getByText("17 reviewed, 7 AI-confident").count(), 1);
});

test("Demo beat 3: Draft a fix from the Role clarity card, for Raj's team, and send it", async () => {
  await scriptModel("omniroute", [
    { kind: "json", content: { library_entry_id: priorities, reason: "Fits role clarity.", title: "Weekly priority list", steps: "Raj shares a written top-3 list every Monday.", notes: note } },
  ]);
  await page.getByRole("link", { name: "Draft a fix" }).click();
  await page.getByText("Used 3 times here").first().waitFor();
  await page.getByRole("button", { name: "Accept" }).click();
  const team = await page.locator("#f-for option", { hasText: "Raj" }).first().getAttribute("value");
  await page.selectOption("#f-for", team!);
  await page.getByRole("button", { name: /^Send/ }).click();
  await page.getByText("Sent. Raj has it on Telegram.").waitFor();
  await page.getByText("In real use this alert waits until Monday").waitFor();
});

test("Demo beats 4 and 5: Raj marks it done, the hire gets the update, and the Day 30 check-in opens with the neutral 1-5 question", async () => {
  const actions = (await (await hrRequest("/api/hr/actions", "GET")).json()) as { id: string; title: string }[];
  const fix = actions.find((a) => a.title === "Weekly priority list")!;
  const raj = { authorization: `Bearer ${await hrToken("raj@contoh.test")}`, "content-type": "application/json" };
  assert.equal((await fetch(`${appUrl}/api/manager/actions/${fix.id}/accept`, { method: "POST", headers: raj })).status, 200);
  assert.equal((await fetch(`${appUrl}/api/manager/actions/${fix.id}/done`, { method: "POST", headers: raj, body: JSON.stringify({ outcome: "Weekly priority list every Monday" }) })).status, 200);
  await dispatch();
  assert.ok((await texts()).some((t) => t.startsWith("Update from HR") && t.includes(note.en)));

  await page.goto(`${appUrl}/fixes/${fix.id}`);
  await page.getByText("Raj marked it done").waitFor();

  const before = (await texts()).length;
  await page.getByRole("button", { name: "Advance to Day 30" }).click();
  await page.getByText(/Advanced to Day 30/).waitFor();
  const sent = (await texts()).slice(before);
  assert.equal(sent[1], question("ROLE_CLARITY"));
});

test("Demo beat 6: the Impact page shows 80 of 99 still employed at Month 6", async () => {
  await page.goto(`${appUrl}/impact`);
  await page.getByText(/80 of 99 still employed at Month 6/).first().waitFor();
});

test("Every demo page loads at 390 px with no sideways scroll", async () => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const path of ["/", "/concerns", "/problems", "/problems/ROLE_CLARITY", "/replies", "/fixes", "/impact"]) {
    await page.goto(`${appUrl}${path}`);
    await page.waitForLoadState("networkidle");
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth), 0, path);
  }
});
