import { z } from "zod";
import { draftAction, listActions } from "@/lib/actions";
import { hrUser } from "@/lib/hr";

const Body = z.object({ driver: z.string(), response_id: z.string().uuid().optional() });

export async function POST(request: Request) {
  const user = await hrUser(request);
  if (!user) return new Response("Unauthorized", { status: 401 });
  const body = Body.safeParse(await request.json().catch(() => null));
  if (!body.success) return Response.json({ error: "driver is required" }, { status: 400 });
  const result = await draftAction(user.organisationId, user.actor, body.data);
  if ("error" in result) return Response.json(result, { status: result.code });
  return Response.json(result, { status: 201 });
}

export async function GET(request: Request) {
  const user = await hrUser(request);
  if (!user) return new Response("Unauthorized", { status: 401 });
  return Response.json(await listActions(user.organisationId));
}
