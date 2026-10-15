import { stepAction } from "@/lib/actions";
import { hrUser } from "@/lib/hr";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await hrUser(request);
  if (!user) return new Response("Unauthorized", { status: 401 });
  const body = await request.json().catch(() => null);
  const result = await stepAction(user.organisationId, user.actor, null, (await params).id, "done", String(body?.outcome ?? ""));
  if ("error" in result) return Response.json(result, { status: result.code });
  return Response.json(result);
}
