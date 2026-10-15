import { hrUser } from "@/lib/hr";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const user = await hrUser(request);
  if (!user) return new Response("Unauthorized", { status: 401 });
  const db = createAdminClient();
  const [{ data: org, error }, { data: account }] = await Promise.all([
    db.from("organisations").select("name, demo_mode").eq("id", user.organisationId).single(),
    db.auth.admin.getUserById(user.actor),
  ]);
  if (error) throw error;
  const metadata = account.user?.app_metadata ?? {};
  return Response.json({
    name: metadata.display_name ?? account.user?.email?.split("@")[0] ?? "HR",
    role: user.role,
    organisation: org.name,
    demo_mode: org.demo_mode,
  });
}
