import { hrOrganisation } from "@/lib/hr";
import { themeGroups } from "@/lib/theme-groups";
import { themeQuery } from "@/lib/themes-query";
import { DRIVERS } from "@/lib/themes";

export async function GET(request: Request, { params }: { params: Promise<{ driver: string }> }) {
  const organisation = await hrOrganisation(request);
  if (!organisation) return new Response("Unauthorized", { status: 401 });
  const { driver } = await params;
  if (!DRIVERS.includes(driver)) return Response.json({ error: "Not found" }, { status: 404 });
  const query = themeQuery(request);
  if (!query) return Response.json({ error: "Invalid touchpoint or month" }, { status: 400 });
  return Response.json(await themeGroups(organisation, driver, query.touchpoint));
}
