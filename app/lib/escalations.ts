import { z } from "zod";
import { now } from "@/lib/clock";
import { decrypt, encrypt } from "@/lib/crypto";
import { audit } from "@/lib/signal";
import { notReceiving, personByChat, reachable, type Person } from "@/lib/directory";
import type { Reply } from "@/lib/engine";
import { packs, type Language } from "@/lib/packs";
import { safeMessage, type Contacts } from "@/lib/safety";
import { send } from "@/lib/telegram";
import { createAdminClient } from "@/lib/supabase/admin";

const DAY_MS = 24 * 3600 * 1000;
const fixedFirst = ["forced_labour_indicator", "sexual_harassment"];

export async function escalate(person: Person, responseId: string, keyword: string | null, model: string | null) {
  const db = createAdminClient();
  const category = fixedFirst.find((c) => c === keyword || c === model) ?? keyword ?? model!;
  const found = { source: keyword && model ? "both" : keyword ? "keyword" : "model", category };
  const { data: open, error: openError } = await db.from("escalations").update(found).eq("response_id", responseId).select("id");
  if (openError) throw openError;
  if (open.length === 0) {
    const { error } = await db.from("escalations").insert({
      organisation_id: person.organisation_id,
      response_id: responseId,
      ...found,
      created_at: (await now()).toISOString(),
    });
    if (error) throw error;
  }
  const { data, error: orgError } = await db
    .from("organisations")
    .select("escalation_contacts")
    .eq("id", person.organisation_id)
    .single();
  if (orgError) throw orgError;
  const { contact } = packs[person.language];
  return {
    text: `${safeMessage(person.language, category, data.escalation_contacts as Contacts)}\n\n${contact.ask}`,
    buttons: [
      { label: contact.yes, id: "contact", value: "yes" },
      { label: contact.no, id: "contact", value: "no" },
    ],
  };
}

async function latestOpen(personId: string) {
  const { data, error } = await createAdminClient()
    .from("escalations")
    .select("id, responses!inner(person_id)")
    .eq("responses.person_id", personId)
    .is("closed_at", null)
    .order("created_at", { ascending: false })
    .limit(1);
  if (error) throw error;
  return data[0]?.id as string | undefined;
}

async function setContact(id: string, fields: Record<string, unknown>) {
  const { error } = await createAdminClient().from("escalations").update(fields).eq("id", id);
  if (error) throw error;
}

export async function answerContact(person: Person, value: string): Promise<Reply[]> {
  const { contact } = packs[person.language];
  const id = await latestOpen(person.id);
  if (!id) return [];
  if (value === "yes") {
    return [
      {
        text: contact.how,
        buttons: [
          { label: contact.call, id: "contact", value: "call" },
          { label: contact.meet, id: "contact", value: "meet" },
        ],
      },
    ];
  }
  if (value === "no") {
    await setContact(id, { dont_contact: true, contact_method: null, contact_phone_encrypted: null });
    return [{ text: contact.noThanks }];
  }
  if (value === "meet") {
    await setContact(id, { dont_contact: false, contact_method: "meet", contact_phone_encrypted: null });
    return [{ text: contact.thanks }];
  }
  if (value === "call") {
    await setContact(id, { dont_contact: false, contact_method: "call" });
    return [{ text: contact.sharePrompt, phone: contact.share }];
  }
  return [];
}

export async function savePhone(chatId: number, phone: string): Promise<Reply[]> {
  const person = await personByChat(chatId);
  if (!person) return [];
  const id = await latestOpen(person.id);
  if (!id) return [];
  await setContact(id, { dont_contact: false, contact_method: "call", contact_phone_encrypted: encrypt(phone) });
  return [{ text: packs[person.language].contact.thanks }];
}

export function dueAt(created: Date, timeZone: string, days = 1) {
  const weekday = new Intl.DateTimeFormat("en-US", { weekday: "short", timeZone });
  let due = created.getTime();
  for (let i = 0; i < days; i++) {
    do due += DAY_MS;
    while (["Sat", "Sun"].includes(weekday.format(due)));
  }
  return new Date(due);
}

