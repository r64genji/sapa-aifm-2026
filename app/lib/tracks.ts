import { createAdminClient } from "@/lib/supabase/admin";

export const BANK = ["ROLE_CLARITY", "MANAGER_SUPPORT", "BELONGING", "ONBOARDING", "TRAINING", "WORKLOAD", "OPEN"];

export type Track = { id: "new_hire" | "employee"; name: string; days: number[]; questions: string[] };

const DEFAULTS: Track[] = [
  { id: "new_hire", name: "New hire", days: [3, 7, 14, 30, 60, 90, 182], questions: BANK },
  { id: "employee", name: "Employee", days: [273, 365, 456, 547], questions: ["MANAGER_SUPPORT", "BELONGING", "WORKLOAD", "OPEN"] },
];

export async function tracksOf(organisationId: string) {
  const { data, error } = await createAdminClient()
    .from("checkin_tracks")
    .select("id, name, days, questions")
    .eq("organisation_id", organisationId)
    .returns<Track[]>();
  if (error) throw error;
  return DEFAULTS.map((track) => data.find((row) => row.id === track.id) ?? track);
}

export const allDays = (tracks: Track[]) => [...new Set(tracks.flatMap((track) => track.days))].sort((a, b) => a - b);

export const trackFor = (tracks: Track[], touchpoint: number) =>
  tracks.find((track) => track.days.includes(touchpoint)) ?? tracks[0];

export async function saveTracks(organisationId: string, tracks: Track[]) {
  const rows = tracks.map((track) => ({
    organisation_id: organisationId,
    id: track.id,
    name: track.name,
    days: [...new Set(track.days)].sort((a, b) => a - b),
    questions: BANK.filter((id) => track.questions.includes(id)),
  }));
  const { error } = await createAdminClient().from("checkin_tracks").upsert(rows);
  if (error) throw error;
  return tracksOf(organisationId);
}
