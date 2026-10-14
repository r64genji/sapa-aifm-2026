import { managerSnapshots, managerUser } from "@/lib/managers";

export async function GET(request: Request) {
  const user = await managerUser(request);
  if (!user) return new Response("Unauthorized", { status: 401 });
  return Response.json(await managerSnapshots(user.token));
}
