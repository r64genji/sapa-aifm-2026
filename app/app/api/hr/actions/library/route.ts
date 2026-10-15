import { hrUser } from "@/lib/hr";
import { libraryWithEvidence } from "@/lib/resolution";

export async function GET(request: Request) {
  const user = await hrUser(request);
  if (!user) return new Response("Unauthorized", { status: 401 });
  const driver = new URL(request.url).searchParams.get("driver") ?? undefined;
  return Response.json(await libraryWithEvidence(user.organisationId, driver));
}
