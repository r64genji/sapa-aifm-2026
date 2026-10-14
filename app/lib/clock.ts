import { createAdminClient } from "@/lib/supabase/admin";

export async function now(): Promise<Date> {
  if (process.env.SAPA_TEST === "1") {
    const { data, error } = await createAdminClient()
      .from("test_clock")
      .select("now")
      .single();
    if (error) throw error;
    return new Date(data.now);
  }
  return new Date();
}
