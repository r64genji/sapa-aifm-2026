import { matchesSecret } from "@/lib/secret";
import { resetDemo } from "@/lib/seed";

export async function POST(request: Request) {
  const secret = process.env.DEMO_RESET_SECRET;
  if (!secret || !matchesSecret(request.headers.get("authorization"), `Bearer ${secret}`)) {
    return new Response("Unauthorized", { status: 401 });
  }
  const result = await resetDemo();
  if ("error" in result) return Response.json(result, { status: result.code });
  return Response.json(result);
}
