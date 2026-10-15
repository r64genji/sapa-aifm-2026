import { listEscalations } from "@/lib/escalations";
import { hrUser } from "@/lib/hr";

export async function GET(request: Request) {
  const user = await hrUser(request);
  if (!user) return new Response("Unauthorized", { status: 401 });
  const preview = new URL(request.url).searchParams.has("preview") ? user.actor : undefined;
  return Response.json(await listEscalations(user.organisationId, preview));
}
