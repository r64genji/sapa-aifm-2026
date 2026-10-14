import { setContacts } from "@/lib/escalations";
import { hrUser } from "@/lib/hr";

export async function PUT(request: Request) {
  const user = await hrUser(request);
  if (!user) return new Response("Unauthorized", { status: 401 });
  const result = await setContacts(user.organisationId, await request.json(), user.actor);
  if ("error" in result) return Response.json(result, { status: result.code });
  return Response.json(result);
}
