import { hrOrganisation } from "@/lib/hr";
import { retryReply } from "@/lib/replies";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const organisation = await hrOrganisation(request);
  if (!organisation) return new Response("Unauthorized", { status: 401 });
  const result = await retryReply(organisation, (await params).id);
  if ("error" in result) return Response.json(result, { status: result.code });
  return Response.json(result);
}
