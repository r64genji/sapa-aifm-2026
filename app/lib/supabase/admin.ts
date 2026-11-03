import { createClient } from "@supabase/supabase-js";

async function patient(input: RequestInfo | URL, init?: RequestInit) {
  for (let tries = 1; ; tries++) {
    const res = await fetch(input, init);
    if (res.status !== 504 || tries === 6) return res;
    await new Promise((resolve) => setTimeout(resolve, 500 + Math.random() * 1500 * tries));
  }
}

export function createAdminClient() {
  return createClient(
    process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false }, global: { fetch: patient } },
  );
}
