import { hrOrganisation } from "@/lib/hr";
import { themeNarrative } from "@/lib/themes";
import { themeQuery } from "@/lib/themes-query";

export async function GET(request: Request) {
  const organisation = await hrOrganisation(request);
  if (!organisation) return new Response("Unauthorized", { status: 401 });
  const query = themeQuery(request);
  if (!query) return Response.json({ error: "Invalid touchpoint or month" }, { status: 400 });
  return Response.json(await themeNarrative(organisation, query.touchpoint, query.month));
}
