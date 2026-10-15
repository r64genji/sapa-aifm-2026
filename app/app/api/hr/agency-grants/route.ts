import { z } from "zod";
import { grantAgency } from "@/lib/agency";
import { hrUser } from "@/lib/hr";

const Body = z.object({ email: z.email(), agency: z.string().trim().min(1) });

export async function POST(request: Request) {
  const user = await hrUser(request);
  if (!user) return new Response("Unauthorized", { status: 401 });
  if (user.role !== "hr_admin") return new Response("Forbidden", { status: 403 });
  const body = Body.safeParse(await request.json().catch(() => null));
  if (!body.success) return Response.json({ error: "email and agency are required" }, { status: 400 });
  const result = await grantAgency(user.organisationId, user.actor, body.data.email, body.data.agency);
  if ("error" in result) return Response.json(result, { status: 422 });
  return Response.json(result, { status: 201 });
}
