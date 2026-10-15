import { now } from "@/lib/clock";
import type { Reply } from "@/lib/engine";
import { packs, type Language } from "@/lib/packs";
import { createAdminClient } from "@/lib/supabase/admin";

export function milestoneReply(language: Language, id: string, day: number, hire: string): Reply {
  const { milestone } = packs[language];
  return {
    text: milestone.nudges[String(day) as "1" | "7" | "30"].replace("{name}", hire),
    buttons: [{ label: milestone.done, id: "ms", value: id }],
  };
}

export async function claimMilestones() {
  const { data, error } = await createAdminClient().rpc("milestones_claim", {
    at: (await now()).toISOString(),
  });
  if (error) throw error;
  return data as { id: string; chat_id: number; language: Language; day: number; hire: string }[];
}

export async function milestoneDone(chatId: number, id: string): Promise<Reply[] | null> {
  const db = createAdminClient();
  const { data: manager, error } = await db
    .from("managers")
    .select("id, organisations!inner(hr_language)")
    .eq("telegram_chat_id", chatId)
    .is("revoked_at", null)
    .maybeSingle();
  if (error) throw error;
  if (!manager) return null;
  const { error: updateError } = await db
    .from("milestone_nudges")
    .update({ done_at: (await now()).toISOString() })
    .eq("id", id)
    .eq("manager_id", manager.id)
    .is("done_at", null);
  if (updateError) throw updateError;
  const language = (manager as unknown as { organisations: { hr_language: Language } }).organisations.hr_language;
  return [{ text: packs[language].milestone.doneAck }];
}

export async function milestoneShare(organisationId: string) {
  const db = createAdminClient();
  const { data: org, error: orgError } = await db
    .from("organisations")
    .select("min_group_size")
    .eq("id", organisationId)
    .single();
  if (orgError) throw orgError;
  const { data, error } = await db
    .from("milestone_nudges")
    .select("person_id, done_at, people!inner(start_date)")
    .eq("organisation_id", organisationId);
  if (error) throw error;
  const intakes = new Map<string, { hires: Set<string>; sent: number; done: number }>();
  for (const row of data as unknown as { person_id: string; done_at: string | null; people: { start_date: string } }[]) {
    const key = row.people.start_date.slice(0, 7);
    const intake = intakes.get(key) ?? { hires: new Set<string>(), sent: 0, done: 0 };
    intake.hires.add(row.person_id);
    intake.sent += 1;
    if (row.done_at) intake.done += 1;
    intakes.set(key, intake);
  }
  return [...intakes.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([intake, { hires, sent, done }]) =>
      hires.size < org.min_group_size
        ? { intake, enough: false, message: "Not enough people yet" }
        : { intake, enough: true, hires: hires.size, share_done: Math.round((done / sent) * 100) / 100 },
    );
}
