import { z } from "zod";
import { activatePack } from "@/lib/directory";
import { hrUser } from "@/lib/hr";
import { audit } from "@/lib/signal";

const Body = z.object({ checker_name: z.string().trim().min(1) });

export async function POST(request: Request, { params }: { params: Promise<{ language: string }> }) {
  const user = await hrUser(request);
  if (!user) return new Response("Unauthorized", { status: 401 });
  const body = Body.safeParse(await request.json().catch(() => null));
  if (!body.success) return Response.json({ error: "checker_name is required" }, { status: 400 });
  const { language } = await params;
  if (!(await activatePack(user.organisationId, language, body.data.checker_name))) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  await audit(user.actor, "activate_language_pack", language);
  return Response.json({ language, checker_name: body.data.checker_name });
}
