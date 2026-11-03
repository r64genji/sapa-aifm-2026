import { createHmac } from "node:crypto";
import type { Reply } from "@/lib/engine";
import { packs, type Language } from "@/lib/packs";
import { matchesSecret } from "@/lib/secret";

const contents = new Map<string, string>();

async function twilio(url: string, body: string, type: string) {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      authorization: `Basic ${Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString("base64")}`,
      "content-type": type,
    },
    body,
  });
  if (!res.ok) throw new Error(`Twilio ${res.status}: ${await res.text()}`);
  return res.json();
}

async function content(types: object) {
  const key = JSON.stringify(types);
  if (!contents.has(key)) {
    const { sid } = await twilio(
      "https://content.twilio.com/v1/Content",
      JSON.stringify({ friendly_name: `sapa_${contents.size}_${Date.now()}`, language: "en", types }),
      "application/json",
    );
    contents.set(key, sid);
  }
  return contents.get(key)!;
}

export async function sendWhatsApp(waId: number, reply: Reply, language: Language) {
  const buttons = reply.phone ? [{ label: reply.phone, id: "phone", value: "" }] : (reply.buttons ?? []);
  const actions = buttons.map((b) => ({ id: JSON.stringify({ a: b.id, v: b.value }), title: b.label }));
  const form = new URLSearchParams({ From: `whatsapp:${process.env.TWILIO_WHATSAPP_FROM}`, To: `whatsapp:+${waId}` });
  if (actions.length === 0) form.set("Body", reply.text);
  else if (actions.length <= 3) form.set("ContentSid", await content({ "twilio/quick-reply": { body: reply.text, actions } }));
  else {
    const items = actions.map(({ id, title }) => ({ id, item: title }));
    form.set("ContentSid", await content({ "twilio/list-picker": { body: reply.text, button: packs[language].choose, items } }));
  }
  await twilio(
    `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`,
    form.toString(),
    "application/x-www-form-urlencoded",
  );
  return true;
}

export function signedByTwilio(url: string, params: URLSearchParams, signature: string | null) {
  const data = url + [...params.keys()].sort().map((key) => key + params.get(key)).join("");
  return matchesSecret(signature, createHmac("sha1", process.env.TWILIO_AUTH_TOKEN ?? "").update(data).digest("base64"));
}
