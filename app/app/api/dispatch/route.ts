import { matchesSecret } from "@/lib/secret";

export async function POST(request: Request) {
  const secret = process.env.DISPATCH_SECRET;
  if (!secret || !matchesSecret(request.headers.get("authorization"), `Bearer ${secret}`)) {
    return new Response("Unauthorized", { status: 401 });
  }
  return Response.json({ ok: true });
}
