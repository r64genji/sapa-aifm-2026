import { z } from "zod";
import { hrUser } from "@/lib/hr";
import { linkHires } from "@/lib/managers";

const Body = z.object({ code_names: z.array(z.string().min(1)).min(1) });

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await hrUser(request);
  if (!user) return new Response("Unauthorized", { status: 401 });
  const body = Body.safeParse(await request.json().catch(() => null));
  if (!body.success) return Response.json({ error: "code_names must list at least one hire" }, { status: 400 });
  const result = await linkHires(user.organisationId, user.actor, (await params).id, body.data.code_names);
  if ("error" in result) return Response.json(result, { status: result.code });
  return Response.json(result);
}
