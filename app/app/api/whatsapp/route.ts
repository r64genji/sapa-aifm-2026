import { after } from "next/server";
import { now } from "@/lib/clock";
import { personByChat } from "@/lib/directory";
import { handle, type Input, type Reply } from "@/lib/engine";
import { savePhone } from "@/lib/escalations";
import { packs } from "@/lib/packs";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendWhatsApp, signedByTwilio } from "@/lib/whatsapp";

const ok = () => new Response("<Response/>", { headers: { "content-type": "text/xml" } });

export async function POST(request: Request) {
  const params = new URLSearchParams(await request.text());
  const url = new URL(request.url);
  const host = request.headers.get("x-forwarded-host") ?? url.host;
  if (!signedByTwilio(`https://${host}${url.pathname}`, params, request.headers.get("x-twilio-signature"))) {
    return new Response("Unauthorized", { status: 401 });
  }
  const sid = params.get("MessageSid") ?? "";
  const { data, error } = await createAdminClient()
    .from("inbound_updates")
    .upsert(
      { platform: "whatsapp", update_id: parseInt(sid.slice(2, 15), 16), received_at: (await now()).toISOString() },
      { onConflict: "platform,update_id", ignoreDuplicates: true },
    )
    .select();
  if (error) throw error;
  if (data.length === 0) return ok();
  after(() => reply(Number(params.get("WaId")), params));
  return ok();
}

async function reply(chatId: number, params: URLSearchParams) {
  const payload = params.get("ButtonPayload");
  const tap = payload ? (JSON.parse(payload) as { a: string; v: string }) : null;
  const text = params.get("Body") ?? "";
  let replies: Reply[];
  if (tap?.a === "phone") replies = await savePhone(chatId, `+${chatId}`);
  else if (!tap && !text) {
    const person = await personByChat(chatId);
    if (person && ["declined", "stopped", "left", "deleted"].includes(person.state)) return;
    replies = [{ text: packs[person?.language ?? "en"].typeInstead }];
  } else {
    const input: Input = tap ? { kind: "button", id: tap.a, value: tap.v } : { kind: "text", text };
    replies = (await handle(chatId, input)).replies;
    await createAdminClient().from("people").update({ channel: "whatsapp" }).eq("telegram_chat_id", chatId);
  }
  const person = await personByChat(chatId);
  for (const r of replies) await sendWhatsApp(chatId, r, person?.language ?? "en");
}
