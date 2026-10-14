import { z } from "zod";
import { hrUser } from "@/lib/hr";
import { inviteManager } from "@/lib/managers";

const Body = z.object({ display_name: z.string().min(1), email: z.email() });

export async function POST(request: Request) {
  const user = await hrUser(request);
  if (!user) return new Response("Unauthorized", { status: 401 });
  const body = Body.safeParse(await request.json().catch(() => null));
  if (!body.success) return Response.json({ error: "display_name and email are required" }, { status: 400 });
  const result = await inviteManager(user.organisationId, user.actor, body.data);
  if ("error" in result) return Response.json(result, { status: 422 });
  return Response.json(result, { status: 201 });
}
