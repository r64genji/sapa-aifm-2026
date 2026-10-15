import { z } from "zod";
import { hrUser } from "@/lib/hr";
import { saveBaseline } from "@/lib/impact";

const Body = z
  .object({ kept: z.number().int().min(0), of: z.number().int().min(1) })
  .refine((body) => body.kept <= body.of);

export async function PUT(request: Request) {
  const user = await hrUser(request);
  if (!user) return new Response("Unauthorized", { status: 401 });
  if (user.role !== "hr_admin") return new Response("Forbidden", { status: 403 });
  const body = Body.safeParse(await request.json().catch(() => null));
  if (!body.success) return Response.json({ error: "kept and of are whole numbers, kept not above of" }, { status: 400 });
  await saveBaseline(user.organisationId, user.actor, body.data.kept, body.data.of);
  return Response.json(body.data);
}
