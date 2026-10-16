import { checkinReminder, checkinStart } from "@/lib/checkin";
import { now } from "@/lib/clock";
import { claimMilestones, milestoneReply } from "@/lib/milestones";
import { offerReply } from "@/lib/offers";
import { exitQuestion } from "@/lib/exit";
import { packs, type Language } from "@/lib/packs";
import type { Reply } from "@/lib/engine";
import { createAdminClient } from "@/lib/supabase/admin";
import { send } from "@/lib/telegram";

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

export async function dispatch() {
  const { data, error } = await createAdminClient().rpc("dispatch_claim", {
    at: (await now()).toISOString(),
  });
  if (error) throw error;
  const claims = data as Claim[];
  const { data: rechecks, error: rechecksError } = await createAdminClient()
    .from("checkin_schedule")
    .select("id, recheck_driver, touchpoint")
    .in("id", claims.map((claim) => claim.schedule_id));
  if (rechecksError) throw rechecksError;
  for (const claim of claims) {
    const person = { language: claim.language };
    const row = rechecks.find((r) => r.id === claim.schedule_id)!;
    const replies =
      claim.kind === "reminder"
        ? checkinReminder(person, claim.progress, row.recheck_driver, row.touchpoint)
        : checkinStart(person, row.recheck_driver, row.touchpoint);
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
  const { error } = await createAdminClient().rpc("write_schedule", {
    person: personId,
    at: (await now()).toISOString(),
  });
  if (error) throw error;
}

export async function setHolidays(organisationId: string, holidays: string[]) {
  const { error } = await createAdminClient().from("organisations").update({ holidays }).eq("id", organisationId);
  if (error) throw error;
}

function localDay(date: Date, timeZone: string) {
  return Date.parse(date.toLocaleDateString("en-CA", { timeZone }));
}

export async function advanceDemo(organisationId: string, day?: number) {
  const db = createAdminClient();
  const { data: org, error } = await db
    .from("organisations")
    .select("demo_mode, demo_offset_days, time_zone")
    .eq("id", organisationId)
    .single();
  if (error) throw error;
  if (!org.demo_mode) return { error: "Demo mode is off" };
  let offset = org.demo_offset_days + 1;
  if (day !== undefined) {
    const { data: live, error: liveError } = await db
      .from("people")
      .select("start_date")
      .eq("organisation_id", organisationId)
      .eq("synthetic", false)
      .order("start_date")
      .limit(1)
      .single();
    if (liveError) throw liveError;
    const today = localDay(await now(), org.time_zone);
    const due = Date.parse(live.start_date) + day * 86400000;
    const weekend = ({ 6: 2, 0: 1 } as Record<number, number>)[new Date(due).getUTCDay()] ?? 0;
    offset = Math.max(org.demo_offset_days, Math.round((due - today) / 86400000) + weekend);
  }
  const { error: updateError } = await db
    .from("organisations")
    .update({ demo_offset_days: offset })
    .eq("id", organisationId);
  if (updateError) throw updateError;
  return { offset, sent: await dispatch() };
}
