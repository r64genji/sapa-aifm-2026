import { now } from "@/lib/clock";
import { createAdminClient } from "@/lib/supabase/admin";

export async function jobMatchCards(organisationId: string) {
  const db = createAdminClient();
  const { data: org, error: orgError } = await db
    .from("organisations")
    .select("min_group_size")
    .eq("id", organisationId)
    .single();
  if (orgError) throw orgError;
  const { data, error } = await db.rpc("job_match", { org: organisationId, at: (await now()).toISOString() });
  if (error) throw error;
  const rows = data as { role: string; respondents: number; not_really: number }[];
  return rows.map((row) =>
    row.respondents >= org.min_group_size
      ? {
          role: row.role,
          enough: true as const,
          n: row.not_really,
          m: row.respondents,
          label: `${row.role}: ${row.not_really} of ${row.respondents} said 'not really' at Day 14`,
        }
      : {
          role: row.role,
          enough: false as const,
          message: `Not enough people yet (${row.respondents} of ${org.min_group_size} needed)`,
        },
  );
}
