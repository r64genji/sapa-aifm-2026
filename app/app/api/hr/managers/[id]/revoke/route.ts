import { hrUser } from "@/lib/hr";
import { revokeManager } from "@/lib/managers";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await hrUser(request);
  if (!user) return new Response("Unauthorized", { status: 401 });
  const result = await revokeManager(user.organisationId, user.actor, (await params).id);
  if ("error" in result) return Response.json(result, { status: result.code });
  return Response.json(result);
}
