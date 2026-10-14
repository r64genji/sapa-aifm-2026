import { now } from "@/lib/clock";
import { notReceiving, reachable, type Person } from "@/lib/directory";
import type { Reply } from "@/lib/engine";
import { dueAt } from "@/lib/escalations";
import { packs, type Language } from "@/lib/packs";
import { audit, signal } from "@/lib/signal";
import { createAdminClient } from "@/lib/supabase/admin";

const DAY_MS = 24 * 3600 * 1000;

export function offerReply(language: Language): Reply {
  const { offer } = packs[language];
  return {
    text: offer.text,
    buttons: [
      { label: offer.yes, id: "offer", value: "yes" },
      { label: offer.noThanks, id: "offer", value: "no_thanks" },
    ],
  };
}

export async function createOffer(organisationId: string, actor: string, responseId: string) {
  const db = createAdminClient();
  const { data: tag, error } = await db
    .from("ai_tags")
    .select("concern_level, responses!inner(person_id)")
    .eq("organisation_id", organisationId)
    .eq("response_id", responseId)
    .maybeSingle();
  if (error) throw error;
  if (!tag) return { error: "Not found", code: 404 };
  const { data: escalated, error: escalatedError } = await db
    .from("escalations")
    .select("id")
    .eq("response_id", responseId);
  if (escalatedError) throw escalatedError;
  if (escalated.length > 0) return { error: "An escalation is handled by HR directly", code: 409 };
  if (tag.concern_level !== "needs_follow_up") return { error: "The reply is not marked as needing follow-up", code: 409 };
  const personId = (tag as unknown as { responses: { person_id: string } }).responses.person_id;
  if (!(await reachable(personId))) return { error: notReceiving, code: 409 };
  const at = await now();
  const { data: earlier, error: earlierError } = await db
    .from("follow_up_offers")
    .select("response_id, closed_at, answer")
    .eq("person_id", personId);
  if (earlierError) throw earlierError;
  if (earlier.some((row) => row.closed_at === null)) return { error: "This person already has an open offer", code: 409 };
  if (earlier.some((row) => row.response_id === responseId)) return { error: "This reply already had an offer", code: 409 };
  if (earlier.some((row) => row.answer === "no_thanks" && Date.parse(row.closed_at!) + 30 * DAY_MS > at.getTime())) {
    return { error: "This person said no thanks in the last 30 days", code: 409 };
  }
  const { data, error: insertError } = await db
    .from("follow_up_offers")
    .insert({
      organisation_id: organisationId,
      response_id: responseId,
      person_id: personId,
      offered_by: actor,
      queued_at: at.toISOString(),
    })
    .select("id")
    .single();
  if (insertError?.code === "23505") return { error: "This person already has an open offer", code: 409 };
  if (insertError) throw insertError;
  await audit(actor, "send_offer", responseId);
  return { id: data.id as string, queued: true };
}

export async function answerOffer(person: Person, value: string): Promise<Reply[] | null> {
  const db = createAdminClient();
  const at = await now();
  const { data: org, error: orgError } = await db
    .from("organisations")
    .select("time_zone")
    .eq("id", person.organisation_id)
    .single();
  if (orgError) throw orgError;
  const { data, error } = await db
    .from("follow_up_offers")
    .update({
      answer: value,
      closed_at: at.toISOString(),
      ...(value === "yes" && { contact_due_at: dueAt(at, org.time_zone, 2).toISOString() }),
    })
    .eq("person_id", person.id)
    .not("sent_at", "is", null)
    .is("closed_at", null)
    .select("organisation_id");
  if (error) throw error;
  if (data.length === 0) return null;
  await signal(person.organisation_id, "queue");
  const { offer } = packs[person.language];
  return [{ text: value === "yes" ? offer.accepted : offer.declined }];
}

export async function listOffers(organisationId: string) {
  const { data, error } = await createAdminClient()
    .from("follow_up_offers")
    .select("id, response_id, answer, closed_at, contact_due_at, contact_done_at")
    .eq("organisation_id", organisationId)
    .order("queued_at");
  if (error) throw error;
  return data.map(({ closed_at, ...row }) => ({ ...row, open: closed_at === null }));
}

export async function finishContact(organisationId: string, actor: string, id: string) {
  const { data, error } = await createAdminClient()
    .from("follow_up_offers")
    .update({ contact_done_at: (await now()).toISOString() })
    .eq("organisation_id", organisationId)
    .eq("id", id)
    .not("contact_due_at", "is", null)
    .is("contact_done_at", null)
    .select("id");
  if (error) throw error;
  if (data.length === 0) return { error: "Not found or already done", code: 409 };
  await audit(actor, "finish_offer_contact", id);
  return { done: true };
}
