import { setPageStatus } from "@/lib/handbook";
import { hrUser } from "@/lib/hr";

export async function POST(request: Request) {
  const user = await hrUser(request);
  if (!user) return new Response("Unauthorized", { status: 401 });
  const result = await setPageStatus(user.organisationId, user.actor, await request.json().catch(() => null));
  if ("error" in result) return Response.json(result, { status: result.code });
  return Response.json(result);
}
