import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { chromium, type Browser, type Page } from "playwright-core";
import { appUrl, freezeClock, modelCalls, resetDemo, scriptModel, settle } from "./helpers.ts";

const translated = "I am not sure which suppliers I am responsible for.";

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
  await browser?.close();
});

test("R53: a reply written in Chinese by a hire who picked English is shown to HR with an AI translation", async () => {
  await scriptModel("omniroute", Array.from({ length: 40 }, () => ({ kind: "json" as const, content: { translation: translated } })));
  await page.goto(`${appUrl}/problems/ROLE_CLARITY`);
  await page.getByText(/Review the \d+ replies in full/).click();
  const quote = page.locator("blockquote, p, div", { hasText: translated }).filter({ hasNotText: "供应商" }).first();
  await quote.waitFor({ timeout: 15000 });
  const holdsChinese = async () => (await modelCalls("omniroute")).some((call) => call.body.messages.some((m) => m.content.includes("我不太清楚哪些供应商是我负责的")));
  for (let waited = 0; waited < 30000 && !(await holdsChinese()); waited += 500) await settle(500);
  let seen = -1;
  for (let count = (await modelCalls("omniroute")).length; count !== seen; count = (await modelCalls("omniroute")).length) {
    seen = count;
    await settle(2000);
  }
  const asked = await holdsChinese();
  assert.equal(asked, true);
});
