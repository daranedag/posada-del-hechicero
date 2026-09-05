import Image from "next/image";
import { Eye, EyeOff, ImagePlus, Plus, Type } from "lucide-react";
import { AdminDeleteButton } from "@/components/admin-delete-button";
import { AdminNav } from "@/components/admin-nav";
import { FormSubmitButton } from "@/components/form-submit-button";
import { requireAdmin } from "@/lib/auth/admin";
import type { SiteItem, SiteMedia, SiteSection } from "@/lib/data/site-content";
import { adminInsforge } from "@/lib/insforge/admin";
import {
  createSiteItemAction,
  deleteSiteItemAction,
  deleteSiteMediaAction,
  updateSiteItemAction,
  updateSiteMediaAction,
  updateSiteSectionAction,
  uploadSiteMediaAction,
} from "@/app/admin/sitio/actions";

export const metadata = { title: "Administración del sitio" };
export const dynamic = "force-dynamic";

const inputClass = "pdh-input mt-2";
const textareaClass = "mt-2 min-h-28 w-full resize-y rounded-lg border border-input bg-background px-3 py-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20";

const itemTypeLabels: Record<SiteItem["item_type"], string> = {
  social: "Red social",
  address: "Dirección",
  hours: "Horario",
  contact: "Contacto",
  text: "Texto",
};

const sectionHints: Record<SiteSection["key"], string> = {
  hero: "El primer bloque de la portada. La primera imagen visible se usa como fondo.",
  social: "Enlaces a tus redes y galería de novedades.",
  address: "Datos del local, enlace al mapa y una foto opcional.",
  hours: "Agrega una fila por día o por grupo de días.",
  game_request: "Llamado a contacto para consultar por disponibilidad de juegos.",
  contact: "Presentación del formulario que guarda las consultas recibidas.",
};

