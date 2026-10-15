import { agencyOverview, agencyUser } from "@/lib/agency";
import { themeQuery } from "@/lib/themes-query";

export async function GET(request: Request) {
  const user = await agencyUser(request);
  if (!user) return new Response("Unauthorized", { status: 401 });
  const query = themeQuery(request);
  if (!query) return Response.json({ error: "Invalid touchpoint" }, { status: 400 });
  return Response.json(await agencyOverview(user.organisationId, user.agency, query.touchpoint));
}
