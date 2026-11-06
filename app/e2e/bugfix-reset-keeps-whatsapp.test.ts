import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { before, test } from "node:test";
import { appUrl, callReset, db, freezeClock, hrRequest, resetDemo, sentTo, settle, teamInvites } from "./helpers.ts";

const chat = 5550007601;
let sid = 0;

async function whatsapp(fields: Record<string, string>) {
  const url = `${appUrl}/api/whatsapp`;
  const params: Record<string, string> = { MessageSid: `SMresetwa${String(++sid).padStart(24, "0")}`, WaId: String(chat), From: `whatsapp:+${chat}`, Body: "", ...fields };
  const signature = createHmac("sha1", "test-twilio-auth-token")
    .update(url.replace("http:", "https:") + Object.keys(params).sort().map((k) => k + params[k]).join(""))
    .digest("base64");
  const res = await fetch(url, { method: "POST", headers: { "x-twilio-signature": signature }, body: new URLSearchParams(params) });
  assert.equal(res.status, 200);
  await settle();
}

before(async () => {
  await resetDemo();
  await freezeClock("2026-10-15T15:00:00.000Z");
  await whatsapp({ Body: `/start ${teamInvites["Accounts Payable Asia"]}` });
  await whatsapp({ ButtonPayload: '{"a":"lang","v":"en"}', Body: "English" });
  await whatsapp({ ButtonPayload: '{"a":"consent","v":"yes"}', Body: "I agree" });
});

test("Bug fix: after a demo reset a hire who joined on WhatsApp still gets the check-in on WhatsApp, not on Telegram", async () => {
  await callReset();
  const { data } = await db.from("people").select("channel, state").eq("telegram_chat_id", chat);
  assert.deepEqual(data, [{ channel: "whatsapp", state: "active" }]);
  assert.equal((await hrRequest("/api/hr/demo/outreach", "POST", { touchpoint: 14 })).status, 200);
  await settle();
  assert.deepEqual(await sentTo(chat), []);
});
