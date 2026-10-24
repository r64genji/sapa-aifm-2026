import { hrOrganisation } from "@/lib/hr";
import { teamLists } from "@/lib/teams";
import { themeDetails } from "@/lib/theme-detail";
import { ALL_DAYS } from "@/lib/themes";

export async function GET(request: Request) {
  const organisation = await hrOrganisation(request);
  if (!organisation) return new Response("Unauthorized", { status: 401 });
  const [details, teams] = await Promise.all([themeDetails(organisation, ALL_DAYS, null, false), teamLists(organisation)]);
  return Response.json({ details, teams });
}
