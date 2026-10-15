import { managerActions } from "@/lib/actions";
import { managerUser } from "@/lib/managers";

export async function GET(request: Request) {
  const manager = await managerUser(request);
  if (!manager) return new Response("Unauthorized", { status: 401 });
  return Response.json(await managerActions(manager.organisationId, manager.managerId));
}
