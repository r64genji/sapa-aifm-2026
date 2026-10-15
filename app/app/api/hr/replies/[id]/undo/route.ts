import { z } from "zod";
import { Tag } from "@/lib/classify";
import { hrUser } from "@/lib/hr";
import { undoReview } from "@/lib/replies";

const Before = z.object({
  status: z.enum(["ok", "needs_review", "awaiting_ai"]),
  drivers: Tag.shape.drivers,
  context_tags: Tag.shape.context_tags,
  changed_by_hr: z.boolean(),
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await hrUser(request);
  if (!user) return new Response("Unauthorized", { status: 401 });
  const before = Before.safeParse(await request.json().catch(() => null));
  if (!before.success) return Response.json({ error: "Invalid labels" }, { status: 400 });
  const result = await undoReview(user.organisationId, user.actor, (await params).id, before.data);
  if ("error" in result) return Response.json(result, { status: result.code });
  return Response.json(result);
}
