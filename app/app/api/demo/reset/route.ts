import { matchesSecret } from "@/lib/secret";
import { resetDemo } from "@/lib/seed";

export async function POST(request: Request) {
  const secret = process.env.DISPATCH_SECRET;
  if (!secret || !matchesSecret(request.headers.get("authorization"), `Bearer ${secret}`)) {
    return new Response("Unauthorized", { status: 401 });
  }
  await resetDemo();
  return Response.json({ ok: true });
}
