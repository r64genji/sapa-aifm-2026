import { z } from "zod";
import { hrUser } from "@/lib/hr";
import { setHoldNewTags } from "@/lib/quality";
import { audit } from "@/lib/signal";

const Body = z.object({ value: z.boolean() });

export async function PUT(request: Request) {
  const user = await hrUser(request);
  if (!user) return new Response("Unauthorized", { status: 401 });
  if (user.role !== "hr_admin") return new Response("Forbidden", { status: 403 });
  const body = Body.safeParse(await request.json().catch(() => null));
  if (!body.success) return Response.json({ error: "value must be true or false" }, { status: 400 });
  await setHoldNewTags(user.organisationId, body.data.value);
  await audit(user.actor, "change_setting", "hold_new_tags");
  return Response.json(body.data);
}
