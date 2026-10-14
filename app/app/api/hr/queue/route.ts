import { hrUser } from "@/lib/hr";
import { readQueue } from "@/lib/replies";

export async function GET(request: Request) {
  const user = await hrUser(request);
  if (!user) return new Response("Unauthorized", { status: 401 });
  return Response.json(await readQueue(user.organisationId, user.actor));
}
