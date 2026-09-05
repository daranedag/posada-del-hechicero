"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/admin";
import { SITE_SECTION_KEYS } from "@/lib/data/site-content";
import { adminInsforge } from "@/lib/insforge/admin";

const sectionKeySchema = z.enum(SITE_SECTION_KEYS);
const itemTypeSchema = z.enum(["social", "address", "hours", "contact", "text"]);
const optionalUrlSchema = z.preprocess(
  (value) => (String(value ?? "").trim() ? String(value).trim() : null),
  z.string().url().max(1000).nullable(),
);

const sectionSchema = z.object({
  key: sectionKeySchema,
  kicker: z.string().trim().max(160),
  title: z.string().trim().max(220),
  body: z.string().trim().max(3000),
  sortOrder: z.coerce.number().int().min(-1000).max(1000),
  isVisible: z.boolean(),
});

const itemSchema = z.object({
  sectionKey: sectionKeySchema,
  itemType: itemTypeSchema,
  title: z.string().trim().min(1).max(160),
  body: z.string().trim().max(1000),
  href: optionalUrlSchema,
  sortOrder: z.coerce.number().int().min(-1000).max(1000),
  isVisible: z.boolean(),
});

function refreshSiteAdmin() {
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/sitio");
}

function siteRedirect(result: "guardado" | "eliminado" | "error"): never {
  redirect(`/admin/sitio?estado=${result}`);
}

export async function updateSiteSectionAction(formData: FormData) {
  await requireAdmin();
  const parsed = sectionSchema.safeParse({
    key: formData.get("key"),
    kicker: formData.get("kicker"),
    title: formData.get("title"),
    body: formData.get("body"),
    sortOrder: formData.get("sortOrder"),
    isVisible: formData.get("isVisible") === "on",
  });
  if (!parsed.success) siteRedirect("error");

  const { key, kicker, title, body, sortOrder, isVisible } = parsed.data;
  const { error } = await adminInsforge.database.from("pdh_site_sections").update({
    kicker,
    title,
    body,
    sort_order: sortOrder,
    is_visible: key === "hero" ? true : isVisible,
  }).eq("key", key);

  if (error) siteRedirect("error");
  refreshSiteAdmin();
  siteRedirect("guardado");
}

export async function createSiteItemAction(formData: FormData) {
  await requireAdmin();
  const parsed = itemSchema.safeParse({
    sectionKey: formData.get("sectionKey"),
    itemType: formData.get("itemType"),
    title: formData.get("title"),
    body: formData.get("body"),
    href: formData.get("href"),
    sortOrder: formData.get("sortOrder"),
    isVisible: formData.get("isVisible") === "on",
  });
  if (!parsed.success) siteRedirect("error");

  const { sectionKey, itemType, title, body, href, sortOrder, isVisible } = parsed.data;
  const { error } = await adminInsforge.database.from("pdh_site_items").insert([{
    section_key: sectionKey,
    item_type: itemType,
    title,
    body,
    href,
    sort_order: sortOrder,
    is_visible: isVisible,
  }]);

  if (error) siteRedirect("error");
  refreshSiteAdmin();
  siteRedirect("guardado");
}

export async function updateSiteItemAction(formData: FormData) {
  await requireAdmin();
  const id = z.string().uuid().safeParse(formData.get("id"));
  const parsed = itemSchema.safeParse({
    sectionKey: formData.get("sectionKey"),
    itemType: formData.get("itemType"),
    title: formData.get("title"),
    body: formData.get("body"),
    href: formData.get("href"),
    sortOrder: formData.get("sortOrder"),
    isVisible: formData.get("isVisible") === "on",
  });
  if (!id.success || !parsed.success) siteRedirect("error");

  const { sectionKey, itemType, title, body, href, sortOrder, isVisible } = parsed.data;
  const { error } = await adminInsforge.database.from("pdh_site_items").update({
    section_key: sectionKey,
    item_type: itemType,
    title,
    body,
    href,
    sort_order: sortOrder,
    is_visible: isVisible,
  }).eq("id", id.data);

  if (error) siteRedirect("error");
  refreshSiteAdmin();
  siteRedirect("guardado");
}

