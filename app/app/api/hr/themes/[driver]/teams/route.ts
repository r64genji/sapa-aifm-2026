import { hrOrganisation } from "@/lib/hr";
import { teamList } from "@/lib/teams";
import { DRIVERS } from "@/lib/themes";

export async function GET(request: Request, { params }: { params: Promise<{ driver: string }> }) {
  const organisation = await hrOrganisation(request);
  if (!organisation) return new Response("Unauthorized", { status: 401 });
  const { driver } = await params;
  if (!DRIVERS.includes(driver)) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json(await teamList(organisation, driver));
}
