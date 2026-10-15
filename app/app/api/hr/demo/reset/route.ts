import { hrUser } from "@/lib/hr";
import { resetDemo } from "@/lib/seed";

export async function POST(request: Request) {
  const user = await hrUser(request);
  if (!user) return new Response("Unauthorized", { status: 401 });
  if (user.role !== "hr_admin") return new Response("Forbidden", { status: 403 });
  const result = await resetDemo();
  if ("error" in result) return Response.json(result, { status: result.code });
  const live = result.invites.find((invite) => invite.code_name === "Live hire");
  return Response.json({ invite_link: live?.invite_link ?? null });
}
