import { z } from "zod";
import { hrUser } from "@/lib/hr";
import { workerVoiceExport } from "@/lib/worker-voice";

const Body = z.object({ intake: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/) });

export async function POST(request: Request) {
  const user = await hrUser(request);
  if (!user) return new Response("Unauthorized", { status: 401 });
  const body = Body.safeParse(await request.json().catch(() => null));
  if (!body.success) return Response.json({ error: "intake is YYYY-MM" }, { status: 400 });
  return Response.json(await workerVoiceExport(user.organisationId, user.actor, body.data.intake));
}
