import { z } from "zod";
import { markLeft } from "@/lib/exit";
import { hrUser } from "@/lib/hr";

const Body = z.object({ code_name: z.string().min(1), reason: z.enum(["resigned", "ended_by_company"]) });

export async function POST(request: Request) {
  const user = await hrUser(request);
  if (!user) return new Response("Unauthorized", { status: 401 });
  const body = Body.safeParse(await request.json().catch(() => ({})));
  if (!body.success) {
    return Response.json({ error: "code_name and reason (resigned or ended_by_company) are needed" }, { status: 400 });
  }
  const result = await markLeft(user.organisationId, user.actor, body.data.code_name, body.data.reason);
  if ("error" in result) return Response.json(result, { status: result.code });
  return Response.json(result);
}
