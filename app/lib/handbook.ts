import { z } from "zod";
import { now } from "@/lib/clock";
import { audit } from "@/lib/signal";
import { createAdminClient } from "@/lib/supabase/admin";

export const plain = (text: string) =>
  text
    .normalize("NFKC")
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/^\s{0,3}(#{1,6}|[-*+]|\d+\.|>)\s+/gm, "")
    .replace(/[*_`~]/g, "")
    .replace(/\s+/g, " ")
    .trim();

const Page = z.object({
  path: z.string().regex(/^[a-z0-9-]+(\/[a-z0-9-]+)*\.md$/),
  language: z.enum(["en", "ms", "zh"]),
  body: z.string().trim().min(1).max(20000),
});
const Status = z.object({
  path: Page.shape.path,
  language: Page.shape.language,
  status: z.enum(["draft", "published"]),
});

export async function publishedPages(organisationId: string, language: string) {
  const { data, error } = await createAdminClient()
    .from("handbook_pages")
    .select("path, body")
    .eq("organisation_id", organisationId)
    .eq("language", language)
    .eq("status", "published")
    .order("path");
  if (error) throw error;
  return data as { path: string; body: string }[];
}

export async function listPages(organisationId: string) {
  const { data, error } = await createAdminClient()
    .from("handbook_pages")
    .select("path, language, body, status, updated_at")
    .eq("organisation_id", organisationId)
    .order("path")
    .order("language");
  if (error) throw error;
  return data;
}

export async function savePage(organisationId: string, actor: string, input: unknown) {
  const parsed = Page.safeParse(input);
  if (!parsed.success) return { error: "Invalid page", code: 422 };
  const { error } = await createAdminClient()
    .from("handbook_pages")
    .upsert(
      {
        ...parsed.data,
        organisation_id: organisationId,
        status: "draft",
        updated_by: actor,
        updated_at: (await now()).toISOString(),
      },
      { onConflict: "organisation_id,path,language" },
    );
  if (error) throw error;
  await audit(actor, "save_handbook_page", `${parsed.data.path}:${parsed.data.language}`);
  return { ...parsed.data, status: "draft" };
}

export async function setPageStatus(organisationId: string, actor: string, input: unknown) {
  const parsed = Status.safeParse(input);
  if (!parsed.success) return { error: "Invalid page", code: 422 };
  const { path, language, status } = parsed.data;
  const { data, error } = await createAdminClient()
    .from("handbook_pages")
    .update({ status, updated_by: actor, updated_at: (await now()).toISOString() })
    .eq("organisation_id", organisationId)
    .eq("path", path)
    .eq("language", language)
    .select("path");
  if (error) throw error;
  if (data.length === 0) return { error: "Not found", code: 404 };
  await audit(actor, status === "published" ? "publish_handbook_page" : "unpublish_handbook_page", `${path}:${language}`);
  return parsed.data;
}
