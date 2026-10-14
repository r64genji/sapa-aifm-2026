import { addHire, listHires } from "@/lib/directory";
import { hrOrganisation } from "@/lib/hr";

export async function POST(request: Request) {
  const organisation = await hrOrganisation(request);
  if (!organisation) return new Response("Unauthorized", { status: 401 });
  const result = await addHire(organisation, await request.json());
  if ("error" in result) return Response.json(result, { status: 422 });
  return Response.json(result, { status: 201 });
}

export async function GET(request: Request) {
  const organisation = await hrOrganisation(request);
  if (!organisation) return new Response("Unauthorized", { status: 401 });
  return Response.json(await listHires(organisation));
}
