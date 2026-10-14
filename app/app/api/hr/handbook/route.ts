import { listPages, savePage } from "@/lib/handbook";
import { hrUser } from "@/lib/hr";

export async function GET(request: Request) {
  const user = await hrUser(request);
  if (!user) return new Response("Unauthorized", { status: 401 });
  return Response.json(await listPages(user.organisationId));
}

export async function PUT(request: Request) {
  const user = await hrUser(request);
  if (!user) return new Response("Unauthorized", { status: 401 });
  const result = await savePage(user.organisationId, user.actor, await request.json().catch(() => null));
  if ("error" in result) return Response.json(result, { status: result.code });
  return Response.json(result);
}
