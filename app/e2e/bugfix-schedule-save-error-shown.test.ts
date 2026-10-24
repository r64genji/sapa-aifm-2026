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

test("Bug fix: a schedule the server refuses shows HR why, instead of only 'not saved'", async () => {
  await page.goto(`${appUrl}/schedule`);
  const newHire = page.getByRole("region", { name: "New hire" });
  await newHire.getByRole("checkbox", { name: "Workload" }).waitFor();
  for (const box of await newHire.getByRole("checkbox").all()) await box.uncheck();
  await page.getByRole("button", { name: "Save schedule" }).click();
  await assert.doesNotReject(
    page.getByRole("alert").filter({ hasText: "Each track needs a name, at least one day and one question, and no day can be in both tracks" }).waitFor({ timeout: 5000 }),
  );
});
