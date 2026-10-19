import { hrUser } from "@/lib/hr";
import { resetDemo } from "@/lib/seed";

export async function POST(request: Request) {
  const user = await hrUser(request);
  if (!user) return new Response("Unauthorized", { status: 401 });
  if (user.role !== "hr_admin") return new Response("Forbidden", { status: 403 });
  const body = await request.json().catch(() => ({}));
  const result = await resetDemo(body.full === true);
  if ("error" in result) return Response.json(result, { status: result.code });
  return Response.json(result);
}
