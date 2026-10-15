import { z } from "zod";
import { now } from "@/lib/clock";
import { audit } from "@/lib/signal";
import { notReceiving, reachable, type Person } from "@/lib/directory";
import { packs } from "@/lib/packs";
import { safeMessage, type Contacts } from "@/lib/safety";
import { send } from "@/lib/telegram";
import { createAdminClient } from "@/lib/supabase/admin";

const DAY_MS = 24 * 3600 * 1000;
const fixedFirst = ["forced_labour_indicator", "sexual_harassment"];

export async function escalate(person: Person, responseId: string, keyword: string | null, model: string | null) {
  const db = createAdminClient();
  const category = fixedFirst.find((c) => c === keyword || c === model) ?? keyword ?? model!;
  const { error } = await db.from("escalations").insert({
    organisation_id: person.organisation_id,
    response_id: responseId,
    source: keyword && model ? "both" : keyword ? "keyword" : "model",
    category,
    created_at: (await now()).toISOString(),
  });
  if (error) throw error;
  const { error: tagError } = await db.from("ai_tags").update({ escalate: true }).eq("response_id", responseId);
  if (tagError) throw tagError;
  const { data, error: orgError } = await db
    .from("organisations")
    .select("escalation_contacts")
    .eq("id", person.organisation_id)
    .single();
  if (orgError) throw orgError;
  return safeMessage(person.language, category, data.escalation_contacts as Contacts);
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

export async function listEscalations(organisationId: string) {
  const db = createAdminClient();
  const { data: org, error: orgError } = await db
    .from("organisations")
    .select("time_zone")
    .eq("id", organisationId)
    .single();
  if (orgError) throw orgError;
  const { data, error } = await db
    .from("escalations")
    .select("id, response_id, category, source, created_at, acknowledged_at, contact_recorded_at, dont_contact, closed_at")
    .eq("organisation_id", organisationId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  const at = await now();
  return data.map((row) => {
    const created = new Date(row.created_at);
    const until = row.acknowledged_at ? new Date(row.acknowledged_at) : at;
    const due = dueAt(created, org.time_zone);
    return {
      ...row,
      due_at: due.toISOString(),
      waited_hours: Math.floor((until.getTime() - created.getTime()) / 3600000),
      overdue: until > due,
    };
  });
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

export async function closeEscalation(organisationId: string, id: string, actor: string, sendClosure: boolean) {
  const db = createAdminClient();
  const at = (await now()).toISOString();
  const { data, error } = await db
    .from("escalations")
    .update({ closed_at: at })
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
