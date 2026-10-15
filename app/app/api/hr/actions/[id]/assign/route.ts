import { z } from "zod";
import { assignAction } from "@/lib/actions";
import { hrUser } from "@/lib/hr";

const Body = z.object({
  owner: z.union([z.literal("hr"), z.object({ manager_id: z.string().uuid() })]),
  due_in_days: z.number().int().min(1).max(90).default(7),
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await hrUser(request);
  if (!user) return new Response("Unauthorized", { status: 401 });
  const body = Body.safeParse(await request.json().catch(() => null));
  if (!body.success) return Response.json({ error: "owner must be hr or a manager" }, { status: 400 });
  const { owner, due_in_days } = body.data;
  const result = await assignAction(
    user.organisationId,
    user.actor,
    (await params).id,
    owner === "hr" ? null : owner.manager_id,
    due_in_days,
  );
  if ("code" in result) return Response.json(result, { status: result.code });
  return Response.json(result);
}
