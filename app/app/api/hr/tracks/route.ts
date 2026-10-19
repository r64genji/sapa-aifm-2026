import { z } from "zod";
import { hrUser } from "@/lib/hr";
import { audit } from "@/lib/signal";
import { BANK, saveTracks, tracksOf } from "@/lib/tracks";

const Tracks = z
  .array(
    z.object({
      id: z.enum(["new_hire", "employee"]),
      name: z.string().trim().min(1).max(40),
      days: z.array(z.number().int().min(1).max(1500)).min(1),
      questions: z.array(z.enum(BANK as [string, ...string[]])).min(1),
    }),
  )
  .length(2)
  .refine((tracks) => new Set(tracks.map((t) => t.id)).size === 2)
  .refine((tracks) => {
    const days = tracks.flatMap((t) => t.days);
    return new Set(days).size === days.length;
  });
const Body = z.object({ tracks: Tracks });

export async function GET(request: Request) {
  const user = await hrUser(request);
  if (!user) return new Response("Unauthorized", { status: 401 });
  return Response.json(await tracksOf(user.organisationId));
}

export async function PUT(request: Request) {
  const user = await hrUser(request);
  if (!user) return new Response("Unauthorized", { status: 401 });
  if (user.role !== "hr_admin") return new Response("Forbidden", { status: 403 });
  const body = Body.safeParse(await request.json().catch(() => null));
  if (!body.success) return Response.json({ error: "Each track needs a name, at least one day and one question, and no day can be in both tracks" }, { status: 400 });
  const tracks = await saveTracks(user.organisationId, body.data.tracks as Parameters<typeof saveTracks>[1]);
  await audit(user.actor, "change_setting", "checkin_tracks");
  return Response.json(tracks);
}
