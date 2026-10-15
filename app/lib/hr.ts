import { createAdminClient } from "@/lib/supabase/admin";

export async function hrUser(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer /, "");
  if (!token) return null;
  const { data } = await createAdminClient().auth.getUser(token);
  const metadata = data.user?.app_metadata;
  if (metadata?.role !== "hr" && metadata?.role !== "hr_admin") return null;
  return { organisationId: metadata.organisation_id as string, actor: data.user!.id, role: metadata.role as string };
}

export async function hrOrganisation(request: Request) {
  return (await hrUser(request))?.organisationId ?? null;
}
