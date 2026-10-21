import { z } from "zod";
import { hrUser } from "@/lib/hr";
import { audit } from "@/lib/signal";
import { setMinGroupSize } from "@/lib/themes";

const Body = z.object({ min_group_size: z.number().int().min(1) });

export async function PUT(request: Request) {
  const user = await hrUser(request);
  if (!user) return new Response("Unauthorized", { status: 401 });
  const body = Body.safeParse(await request.json().catch(() => null));
  if (!body.success) return Response.json({ error: "min_group_size must be a whole number of at least 1" }, { status: 400 });
  await setMinGroupSize(user.organisationId, body.data.min_group_size);
  await audit(user.actor, "change_setting", "min_group_size");
  return Response.json(body.data);
}
