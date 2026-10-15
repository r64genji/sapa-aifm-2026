import { now } from "@/lib/clock";
import { retention } from "@/lib/impact";
import { jobMatchCards } from "@/lib/jobmatch";
import { audit } from "@/lib/signal";
import { createAdminClient } from "@/lib/supabase/admin";
import { themeCards } from "@/lib/themes";

export async function agencyUser(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer /, "");
  if (!token) return null;
  const db = createAdminClient();
  const { data } = await db.auth.getUser(token);
  if (data.user?.app_metadata?.role !== "agency") return null;
  const { data: grant, error } = await db
    .from("agency_grants")
    .select("organisation_id, agency")
    .eq("user_id", data.user.id)
    .maybeSingle();
  if (error) throw error;
  return grant ? { organisationId: grant.organisation_id as string, agency: grant.agency as string } : null;
}

export async function grantAgency(organisationId: string, actor: string, email: string, agency: string) {
  const db = createAdminClient();
  const { data: created, error } = await db.auth.admin.createUser({
    email,
    email_confirm: true,
    app_metadata: { role: "agency", organisation_id: organisationId },
  });
  if (error) return { error: error.message };
  const { error: grantError } = await db.from("agency_grants").insert({
    user_id: created.user.id,
    organisation_id: organisationId,
    agency,
    granted_by: actor,
    granted_at: (await now()).toISOString(),
  });
  if (grantError) throw grantError;
  await audit(actor, "grant_agency", agency);
  const { data: link, error: linkError } = await db.auth.admin.generateLink({ type: "magiclink", email });
  if (linkError) throw linkError;
  return { agency, sign_in_link: link.properties.action_link };
}

export async function agencyOverview(organisationId: string, agency: string, touchpoint: number) {
  const { cards } = await themeCards(organisationId, touchpoint, null, agency);
  return {
    agency,
    touchpoint,
    themes: cards.map((card) =>
      "n" in card ? { driver: card.driver, enough: true, n: card.n, m: card.m } : { driver: card.driver, enough: false, message: card.message },
    ),
    job_match: await jobMatchCards(organisationId, agency),
    retention: await retention(organisationId, agency),
  };
}
