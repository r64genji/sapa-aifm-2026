import { checkinReminder, checkinStart, SCHEDULE, type Schedule } from "@/lib/checkin";
import { now } from "@/lib/clock";
import { claimMilestones, milestoneReply } from "@/lib/milestones";
import { offerReply } from "@/lib/offers";
import { exitQuestion } from "@/lib/exit";
import { packs, type Language } from "@/lib/packs";
import type { Reply } from "@/lib/engine";
import { createAdminClient } from "@/lib/supabase/admin";
import { send } from "@/lib/telegram";
import { allDays, tracksOf, trackFor, type Track } from "@/lib/tracks";

type Claim = { schedule_id: string; chat_id: number; language: Language; progress: number; kind: "checkin" | "reminder" };

async function deliver(chatId: number, replies: Reply[]) {
  try {
    for (const reply of replies) {
      if (!(await send(chatId, reply))) return;
    }
  } catch (error) {
    console.error(error);
  }
}

async function withQuestions(ids: string[]) {
  const db = createAdminClient();
  const { data, error } = await db
    .from("checkin_schedule")
    .select(`${SCHEDULE}, organisation_id`)
    .in("id", ids)
    .returns<(Schedule & { organisation_id: string })[]>();
  if (error) throw error;
  const tracks = new Map<string, Track[]>();
  const rows: Schedule[] = [];
  for (const { organisation_id, ...row } of data) {
    if (!tracks.has(organisation_id)) tracks.set(organisation_id, await tracksOf(organisation_id));
    const questions = trackFor(tracks.get(organisation_id)!, row.touchpoint).questions;
    const { error: updateError } = await db.from("checkin_schedule").update({ questions }).eq("id", row.id);
    if (updateError) throw updateError;
    rows.push({ ...row, questions });
  }
  return rows;
}

export async function dispatch() {
  const { data, error } = await createAdminClient().rpc("dispatch_claim", {
    at: (await now()).toISOString(),
  });
  if (error) throw error;
  const claims = data as Claim[];
  const rechecks = await withQuestions(claims.map((claim) => claim.schedule_id));
  const { data: people, error: peopleError } = await createAdminClient()
    .from("people")
    .select("telegram_chat_id, name, anonymous")
    .in("telegram_chat_id", claims.map((claim) => claim.chat_id));
  if (peopleError) throw peopleError;
  for (const claim of claims) {
    const person = { language: claim.language, name: null, anonymous: false, ...people.find((row) => row.telegram_chat_id === claim.chat_id) };
    const row = { ...rechecks.find((r) => r.id === claim.schedule_id)!, progress: claim.progress };
    const replies = claim.kind === "reminder" ? checkinReminder(person, row) : checkinStart(person, row);
    await deliver(claim.chat_id, replies);
  }
  const { data: offers, error: offersError } = await createAdminClient().rpc("offers_claim", {
    at: (await now()).toISOString(),
  });
  if (offersError) throw offersError;
  for (const offer of offers as { chat_id: number; language: Language }[]) {
    await deliver(offer.chat_id, [offerReply(offer.language)]);
  }
  const nudges = await claimMilestones();
  for (const nudge of nudges) {
    await deliver(nudge.chat_id, [milestoneReply(nudge.language, nudge.id, nudge.day, nudge.hire)]);
  }
  const { data: left, error: leftError } = await createAdminClient().rpc("left_claim", {
    at: (await now()).toISOString(),
  });
  if (leftError) throw leftError;
  for (const person of left as { chat_id: number; language: Language; end_date: string; ask_exit: boolean }[]) {
    await deliver(person.chat_id, [
      { text: packs[person.language].end.replace("{date}", person.end_date) },
      ...(person.ask_exit ? [exitQuestion(person.language)] : []),
    ]);
  }
  return claims.length + offers.length + left.length + nudges.length + (await sendNotices());
}

export async function sendNotices() {
  const { data: notices, error } = await createAdminClient().rpc("notices_claim", {
    at: (await now()).toISOString(),
  });
  if (error) throw error;
  for (const notice of notices as { chat_id: number; language: Language; note: string }[]) {
    await deliver(notice.chat_id, [{ text: packs[notice.language].notice.replace("{note}", notice.note) }]);
  }
  return notices.length;
}

export async function scheduleFor(personId: string) {
  const db = createAdminClient();
  const { data: person, error: personError } = await db.from("people").select("organisation_id").eq("id", personId).single();
  if (personError) throw personError;
  const { error } = await db.rpc("write_schedule", {
    person: personId,
    at: (await now()).toISOString(),
    days: allDays(await tracksOf(person.organisation_id)),
  });
  if (error) throw error;
}

export async function setHolidays(organisationId: string, holidays: string[]) {
  const { error } = await createAdminClient().from("organisations").update({ holidays }).eq("id", organisationId);
  if (error) throw error;
}

export async function sendOutreach(organisationId: string, touchpoint?: number) {
  const db = createAdminClient();
  const { data: org, error } = await db.from("organisations").select("demo_mode").eq("id", organisationId).single();
  if (error) throw error;
  if (!org.demo_mode) return { error: "Demo mode is off" };
  const { data: rows, error: rowsError } = await db
    .from("checkin_schedule")
    .select("id, person_id, touchpoint, status, people!inner(telegram_chat_id, language, name, anonymous)")
    .eq("organisation_id", organisationId)
    .in("status", ["scheduled", "sent", "reminded"])
    .eq("people.state", "active")
    .eq("people.synthetic", false)
    .not("people.telegram_chat_id", "is", null)
    .order("touchpoint")
    .returns<{ id: string; person_id: string; touchpoint: number; status: string; people: { telegram_chat_id: number; language: Language; name: string | null; anonymous: boolean | null } }[]>();
  if (rowsError) throw rowsError;
  const waiting = new Set(rows.filter((row) => row.status !== "scheduled").map((row) => row.person_id));
  const next = new Map<string, (typeof rows)[number]>();
  for (const row of rows) {
    if (row.status === "scheduled" && !waiting.has(row.person_id) && (touchpoint === undefined || row.touchpoint === touchpoint) && !next.has(row.person_id)) {
      next.set(row.person_id, row);
    }
  }
  if (next.size === 0) return { error: waiting.size > 0 ? "Every joined phone still has a check-in open" : "No one has a check-in left to send" };
  let sent = 0;
  for (const row of next.values()) {
    const { data: claimed, error: claimError } = await db
      .from("checkin_schedule")
      .update({ status: "sent", sent_at: (await now()).toISOString() })
      .eq("id", row.id)
      .eq("status", "scheduled")
      .select("id");
    if (claimError) throw claimError;
    if (claimed.length === 0) continue;
    const [questions] = await withQuestions([row.id]);
    await deliver(row.people.telegram_chat_id, checkinStart(row.people, questions));
    sent += 1;
  }
  return { sent: sent + (await dispatch()) };
}
