import { z } from "zod";
import { approveNotice } from "@/lib/actions";
import { hrUser } from "@/lib/hr";

const Body = z.union([
  z.object({ notes: z.object({ en: z.string(), ms: z.string(), zh: z.string().optional() }) }),
  z.object({ no_notice_reason: z.string() }),
]);

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await hrUser(request);
  if (!user) return new Response("Unauthorized", { status: 401 });
  const body = Body.safeParse(await request.json().catch(() => null));
  if (!body.success) return Response.json({ error: "Send notes in English and Bahasa Malaysia, or no_notice_reason" }, { status: 400 });
  const result = await approveNotice(user.organisationId, user.actor, (await params).id, body.data);
  if ("error" in result) return Response.json(result, { status: result.code });
  return Response.json(result);
}
