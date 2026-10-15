import { hrOrganisation } from "@/lib/hr";
import { impact } from "@/lib/impact";

export async function GET(request: Request) {
  const organisation = await hrOrganisation(request);
  if (!organisation) return new Response("Unauthorized", { status: 401 });
  return Response.json(await impact(organisation));
}
