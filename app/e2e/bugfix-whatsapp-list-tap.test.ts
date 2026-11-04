import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { readFileSync } from "node:fs";
import { before, test } from "node:test";
import { appUrl, chatPerson, db, freezeClock, hrRequest, link, resetDemo, say, settle, tap, teamInvites } from "./helpers.ts";

const en = JSON.parse(readFileSync(new URL("../data/packs/en.json", import.meta.url), "utf8"));
const chat = 5550007401;

before(async () => {
  await resetDemo();
  await freezeClock("2026-10-15T15:00:00.000Z");
  await link(chat, teamInvites["Accounts Payable Asia"]);
  await tap(chat, "English");
  await tap(chat, en.agree);
  await tap(chat, en.privacy.named);
  await say(chat, "Abraham");
  await hrRequest("/api/hr/demo/outreach", "POST", { touchpoint: 14 });
});

test("Bug fix: a WhatsApp list tap, which sends the item id in Body with no ButtonPayload, saves the answer instead of asking the question again", async () => {
  const url = `${appUrl}/api/whatsapp`;
  const params = { MessageSid: "SMlisttap0000000000000000000000001", WaId: String(chat), From: `whatsapp:+${chat}`, Body: '{"a":"ans","v":"0.2"}' };
  const signature = createHmac("sha1", "test-twilio-auth-token")
    .update(url.replace("http:", "https:") + Object.keys(params).sort().map((k) => k + params[k as keyof typeof params]).join(""))
    .digest("base64");
  const res = await fetch(url, { method: "POST", headers: { "x-twilio-signature": signature }, body: new URLSearchParams(params) });
  assert.equal(res.status, 200);
  await settle();
  const { data } = await db.from("responses").select("question_id, scale_value").eq("person_id", (await chatPerson(chat)).id).not("scale_value", "is", null);
  assert.deepEqual(data, [{ question_id: "ROLE_CLARITY", scale_value: 2 }]);
});
