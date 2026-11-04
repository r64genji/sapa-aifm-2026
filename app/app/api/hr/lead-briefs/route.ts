import { hrOrganisation } from "@/lib/hr";
import { leadBriefs } from "@/lib/leads";

export async function GET(request: Request) {
  const organisation = await hrOrganisation(request);
  if (!organisation) return new Response("Unauthorized", { status: 401 });
  return Response.json(await leadBriefs(organisation, new URL(request.url).searchParams.get("driver")));
}
