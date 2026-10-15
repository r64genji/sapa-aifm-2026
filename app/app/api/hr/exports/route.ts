import { z } from "zod";
import { hrUser } from "@/lib/hr";
import { exportPerson } from "@/lib/privacy";

const Body = z.object({ code_name: z.string().min(1), reason: z.string().trim().min(1) });

export async function POST(request: Request) {
  const user = await hrUser(request);
  if (!user) return new Response("Unauthorized", { status: 401 });
  if (user.role !== "hr_admin") return new Response("Forbidden", { status: 403 });
  const body = Body.safeParse(await request.json().catch(() => ({})));
  if (!body.success) return Response.json({ error: "code_name and a reason are required" }, { status: 400 });
  const result = await exportPerson(user.organisationId, user.actor, body.data.code_name, body.data.reason);
  if ("error" in result) return Response.json(result, { status: result.code });
  return Response.json(result);
}
