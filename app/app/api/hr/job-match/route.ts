import { hrOrganisation } from "@/lib/hr";
import { jobMatchCards } from "@/lib/jobmatch";

export async function GET(request: Request) {
  const organisation = await hrOrganisation(request);
  if (!organisation) return new Response("Unauthorized", { status: 401 });
  return Response.json({ cards: await jobMatchCards(organisation) });
}
