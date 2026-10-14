import { markEscalation } from "@/lib/escalations";
import { hrUser } from "@/lib/hr";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await hrUser(request);
  if (!user) return new Response("Unauthorized", { status: 401 });
  const result = await markEscalation(user.organisationId, (await params).id, "contact_recorded_at", user.actor);
  if ("error" in result) return Response.json(result, { status: result.code });
  return Response.json(result);
}
