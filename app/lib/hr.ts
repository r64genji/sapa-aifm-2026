import { createAdminClient } from "@/lib/supabase/admin";

export async function hrUser(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer /, "");
  if (!token) return null;
  const { data } = await createAdminClient().auth.getClaims(token);
  const metadata = data?.claims.app_metadata;
  if (metadata?.role !== "hr" && metadata?.role !== "hr_admin") return null;
  return { organisationId: metadata.organisation_id as string, actor: data!.claims.sub, role: metadata.role as string };
}

export async function hrOrganisation(request: Request) {
  return (await hrUser(request))?.organisationId ?? null;
}
