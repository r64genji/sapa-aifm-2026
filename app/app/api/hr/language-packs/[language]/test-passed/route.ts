import { z } from "zod";
import { passPackTest } from "@/lib/directory";
import { hrUser } from "@/lib/hr";
import { audit } from "@/lib/signal";

const Body = z.object({ results_file: z.string().regex(/^eval\/results\/[\w.-]+\.json$/) });

export async function POST(request: Request, { params }: { params: Promise<{ language: string }> }) {
  const user = await hrUser(request);
  if (!user) return new Response("Unauthorized", { status: 401 });
  if (user.role !== "hr_admin") return new Response("Forbidden", { status: 403 });
  const body = Body.safeParse(await request.json().catch(() => null));
  if (!body.success) return Response.json({ error: "results_file is a path under eval/results/" }, { status: 400 });
  const { language } = await params;
  if (!(await passPackTest(user.organisationId, language, body.data.results_file))) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  await audit(user.actor, "pass_language_pack_test", `${language}:${body.data.results_file}`);
  return Response.json({ language, results_file: body.data.results_file });
}
