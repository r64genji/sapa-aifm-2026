import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { after, before, test } from "node:test";
import { chromium, type Browser, type Page } from "playwright-core";
import { appUrl, classifierTag, dispatch, freezeClock, hrRequest, hrToken, link, liveInvite, resetDemo, say, scriptModel, sentTo, tap, tapScore } from "./helpers.ts";

const en = JSON.parse(readFileSync(new URL("../data/packs/en.json", import.meta.url), "utf8"));
const question = (id: string) => en.checkin.questions.find((q: { id: string }) => q.id === id).text;
const live = 5550000301;
const reply = "Boss bagi 3 task semua urgent, tak tahu mana nak buat dulu";
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
  await say(live, "Test Hire");
  browser = await chromium.launch();
  page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(`${appUrl}/auth/login`);
  await page.waitForURL(`${appUrl}/`);
});

after(async () => {
  await browser?.close();
});

test("Demo beat 1: Outreach now sends the live hire the Day 14 check-in", async () => {
  await page.getByLabel("Check-in to send").selectOption("14");
  await page.getByRole("button", { name: "Outreach now" }).click();
  await page.getByText("1 message sent.").waitFor();
  assert.ok((await texts()).includes(question("ROLE_CLARITY")));
});

test("Demo beat 2: the reply moves the card to 24 of 65, and Confirm label marks it reviewed", async () => {
  for (const answer of [4, 3, 5, 3, 3, 3, 3]) await tapScore(live, answer);
  await scriptModel("omniroute", [{ kind: "json", content: classifierTag() }]);
  await say(live, reply);

  await page.goto(`${appUrl}/`);
  await page.getByText("24 of 65 who answered at Day 14").first().waitFor();
  assert.equal(await topCard().textContent(), "24 of 65 who answered at Day 14");
  await page.locator(".sp-row", { hasText: reply }).getByRole("button", { name: "Confirm label" }).click();
  await page.getByText("17 checked by HR, 7 labelled by the AI").waitFor();
});

test("Demo beat 3: Draft a fix from the Role clarity card, for Raj's team, and send it", async () => {
  await page.getByRole("link", { name: "Draft a fix" }).click();
  await page.getByText("Used 3 times here").first().waitFor();
  await page.fill("#fix-title", "Weekly priority list");
  for (const [tab, lang] of [["English", "en"], ["Bahasa Malaysia", "ms"], ["中文", "zh"]] as const) {
    await page.getByRole("button", { name: tab, exact: true }).click();
    await page.fill("#fix-note", note[lang]);
  }
  await page.locator("#f-for").click();
  await page.getByRole("option", { name: /Accounts Payable Asia/ }).click();
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
  await page.getByLabel("Check-in to send").selectOption("30");
  await page.getByRole("button", { name: "Outreach now" }).click();
  await page.getByText("1 message sent.").waitFor();
  const sent = (await texts()).slice(before);
  assert.equal(sent[1], question("ROLE_CLARITY"));
});

test("Demo beat 6: the Fixes and impact page shows 80 of 99 still here after 6 months", async () => {
  await page.goto(`${appUrl}/fixes`);
  await page.getByText(/80 of 99 still here after 6 months/).first().waitFor();
});

test("Every demo page loads at 390 px with no sideways scroll", async () => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const path of ["/", "/concerns", "/problems", "/problems/ROLE_CLARITY", "/fixes"]) {
    await page.goto(`${appUrl}${path}`);
    await page.waitForLoadState("networkidle");
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth), 0, path);
  }
});
