import { hrUser } from "@/lib/hr";
import { mask } from "@/lib/mask";
import { translation } from "@/lib/translate";

export async function GET(request: Request) {
  const user = await hrUser(request);
  if (!user) return new Response("Unauthorized", { status: 401 });
  const params = new URL(request.url).searchParams;
  const language = params.get("language") ?? "";
  const text = params.get("text")?.slice(0, 2000) ?? "";
  if (!text) return Response.json({ error: "Missing text" }, { status: 400 });
  const result = await translation(user.organisationId, language, text);
  return Response.json(result.translation ? { ...result, translation: { ...result.translation, text: mask(result.translation.text) } } : result);
}