export async function listEscalations(organisationId: string, preview?: string) {
  const db = createAdminClient();
  const { data: org, error: orgError } = await db
    .from("organisations")
    .select("time_zone")
    .eq("id", organisationId)
    .single();
  if (orgError) throw orgError;
  const { data, error } = await db
    .from("escalations")
    .select(
      "id, response_id, category, source, created_at, acknowledged_at, contact_recorded_at, dont_contact, contact_method, not_serious, closed_at, responses!inner(text_encrypted, checkin_schedule(touchpoint))",
    )
    .eq("organisation_id", organisationId)
    .or("dont_contact.eq.true,contact_method.eq.meet,contact_phone_encrypted.not.is.null")
    .order("created_at", { ascending: false });
  if (error) throw error;
  const at = await now();
  const rows = data as unknown as ((typeof data)[number] & {
    responses: { text_encrypted: string | null; checkin_schedule: { touchpoint: number } | null };
  })[];
  const result = [];
  for (const { responses, ...row } of rows) {
    const created = new Date(row.created_at);
    const until = row.acknowledged_at ? new Date(row.acknowledged_at) : at;
    const due = dueAt(created, org.time_zone);
    const text = preview && responses.text_encrypted ? decrypt(responses.text_encrypted) : null;
    if (text && preview) await audit(preview, "read_reply_text", row.response_id);
    result.push({
      ...row,
      touchpoint: responses.checkin_schedule?.touchpoint ?? null,
      first_line: text?.split("\n")[0] ?? null,
      due_at: due.toISOString(),
      waited_hours: Math.floor((until.getTime() - created.getTime()) / 3600000),
      minutes_left: Math.round((due.getTime() - until.getTime()) / 60000),
      overdue: until > due,
    });
  }
  return result;
}

export async function getEscalation(organisationId: string, id: string, actor: string) {
  const db = createAdminClient();
  const found = (await listEscalations(organisationId)).find((row) => row.id === id);
  if (!found) return { error: "Not found", code: 404 };
  const { data, error } = await db
    .from("escalations")
    .select("closure_sent_at, contact_phone_encrypted, responses!inner(text_encrypted, language, person_id, people!inner(team, code_name, role, start_date))")
    .eq("id", id)
    .single();
  if (error) throw error;
  const reply = data.responses as unknown as {
    text_encrypted: string | null;
    language: Language;
    person_id: string;
    people: { team: string; code_name: string; role: string; start_date: string };
  };
  await audit(actor, "read_reply_text", found.response_id);
  const { data: org, error: orgError } = await db
    .from("organisations")
    .select("escalation_contacts")
    .eq("id", organisationId)
    .single();
  if (orgError) throw orgError;
  const contacts = org.escalation_contacts as Contacts;
  const { data: trail, error: trailError } = await db
    .from("audit_log")
    .select("action, at")
    .eq("target", id)
    .order("at");
  if (trailError) throw trailError;
  const names: Record<string, string> = {
    acknowledge_escalation: "Acknowledged",
    record_escalation_contact: "Contact recorded",
    record_dont_contact: "Marked as asked not to be contacted",
    close_escalation: "Closed",
    send_closure: "Closing message sent",
  };
  return {
    ...found,
    closure_sent_at: data.closure_sent_at,
    team: reply.people.team,
    code_name: reply.people.code_name,
    role: reply.people.role,
    start_date: reply.people.start_date,
    phone: data.contact_phone_encrypted ? decrypt(data.contact_phone_encrypted) : null,
    text: reply.text_encrypted ? decrypt(reply.text_encrypted) : null,
    language: reply.language,
    can_send_closure: !found.dont_contact && !!(await reachable(reply.person_id)),
    sent_by_bot: safeMessage(reply.language, found.category, contacts).split("\n"),
    closure: Object.fromEntries(
      ([...new Set([reply.language, "en"])] as Language[]).map((language) => [language, [packs[language].closure, ...contacts.general].join("\n")]),
    ),
    history: [
      { text: "Flagged", at: found.created_at },
      ...trail.filter((row) => names[row.action]).map((row) => ({ text: names[row.action], at: row.at })),
    ],
  };
}

