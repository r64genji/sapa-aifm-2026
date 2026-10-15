import { z } from "zod";
import { draftOwnFix } from "@/lib/actions";
import { hrUser } from "@/lib/hr";

const Body = z.object({ name: z.string().trim().min(1).max(60) });

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await hrUser(request);
  if (!user) return new Response("Unauthorized", { status: 401 });
  const body = Body.safeParse(await request.json().catch(() => null));
  if (!body.success) return Response.json({ error: "A name of 1 to 60 characters is needed" }, { status: 400 });
  const result = await draftOwnFix(user.organisationId, user.actor, (await params).id, body.data.name);
  if ("error" in result) return Response.json(result, { status: result.code });
  return Response.json(result);
}
