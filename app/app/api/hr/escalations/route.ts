import { listEscalations } from "@/lib/escalations";
import { hrOrganisation } from "@/lib/hr";

export async function GET(request: Request) {
  const organisation = await hrOrganisation(request);
  if (!organisation) return new Response("Unauthorized", { status: 401 });
  return Response.json(await listEscalations(organisation));
}
