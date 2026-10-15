import { z } from "zod";
import { Tag } from "@/lib/classify";
import { hrUser } from "@/lib/hr";
import { reviewReply } from "@/lib/replies";

const Change = z.object({ drivers: Tag.shape.drivers.optional(), context_tags: Tag.shape.context_tags.optional(), serious: z.boolean().optional() });

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await hrUser(request);
  if (!user) return new Response("Unauthorized", { status: 401 });
  const change = Change.safeParse(await request.json().catch(() => ({})));
  if (!change.success) return Response.json({ error: "Invalid tags" }, { status: 400 });
  const result = await reviewReply(user.organisationId, user.actor, (await params).id, change.data);
  if ("error" in result) return Response.json(result, { status: result.code });
  return Response.json(result);
}
