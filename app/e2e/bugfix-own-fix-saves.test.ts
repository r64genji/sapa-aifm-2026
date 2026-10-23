import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { chromium, type Browser, type Page } from "playwright-core";
import { appUrl, freezeClock, hrRequest, resetDemo } from "./helpers.ts";

const name = "Weekly 1:1 with a mentor";
const message = "Please pair each new hire with a mentor for a weekly 1:1.";
const note = "Each new hire now has a mentor to meet every week.";

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

test("A fix HR writes by hand is saved as the draft and shows on Shared problems", async () => {
  await page.goto(`${appUrl}/fixes/new?driver=ONBOARDING&own=${encodeURIComponent(name)}`);
  await page.getByLabel(/Message to/).fill(message);
  const saved = page.waitForResponse((r) => r.request().method() === "PATCH" && /\/api\/hr\/actions\/[^/]+$/.test(r.url()) && r.request().postData()!.includes(note));
  await page.getByLabel("Note in English").fill(note);
  assert.equal((await saved).status(), 200);

  const actions = (await (await hrRequest("/api/hr/actions", "GET")).json()) as { driver: string; status: string; title: string; steps: string }[];
  const draft = actions.find((a) => a.driver === "ONBOARDING" && a.status === "draft");
  assert.equal(draft?.title, name);
  assert.equal(draft?.steps, message);

  await page.goto(`${appUrl}/problems/ONBOARDING`);
  await page.getByText(name).first().waitFor();

  await page.goto(`${appUrl}/fixes/new?driver=ONBOARDING`);
  await page.getByLabel("Note in English").waitFor();
  assert.equal(await page.getByLabel("Fix title").inputValue(), name);
  assert.equal(await page.getByLabel(/Message to/).inputValue(), message);
  assert.equal(await page.getByLabel("Note in English").inputValue(), note);
});
