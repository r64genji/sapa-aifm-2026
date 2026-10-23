import { z } from "zod";
import { addTeam, teamLinks } from "@/lib/directory";
import { hrOrganisation, hrUser } from "@/lib/hr";

const Body = z.object({ team: z.string().trim().min(1).max(60), lead: z.string().trim().min(1).max(60) });

export async function GET(request: Request) {
  const organisation = await hrOrganisation(request);
  if (!organisation) return new Response("Unauthorized", { status: 401 });
  return Response.json(await teamLinks(organisation));
}

export async function POST(request: Request) {
  const user = await hrUser(request);
  if (!user) return new Response("Unauthorized", { status: 401 });
  const body = Body.safeParse(await request.json().catch(() => null));
  if (!body.success) return Response.json({ error: "team and lead are required" }, { status: 400 });
  const result = await addTeam(user.organisationId, user.actor, body.data.team, body.data.lead);
  if ("error" in result) return Response.json(result, { status: 409 });
  return Response.json(result, { status: 201 });
}
