import { z } from "zod";
import { hrUser } from "@/lib/hr";
import { setFollowUp } from "@/lib/replies";

const Body = z.object({ value: z.boolean() });

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await hrUser(request);
  if (!user) return new Response("Unauthorized", { status: 401 });
  const body = Body.safeParse(await request.json().catch(() => null));
  if (!body.success) return Response.json({ error: "value must be true or false" }, { status: 400 });
  const result = await setFollowUp(user.organisationId, user.actor, (await params).id, body.data.value);
  if ("error" in result) return Response.json(result, { status: result.code });
  return Response.json(result);
}
