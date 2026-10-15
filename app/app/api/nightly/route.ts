import { releaseAlerts } from "@/lib/actions";
import { now } from "@/lib/clock";
import { matchesSecret } from "@/lib/secret";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const secret = process.env.DISPATCH_SECRET;
  if (!secret || !matchesSecret(request.headers.get("authorization"), `Bearer ${secret}`)) {
    return new Response("Unauthorized", { status: 401 });
  }
  const { data, error } = await createAdminClient().rpc("take_snapshots", { at: (await now()).toISOString() });
  if (error) throw error;
  return Response.json({ ok: true, snapshots: data, alerts: await releaseAlerts() });
}