export default async function SiteAdminPage({ searchParams }: { searchParams: Promise<{ estado?: string }> }) {
  const user = await requireAdmin();
  const [{ data: sectionsData }, { data: itemsData }, { data: mediaData }] = await Promise.all([
    adminInsforge.database.from("pdh_site_sections").select("key,admin_label,kicker,title,body,sort_order,is_visible").order("sort_order", { ascending: true }),
    adminInsforge.database.from("pdh_site_items").select("id,section_key,item_type,title,body,href,sort_order,is_visible").order("sort_order", { ascending: true }),
    adminInsforge.database.from("pdh_site_media").select("id,section_key,image_url,image_key,alt_text,caption,sort_order,is_visible").order("sort_order", { ascending: true }),
  ]);
  const sections = (sectionsData ?? []) as SiteSection[];
  const items = (itemsData ?? []) as SiteItem[];
  const media = (mediaData ?? []) as SiteMedia[];
  const { estado } = await searchParams;

  return (
    <section className="pdh-container py-10 sm:py-14">
      <AdminNav name={(user.admin as { display_name?: string }).display_name ?? user.email} />
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="pdh-kicker">Contenido público</p>
          <h1 className="mt-4 text-5xl leading-none">Administración del sitio</h1>
        </div>
        <p className="max-w-lg text-sm leading-6 text-muted-foreground">
          Edita los textos de cada sección, agrega enlaces y administra las fotografías de la portada.
        </p>
      </div>

      {estado && (
        <p className={`mt-6 rounded-lg border p-3 text-sm font-semibold ${estado === "error" ? "border-red-200 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200" : "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200"}`}>
          {estado === "error" ? "No pudimos guardar el cambio. Revisa los datos e inténtalo nuevamente." : estado === "eliminado" ? "El contenido fue eliminado." : "Los cambios fueron guardados y ya están disponibles en la portada."}
        </p>
      )}

      <div className="mt-8 grid gap-5">
        {sections.map((section) => {
          const sectionItems = items.filter((item) => item.section_key === section.key);
          const sectionMedia = media.filter((item) => item.section_key === section.key);
          return (
            <details key={section.key} className="pdh-panel overflow-hidden" open={section.key === "hero"}>
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 marker:hidden sm:p-6">
                <span>
                  <span className="flex items-center gap-2 text-xl font-bold"><Type className="size-5 text-copper" /> {section.admin_label}</span>
                  <span className="mt-1 block text-sm text-muted-foreground">{sectionHints[section.key]}</span>
                </span>
                <span className={`inline-flex shrink-0 items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold ${section.is_visible ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" : "bg-muted text-muted-foreground"}`}>
                  {section.is_visible ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5" />}
                  {section.is_visible ? "Visible" : "Oculta"}
                </span>
              </summary>

              <div className="border-t border-foreground/10 p-5 sm:p-6">
                <form action={updateSiteSectionAction} className="grid gap-5">
                  <input type="hidden" name="key" value={section.key} />
                  <div className="grid gap-5 lg:grid-cols-2">
                    <label className="pdh-label">Texto pequeño
                      <input className={inputClass} name="kicker" defaultValue={section.kicker} maxLength={160} />
                    </label>
                    <label className="pdh-label">Título
                      <input className={inputClass} name="title" defaultValue={section.title} maxLength={220} />
                    </label>
                  </div>
                  <label className="pdh-label">Descripción
                    <textarea className={textareaClass} name="body" defaultValue={section.body} maxLength={3000} />
                  </label>
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-5">
                      <label className="pdh-label flex items-center gap-2">
                        <input className="size-4 accent-primary" type="checkbox" name="isVisible" defaultChecked={section.is_visible} disabled={section.key === "hero"} />
                        {section.key === "hero" ? "Hero siempre visible" : "Mostrar sección"}
                      </label>
                      <label className="pdh-label flex items-center gap-2">Orden
                        <input className="h-9 w-20 rounded-lg border border-input bg-background px-2 text-sm" name="sortOrder" type="number" defaultValue={section.sort_order} min={-1000} max={1000} />
                      </label>
                    </div>
                    <FormSubmitButton label="Guardar sección" />
                  </div>
                </form>

                <div className="mt-8 border-t border-foreground/10 pt-7">
                  <div className="flex items-center justify-between gap-4"><div><h3 className="text-2xl">Textos y enlaces</h3><p className="mt-1 text-sm text-muted-foreground">Filas repetibles para redes, horarios, dirección o botones.</p></div><span className="rounded-full bg-secondary px-3 py-1 text-xs font-bold">{sectionItems.length}</span></div>
                  <div className="mt-5 grid gap-4">
                    {sectionItems.map((item) => (
                      <div key={item.id} className="rounded-xl border border-foreground/10 bg-background/50 p-4">
                        <form action={updateSiteItemAction} className="grid gap-4">
                          <input type="hidden" name="id" value={item.id} />
                          <input type="hidden" name="sectionKey" value={section.key} />
                          <div className="grid gap-4 md:grid-cols-[0.65fr_1fr]">
                            <label className="pdh-label">Tipo
                              <select className={inputClass} name="itemType" defaultValue={item.item_type}>{Object.entries(itemTypeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
                            </label>
                            <label className="pdh-label">Título
                              <input className={inputClass} name="title" defaultValue={item.title} maxLength={160} required />
                            </label>
                          </div>
                          <label className="pdh-label">Texto
                            <textarea className={`${textareaClass} min-h-20`} name="body" defaultValue={item.body} maxLength={1000} />
                          </label>
                          <div className="grid gap-4 md:grid-cols-[1fr_7rem_auto] md:items-end">
                            <label className="pdh-label">Enlace opcional
                              <input className={inputClass} name="href" type="url" defaultValue={item.href ?? ""} placeholder="https://..." maxLength={1000} />
                            </label>
                            <label className="pdh-label">Orden
                              <input className={inputClass} name="sortOrder" type="number" defaultValue={item.sort_order} min={-1000} max={1000} />
                            </label>
                            <label className="pdh-label mb-2 flex items-center gap-2"><input className="size-4 accent-primary" type="checkbox" name="isVisible" defaultChecked={item.is_visible} /> Visible</label>
                          </div>
                          <div className="flex justify-end"><FormSubmitButton label="Guardar texto" /></div>
                        </form>
                        <form action={deleteSiteItemAction} className="mt-3 flex justify-end border-t border-foreground/10 pt-3">
                          <input type="hidden" name="id" value={item.id} />
                          <AdminDeleteButton label="Eliminar texto" />
                        </form>
                      </div>
                    ))}

                    <form action={createSiteItemAction} className="rounded-xl border border-dashed border-primary/35 bg-primary/[0.035] p-4">
                      <input type="hidden" name="sectionKey" value={section.key} />
                      <div className="mb-4 flex items-center gap-2 font-bold"><Plus className="size-4 text-copper" /> Agregar texto o enlace</div>
                      <div className="grid gap-4 md:grid-cols-[0.65fr_1fr]">
                        <label className="pdh-label">Tipo<select className={inputClass} name="itemType" defaultValue={section.key === "social" ? "social" : section.key === "hours" ? "hours" : section.key === "address" ? "address" : "text"}>{Object.entries(itemTypeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
                        <label className="pdh-label">Título<input className={inputClass} name="title" maxLength={160} required /></label>
                      </div>
                      <div className="mt-4 grid gap-4 md:grid-cols-[1fr_1fr_7rem]">
                        <label className="pdh-label">Texto<input className={inputClass} name="body" maxLength={1000} /></label>
                        <label className="pdh-label">Enlace opcional<input className={inputClass} name="href" type="url" placeholder="https://..." maxLength={1000} /></label>
                        <label className="pdh-label">Orden<input className={inputClass} name="sortOrder" type="number" defaultValue={(sectionItems.at(-1)?.sort_order ?? 0) + 10} min={-1000} max={1000} /></label>
                      </div>
                      <input type="hidden" name="isVisible" value="on" />
                      <div className="mt-4 flex justify-end"><FormSubmitButton label="Agregar texto" /></div>
                    </form>
                  </div>
                </div>

                <div className="mt-8 border-t border-foreground/10 pt-7">
                  <div className="flex items-center justify-between gap-4"><div><h3 className="text-2xl">Fotografías</h3><p className="mt-1 text-sm text-muted-foreground">JPG, PNG, WebP, AVIF o GIF de hasta 5 MB.</p></div><span className="rounded-full bg-secondary px-3 py-1 text-xs font-bold">{sectionMedia.length}</span></div>
                  <div className="mt-5 grid gap-4 lg:grid-cols-2">
                    {sectionMedia.map((image) => (
                      <div key={image.id} className="overflow-hidden rounded-xl border border-foreground/10 bg-background/50">
                        <div className="relative aspect-[16/9] bg-muted"><Image src={image.image_url} alt={image.alt_text || "Vista previa"} fill sizes="(max-width: 1023px) 100vw, 50vw" className="object-cover" /></div>
                        <form action={updateSiteMediaAction} className="grid gap-4 p-4">
                          <input type="hidden" name="id" value={image.id} />
                          <label className="pdh-label">Texto alternativo<input className={inputClass} name="altText" defaultValue={image.alt_text} maxLength={300} /></label>
                          <div className="grid gap-4 sm:grid-cols-[1fr_7rem]">
                            <label className="pdh-label">Pie de foto<input className={inputClass} name="caption" defaultValue={image.caption} maxLength={180} /></label>
                            <label className="pdh-label">Orden<input className={inputClass} name="sortOrder" type="number" defaultValue={image.sort_order} min={-1000} max={1000} /></label>
                          </div>
                          <div className="flex items-center justify-between gap-4"><label className="pdh-label flex items-center gap-2"><input className="size-4 accent-primary" type="checkbox" name="isVisible" defaultChecked={image.is_visible} /> Visible</label><FormSubmitButton label="Guardar foto" /></div>
                        </form>
                        <form action={deleteSiteMediaAction} className="flex justify-end border-t border-foreground/10 p-4 pt-3">
                          <input type="hidden" name="id" value={image.id} />
                          <AdminDeleteButton label="Eliminar foto" />
                        </form>
                      </div>
                    ))}

                    <form action={uploadSiteMediaAction} className="grid content-start gap-4 rounded-xl border border-dashed border-primary/35 bg-primary/[0.035] p-5">
                      <input type="hidden" name="sectionKey" value={section.key} />
                      <div className="flex items-center gap-2 font-bold"><ImagePlus className="size-4 text-copper" /> Agregar fotografía</div>
                      <label className="pdh-label">Archivo<input className="mt-2 block w-full text-sm file:mr-4 file:rounded-full file:border-0 file:bg-secondary file:px-4 file:py-2 file:font-bold file:text-secondary-foreground" type="file" name="image" accept="image/jpeg,image/png,image/webp,image/avif,image/gif" required /></label>
                      <label className="pdh-label">Texto alternativo<input className={inputClass} name="altText" maxLength={300} placeholder="Describe lo que aparece en la imagen" /></label>
                      <div className="grid gap-4 sm:grid-cols-[1fr_7rem]">
                        <label className="pdh-label">Pie de foto<input className={inputClass} name="caption" maxLength={180} /></label>
                        <label className="pdh-label">Orden<input className={inputClass} name="sortOrder" type="number" defaultValue={(sectionMedia.at(-1)?.sort_order ?? 0) + 10} min={-1000} max={1000} /></label>
                      </div>
                      <div className="flex justify-end"><FormSubmitButton label="Subir foto" /></div>
                    </form>
                  </div>
                </div>
              </div>
            </details>
          );
        })}
      </div>
    </section>
  );
}
