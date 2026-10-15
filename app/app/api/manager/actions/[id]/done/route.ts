import { stepAction } from "@/lib/actions";
import { managerUser } from "@/lib/managers";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const manager = await managerUser(request);
  if (!manager) return new Response("Unauthorized", { status: 401 });
  const body = await request.json().catch(() => null);
  const result = await stepAction(
    manager.organisationId,
    manager.managerId,
    manager.managerId,
    (await params).id,
    "done",
    String(body?.outcome ?? ""),
  );
  if ("error" in result) return Response.json(result, { status: result.code });
  return Response.json(result);
}
