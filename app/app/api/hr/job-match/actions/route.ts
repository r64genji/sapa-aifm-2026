import { z } from "zod";
import { draftHiringAction } from "@/lib/actions";
import { hrUser } from "@/lib/hr";

const Body = z.object({ role: z.string().min(1) });

export async function POST(request: Request) {
  const user = await hrUser(request);
  if (!user) return new Response("Unauthorized", { status: 401 });
  const body = Body.safeParse(await request.json().catch(() => null));
  if (!body.success) return Response.json({ error: "role is required" }, { status: 400 });
  const result = await draftHiringAction(user.organisationId, user.actor, body.data.role);
  if ("error" in result) return Response.json(result, { status: result.code });
  return Response.json(result, { status: 201 });
}
