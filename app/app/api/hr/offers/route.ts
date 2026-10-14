import { hrOrganisation } from "@/lib/hr";
import { listOffers } from "@/lib/offers";

export async function GET(request: Request) {
  const organisationId = await hrOrganisation(request);
  if (!organisationId) return new Response("Unauthorized", { status: 401 });
  return Response.json(await listOffers(organisationId));
}
