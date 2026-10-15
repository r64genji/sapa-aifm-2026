import { dismissAction } from "@/lib/actions";
import { hrUser } from "@/lib/hr";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await hrUser(request);
  if (!user) return new Response("Unauthorized", { status: 401 });
  const body = await request.json().catch(() => null);
  const result = await dismissAction(user.organisationId, user.actor, (await params).id, String(body?.reason ?? ""));
  if ("error" in result) return Response.json(result, { status: result.code });
  return Response.json(result);
}
