import { hrOrganisation } from "@/lib/hr";
import { DRIVERS, themeDetail, themeTeam } from "@/lib/theme-detail";
import { themeQuery } from "@/lib/themes-query";

export async function GET(request: Request, { params }: { params: Promise<{ driver: string }> }) {
  const organisation = await hrOrganisation(request);
  if (!organisation) return new Response("Unauthorized", { status: 401 });
  const { driver } = await params;
  if (!DRIVERS.includes(driver)) return Response.json({ error: "Not found" }, { status: 404 });
  const query = themeQuery(request);
  if (!query) return Response.json({ error: "Invalid touchpoint or month" }, { status: 400 });
  const team = themeTeam(request);
  if (team.error !== undefined) return Response.json({ error: team.error }, { status: 400 });
  return Response.json(await themeDetail(organisation, driver, query.touchpoint, team.team));
}
