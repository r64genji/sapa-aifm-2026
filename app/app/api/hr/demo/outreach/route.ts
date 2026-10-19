import { hrOrganisation } from "@/lib/hr";
import { sendOutreach } from "@/lib/scheduler";

export async function POST(request: Request) {
  const organisation = await hrOrganisation(request);
  if (!organisation) return new Response("Unauthorized", { status: 401 });
  const body = await request.json().catch(() => ({}));
  const result = await sendOutreach(organisation, typeof body.touchpoint === "number" ? body.touchpoint : undefined);
  if ("error" in result) return Response.json(result, { status: 409 });
  return Response.json(result);
}
