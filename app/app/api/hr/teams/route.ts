import { hrOrganisation } from "@/lib/hr";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const organisation = await hrOrganisation(request);
  if (!organisation) return new Response("Unauthorized", { status: 401 });
  const { data, error } = await createAdminClient().from("people").select("team").eq("organisation_id", organisation);
  if (error) throw error;
  return Response.json([...new Set(data.map((row) => row.team as string))].sort());
}
