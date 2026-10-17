import { z } from "zod";
import { sendBatch } from "@/lib/actions";
import { hrUser } from "@/lib/hr";

const Body = z.object({
  teams: z.array(z.object({ team: z.string().min(1), manager_id: z.string().uuid() })).min(1).max(50),
  due_in_days: z.number().int().min(1).max(90).default(7),
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await hrUser(request);
  if (!user) return new Response("Unauthorized", { status: 401 });
  const body = Body.safeParse(await request.json().catch(() => null));
  if (!body.success) return Response.json({ error: "teams must list each team with its manager" }, { status: 400 });
  const result = await sendBatch(user.organisationId, user.actor, (await params).id, body.data.teams, body.data.due_in_days);
  if ("code" in result) return Response.json(result, { status: result.code });
  return Response.json(result, { status: 201 });
}
