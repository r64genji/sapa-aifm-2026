import { createAdminClient } from "@/lib/supabase/admin";

export async function hrOrganisation(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer /, "");
  if (!token) return null;
  const { data } = await createAdminClient().auth.getUser(token);
  const metadata = data.user?.app_metadata;
  if (metadata?.role !== "hr" && metadata?.role !== "hr_admin") return null;
  return metadata.organisation_id as string;
}