export async function deleteSiteItemAction(formData: FormData) {
  await requireAdmin();
  const id = z.string().uuid().safeParse(formData.get("id"));
  if (!id.success) siteRedirect("error");
  const { error } = await adminInsforge.database.from("pdh_site_items").delete().eq("id", id.data);
  if (error) siteRedirect("error");
  refreshSiteAdmin();
  siteRedirect("eliminado");
}

const imageExtensions: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
  "image/gif": "gif",
};

export async function uploadSiteMediaAction(formData: FormData) {
  await requireAdmin();
  const sectionKey = sectionKeySchema.safeParse(formData.get("sectionKey"));
  const altText = z.string().trim().max(300).safeParse(formData.get("altText"));
  const caption = z.string().trim().max(180).safeParse(formData.get("caption"));
  const sortOrder = z.coerce.number().int().min(-1000).max(1000).safeParse(formData.get("sortOrder"));
  const file = formData.get("image");

  if (
    !sectionKey.success || !altText.success || !caption.success || !sortOrder.success ||
    !(file instanceof File) || !file.size || file.size > 5 * 1024 * 1024 ||
    !imageExtensions[file.type]
  ) siteRedirect("error");

  const key = `site/${sectionKey.data}/${randomUUID()}.${imageExtensions[file.type]}`;
  const upload = await adminInsforge.storage.from("pdh_media").upload(key, file);
  if (upload.error || !upload.data) siteRedirect("error");
  const uploaded = upload.data;

  const { error } = await adminInsforge.database.from("pdh_site_media").insert([{
    section_key: sectionKey.data,
    image_url: uploaded.url,
    image_key: uploaded.key,
    alt_text: altText.data,
    caption: caption.data,
    sort_order: sortOrder.data,
    is_visible: true,
  }]);

  if (error) {
    await adminInsforge.storage.from("pdh_media").remove(uploaded.key);
    siteRedirect("error");
  }

  refreshSiteAdmin();
  siteRedirect("guardado");
}

export async function updateSiteMediaAction(formData: FormData) {
  await requireAdmin();
  const id = z.string().uuid().safeParse(formData.get("id"));
  const altText = z.string().trim().max(300).safeParse(formData.get("altText"));
  const caption = z.string().trim().max(180).safeParse(formData.get("caption"));
  const sortOrder = z.coerce.number().int().min(-1000).max(1000).safeParse(formData.get("sortOrder"));
  if (!id.success || !altText.success || !caption.success || !sortOrder.success) siteRedirect("error");

  const { error } = await adminInsforge.database.from("pdh_site_media").update({
    alt_text: altText.data,
    caption: caption.data,
    sort_order: sortOrder.data,
    is_visible: formData.get("isVisible") === "on",
  }).eq("id", id.data);

  if (error) siteRedirect("error");
  refreshSiteAdmin();
  siteRedirect("guardado");
}

export async function deleteSiteMediaAction(formData: FormData) {
  await requireAdmin();
  const id = z.string().uuid().safeParse(formData.get("id"));
  if (!id.success) siteRedirect("error");

  const { data, error: readError } = await adminInsforge.database
    .from("pdh_site_media")
    .select("image_key")
    .eq("id", id.data)
    .maybeSingle();
  if (readError) siteRedirect("error");

  const { error } = await adminInsforge.database.from("pdh_site_media").delete().eq("id", id.data);
  if (error) siteRedirect("error");

  const imageKey = (data as { image_key: string | null } | null)?.image_key;
  if (imageKey) {
    const removal = await adminInsforge.storage.from("pdh_media").remove(imageKey);
    if (removal.error) console.error("La imagen se quitó del sitio, pero no del almacenamiento", removal.error);
  }

  refreshSiteAdmin();
  siteRedirect("eliminado");
}
