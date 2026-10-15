import { z } from "zod";
import { hrUser } from "@/lib/hr";
import { setHolidays } from "@/lib/scheduler";
import { audit } from "@/lib/signal";

const Body = z.object({ holidays: z.array(z.iso.date()) });

export async function PUT(request: Request) {
  const user = await hrUser(request);
  if (!user) return new Response("Unauthorized", { status: 401 });
  const body = Body.safeParse(await request.json().catch(() => null));
  if (!body.success) return Response.json({ error: "holidays must be a list of dates (YYYY-MM-DD)" }, { status: 400 });
  await setHolidays(user.organisationId, body.data.holidays);
  await audit(user.actor, "change_setting", "holidays");
  return Response.json(body.data);
}
