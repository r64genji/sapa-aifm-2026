import { createHash, createHmac } from "node:crypto";
import type { Reply } from "@/lib/engine";
import { packs, type Language } from "@/lib/packs";
import { matchesSecret } from "@/lib/secret";
import { patiently } from "@/lib/telegram";

const contents = new Map<string, Promise<string>>();
let existing: Promise<Map<string, string>> | undefined;

async function twilio(url: string, body?: string, type?: string) {
  const res = await patiently(() =>
    fetch(url, {
      method: body ? "POST" : "GET",
      headers: {
        authorization: `Basic ${Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString("base64")}`,
        ...(type && { "content-type": type }),
      },
      body,
    }),
  );
  if (!res.ok) throw new Error(`Twilio ${res.status}: ${await res.text()}`);
  return res.json();
}

async function listContents() {
  const names = new Map<string, string>();
  for (let url: string | null = "https://content.twilio.com/v1/Content?PageSize=500"; url; ) {
    const page: { contents: { sid: string; friendly_name: string }[]; meta: { next_page_url: string | null } } = await twilio(url);
    for (const { sid, friendly_name } of page.contents) names.set(friendly_name, sid);
    url = page.meta.next_page_url;
  }
  return names;
}

async function create(types: object) {
  const name = `sapa_${createHash("sha256").update(JSON.stringify(types)).digest("hex").slice(0, 32)}`;
  existing ??= listContents().catch((error) => {
    existing = undefined;
    throw error;
  });
  const sid = (await existing).get(name);
  if (sid) return sid;
  return (await twilio("https://content.twilio.com/v1/Content", JSON.stringify({ friendly_name: name, language: "en", types }), "application/json")).sid as string;
}

function content(types: object) {
  const key = JSON.stringify(types);
  if (!contents.has(key)) contents.set(key, create(types).catch((error) => {
    contents.delete(key);
    throw error;
  }));
  return contents.get(key)!;
}

export async function sendWhatsApp(waId: number, reply: Reply, language: Language) {
  const buttons = reply.phone ? [{ label: reply.phone, id: "phone", value: "" }] : (reply.buttons ?? []);
  const actions = buttons.map((b) => ({ id: JSON.stringify({ a: b.id, v: b.value }), title: b.label }));
  const form = new URLSearchParams({ From: `whatsapp:${process.env.TWILIO_WHATSAPP_FROM}`, To: `whatsapp:+${waId}` });
  if (actions.length === 0) form.set("Body", reply.text);
  else {
    form.set("ContentVariables", JSON.stringify({ 1: reply.text }));
    if (actions.length <= 3) form.set("ContentSid", await content({ "twilio/quick-reply": { body: "{{1}}", actions } }));
    else {
      const items = actions.map(({ id, title }) => ({ id, item: title }));
      form.set("ContentSid", await content({ "twilio/list-picker": { body: "{{1}}", button: packs[language].choose, items } }));
    }
  }
  await twilio(
    `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`,
    form.toString(),
    "application/x-www-form-urlencoded",
  );
  return true;
}

export async function typingWhatsApp(messageSid: string) {
  await twilio("https://messaging.twilio.com/v3/Indicators/Typing.json", JSON.stringify({ messageId: messageSid, channel: "WHATSAPP" }), "application/json").catch(() => {});
}

export function signedByTwilio(url: string, params: URLSearchParams, signature: string | null) {
  const data = url + [...params.keys()].sort().map((key) => key + params.get(key)).join("");
  return matchesSecret(signature, createHmac("sha1", process.env.TWILIO_AUTH_TOKEN ?? "").update(data).digest("base64"));
}
