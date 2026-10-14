import { matchesSecret } from "@/lib/secret";
import { dispatch } from "@/lib/scheduler";

export async function POST(request: Request) {
  const secret = process.env.DISPATCH_SECRET;
  if (!secret || !matchesSecret(request.headers.get("authorization"), `Bearer ${secret}`)) {
    return new Response("Unauthorized", { status: 401 });
  }
  return Response.json({ ok: true, sent: await dispatch() });
}
