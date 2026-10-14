import organisations from "@/data/seed/organisations.json";
import { createAdminClient } from "@/lib/supabase/admin";

export async function resetDemo() {
  const { error } = await createAdminClient().rpc("reset_demo", {
    seed: { organisations },
  });
  if (error) throw error;
}