export async function markEscalation(
  organisationId: string,
  id: string,
  field: "acknowledged_at" | "contact_recorded_at",
  actor: string,
) {
  const db = createAdminClient();
  const at = (await now()).toISOString();
  const { data, error } = await db
    .from("escalations")
    .update({ [field]: at })
    .eq("organisation_id", organisationId)
    .eq("id", id)
    .is(field, null)
    .select("id");
  if (error) throw error;
  if (data.length === 0) return { error: "Not found or already recorded", code: 409 };
  const action = field === "acknowledged_at" ? "acknowledge_escalation" : "record_escalation_contact";
  const { error: auditError } = await db.from("audit_log").insert({ actor, action, target: id, at });
  if (auditError) throw auditError;
  return { [field]: at };
}

const ContactsInput = z.object({
  general: z.array(z.string().trim().min(1).max(200)).max(10),
  forced_labour_indicator: z.array(z.string().trim().min(1).max(200)).max(10),
});

export async function setContacts(organisationId: string, input: unknown, actor: string) {
  const parsed = ContactsInput.safeParse(input);
  if (!parsed.success) return { error: "Invalid contacts", code: 422 };
  const db = createAdminClient();
  const { error } = await db
    .from("organisations")
    .update({ escalation_contacts: parsed.data })
    .eq("id", organisationId);
  if (error) throw error;
  const at = (await now()).toISOString();
  const { error: auditError } = await db
    .from("audit_log")
    .insert({ actor, action: "update_escalation_contacts", target: organisationId, at });
  if (auditError) throw auditError;
  return parsed.data;
}

export async function setDontContact(organisationId: string, id: string, actor: string) {
  const db = createAdminClient();
  const { data, error } = await db
    .from("escalations")
    .update({ dont_contact: true })
    .eq("organisation_id", organisationId)
    .eq("id", id)
    .select("id");
  if (error) throw error;
  if (data.length === 0) return { error: "Not found", code: 404 };
  await audit(actor, "record_dont_contact", id);
  return { dont_contact: true };
}

export async function closeEscalation(organisationId: string, id: string, actor: string, sendClosure: boolean, notSerious: boolean) {
  const db = createAdminClient();
  const at = (await now()).toISOString();
  const { data, error } = await db
    .from("escalations")
    .update({ closed_at: at, not_serious: notSerious })
    .eq("organisation_id", organisationId)
    .eq("id", id)
    .is("closed_at", null)
    .select("dont_contact, responses!inner(person_id)");
  if (error) throw error;
  if (data.length === 0) return { error: "Not found or already closed", code: 409 };
  await audit(actor, "close_escalation", id);
  if (!sendClosure) return { closed_at: at };
  const row = data[0] as unknown as { dont_contact: boolean; responses: { person_id: string } };
  const person = row.dont_contact ? null : await reachable(row.responses.person_id);
  if (!person) return { closed_at: at, closure: "blocked", reason: notReceiving };
  const { data: org, error: orgError } = await db
    .from("organisations")
    .select("escalation_contacts")
    .eq("id", organisationId)
    .single();
  if (orgError) throw orgError;
  const contacts = (org.escalation_contacts as Contacts).general;
  const text = [packs[person.language].closure, ...contacts].join("\n");
  if (!(await send(person.telegram_chat_id!, { text }))) return { closed_at: at, closure: "blocked", reason: notReceiving };
  const { error: sentError } = await db.from("escalations").update({ closure_sent_at: at }).eq("id", id);
  if (sentError) throw sentError;
  await audit(actor, "send_closure", id);
  return { closed_at: at, closure: "sent" };
}
