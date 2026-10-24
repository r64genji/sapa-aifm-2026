import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { chromium, type Browser, type Page } from "playwright-core";
import { appUrl, freezeClock, resetDemo } from "./helpers.ts";

let browser: Browser;
let page: Page;

before(async () => {
  await resetDemo();
  await freezeClock("2026-10-15T15:00:00.000Z");
  browser = await chromium.launch();
  page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(`${appUrl}/auth/login`);
  await page.waitForURL(`${appUrl}/`);
});

after(async () => {
  await browser.close();
});

test("Bug fix: an unsent draft opened from Home does not hide the best library fix from Draft fix for Raj", async () => {
  await page.goto(`${appUrl}/fixes/new?driver=ROLE_CLARITY`);
  await page.getByText("Priorities chat and written top-3 list").first().waitFor();
  await page.goto(`${appUrl}/problems/ROLE_CLARITY`);
  const fix = page.getByRole("radiogroup", { name: "Which fix" });
  await fix.waitFor();
  assert.equal(await fix.getByRole("radio", { checked: true }).locator("xpath=..").getByText("Priorities chat and written top-3 list").count(), 1);
});
