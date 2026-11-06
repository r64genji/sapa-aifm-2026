import { nudgeFixes } from "@/lib/actions";
import { hrOrganisation } from "@/lib/hr";

export async function POST(request: Request) {
  const organisation = await hrOrganisation(request);
  if (!organisation) return new Response("Unauthorized", { status: 401 });
  return Response.json({ sent: await nudgeFixes(organisation) });
}
