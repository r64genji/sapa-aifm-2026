import { hrUser } from "@/lib/hr";
import { translateReply } from "@/lib/replies";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await hrUser(request);
  if (!user) return new Response("Unauthorized", { status: 401 });
  const result = await translateReply(user.organisationId, (await params).id);
  if ("code" in result) return Response.json(result, { status: result.code });
  return Response.json(result);
}
