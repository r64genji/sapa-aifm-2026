import { z } from "zod";
import { draftAction, listActions, sendLibraryFix } from "@/lib/actions";
import { hrUser } from "@/lib/hr";

const Body = z.object({ driver: z.string(), response_id: z.string().uuid().optional(), send_library_entry_id: z.string().uuid().optional() });

export async function POST(request: Request) {
  const user = await hrUser(request);
  if (!user) return new Response("Unauthorized", { status: 401 });
  const body = Body.safeParse(await request.json().catch(() => null));
  if (!body.success) return Response.json({ error: "driver is required" }, { status: 400 });
  const { send_library_entry_id: entryId, ...draft } = body.data;
  if (entryId && !draft.response_id) return Response.json({ error: "response_id is required" }, { status: 400 });
  const result = entryId
    ? await sendLibraryFix(user.organisationId, user.actor, { driver: draft.driver, response_id: draft.response_id!, library_entry_id: entryId })
    : await draftAction(user.organisationId, user.actor, draft);
  if ("error" in result) return Response.json(result, { status: result.code });
  return Response.json(result, { status: 201 });
}

export async function GET(request: Request) {
  const user = await hrUser(request);
  if (!user) return new Response("Unauthorized", { status: 401 });
  return Response.json(await listActions(user.organisationId));
}
