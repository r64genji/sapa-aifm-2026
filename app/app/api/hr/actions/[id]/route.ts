import { z } from "zod";
import { editAction } from "@/lib/actions";
import { hrUser } from "@/lib/hr";

const Body = z.object({
  title: z.string().min(1).optional(),
  steps: z.string().min(1).optional(),
  library_entry_id: z.string().uuid().optional(),
  scope: z
    .discriminatedUnion("type", [
      z.object({ type: z.literal("person"), code_name: z.string() }),
      z.object({ type: z.literal("team"), team: z.string() }),
      z.object({ type: z.literal("intake"), month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/) }),
    ])
    .optional(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await hrUser(request);
  if (!user) return new Response("Unauthorized", { status: 401 });
  const body = Body.safeParse(await request.json().catch(() => null));
  if (!body.success) return Response.json({ error: "Invalid title, steps or scope" }, { status: 400 });
  const result = await editAction(user.organisationId, user.actor, (await params).id, body.data);
  if ("error" in result) return Response.json(result, { status: result.code });
  return Response.json(result);
}
