import { z } from "zod";
import { hrUser } from "@/lib/hr";
import { saveOutcome } from "@/lib/impact";

const Body = z
  .object({
    intake: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),
    agency: z.string().trim().min(1).nullable().default(null),
    hired: z.number().int().min(0),
    employed: z.number().int().min(0),
  })
  .refine((body) => body.employed <= body.hired);

export async function PUT(request: Request) {
  const user = await hrUser(request);
  if (!user) return new Response("Unauthorized", { status: 401 });
  const body = Body.safeParse(await request.json().catch(() => null));
  if (!body.success) {
    return Response.json({ error: "intake (YYYY-MM), hired and employed (not more than hired) are needed" }, { status: 400 });
  }
  const result = await saveOutcome(user.organisationId, user.actor, body.data);
  if ("error" in result) return Response.json(result, { status: result.code });
  return Response.json(result);
}
