import { z } from "zod";
import { closeEscalation } from "@/lib/escalations";
import { hrUser } from "@/lib/hr";

const Body = z.object({ send_closure: z.boolean().default(false), not_serious: z.boolean().default(false) });

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await hrUser(request);
  if (!user) return new Response("Unauthorized", { status: 401 });
  const body = Body.safeParse(await request.json().catch(() => ({})));
  if (!body.success) return Response.json({ error: "send_closure and not_serious must be true or false" }, { status: 400 });
  const result = await closeEscalation(user.organisationId, (await params).id, user.actor, body.data.send_closure, body.data.not_serious);
  if ("error" in result && "code" in result) return Response.json(result, { status: result.code });
  return Response.json(result);
}
