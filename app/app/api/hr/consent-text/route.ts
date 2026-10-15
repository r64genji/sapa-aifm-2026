import { hrUser } from "@/lib/hr";
import { packs } from "@/lib/packs";

export async function GET(request: Request) {
  const user = await hrUser(request);
  if (!user) return new Response("Unauthorized", { status: 401 });
  return Response.json({
    ms: { version: packs.ms.consentVersion, text: packs.ms.consent },
    en: { version: packs.en.consentVersion, text: packs.en.consent },
  });
}
