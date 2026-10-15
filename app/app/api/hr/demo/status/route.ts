import { demoStatus } from "@/lib/demo";
import { hrUser } from "@/lib/hr";

export async function GET(request: Request) {
  const user = await hrUser(request);
  if (!user) return new Response("Unauthorized", { status: 401 });
  if (user.role !== "hr_admin") return new Response("Forbidden", { status: 403 });
  const result = await demoStatus(user.organisationId);
  if ("error" in result) return Response.json(result, { status: 409 });
  return Response.json(result);
}
