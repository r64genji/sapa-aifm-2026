import { getEscalation } from "@/lib/escalations";
import { hrUser } from "@/lib/hr";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await hrUser(request);
  if (!user) return new Response("Unauthorized", { status: 401 });
  const result = await getEscalation(user.organisationId, (await params).id, user.actor);
  if ("error" in result) return Response.json(result, { status: result.code });
  return Response.json(result);
}
