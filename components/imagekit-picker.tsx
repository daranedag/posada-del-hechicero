"use client";

import Image from "next/image";
import { useState, type ReactNode } from "react";
import { browseImagesAction, imageUploadAuthAction, verifyImageAction } from "@/app/admin/sitio/imagekit-actions";
import type { ImageKitAsset } from "@/lib/imagekit";

export function ImageKitPicker({ currentUrl = "", children }: { currentUrl?: string; children?: ReactNode }) {
  const [selected, setSelected] = useState<ImageKitAsset | null>(null);
  const [open, setOpen] = useState(false);
  const [files, setFiles] = useState<ImageKitAsset[]>([]);
  const [query, setQuery] = useState("");
  const [activeQuery, setActiveQuery] = useState("");
  const [skip, setSkip] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const buttonClass = "rounded-lg border border-input px-3 py-2 text-sm font-semibold hover:bg-secondary disabled:opacity-50";

  async function browse(search = query, offset = 0) {
    setBusy(true); setError(""); setOpen(true);
    try {
      const result = await browseImagesAction(search, offset);
      if (!result.data) throw new Error(result.error);
      setFiles(result.data.files); setHasMore(result.data.hasMore); setSkip(offset); setActiveQuery(search);
    } catch (error) { setError(error instanceof Error ? error.message : "No se pudo cargar la biblioteca."); }
    finally { setBusy(false); }
  }

  async function upload(file: File) {
    setError("");
    if (!file.size || file.size > 5 * 1024 * 1024 || !["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"].includes(file.type)) {
      setError("Elige una imagen JPG, PNG, WebP, AVIF o GIF de hasta 5 MB."); return;
    }
    setBusy(true);
    try {
      const auth = await imageUploadAuthAction();
      if (!auth.data) throw new Error(auth.error);
      const body = new FormData();
      for (const [key, value] of Object.entries(auth.data)) body.set(key, String(value));
      body.set("file", file); body.set("fileName", file.name);
      body.set("useUniqueFileName", "true"); body.set("isPrivateFile", "false");
      const response = await fetch("https://upload.imagekit.io/api/v1/files/upload", { method: "POST", body, signal: AbortSignal.timeout(120000) });
      if (!response.ok) throw new Error("ImageKit no pudo subir la imagen. Revisa las credenciales, los permisos y el espacio disponible.");
      const uploaded = await response.json();
      const verified = await verifyImageAction(uploaded.fileId);
      if (!verified.data) throw new Error(verified.error);
      setSelected(verified.data); setOpen(false);
    } catch (error) { setError(error instanceof Error ? error.message : "No se pudo subir la imagen. Inténtalo de nuevo."); }
    finally { setBusy(false); }
  }

  return (
    <div className="grid gap-3" aria-busy={busy}>
      <input type="hidden" name="imagekitFileId" value={selected?.fileId ?? ""} />
      <div className="flex flex-wrap gap-2">
        <button type="button" className={buttonClass} disabled={busy} onClick={() => open ? setOpen(false) : void browse()}>{open ? "Cerrar biblioteca" : "Explorar ImageKit"}</button>
        <label className={`${buttonClass} cursor-pointer`}>
          Subir imagen
          <input className="sr-only" type="file" disabled={busy} accept="image/jpeg,image/png,image/webp,image/avif,image/gif" onChange={(event) => {
            const file = event.target.files?.[0]; event.target.value = ""; if (file) void upload(file);
          }} />
        </label>
      </div>
      {busy && <p role="status" className="text-sm">Procesando imágenes…</p>}
      {error && <p role="alert" className="text-sm text-red-600 dark:text-red-300">{error}</p>}
      {open && <div className="grid gap-3 rounded-lg border border-input p-3">
        <div className="flex gap-2">
          <input aria-label="Buscar imágenes por nombre" className="pdh-input min-w-0" value={query} maxLength={100} placeholder="Buscar por nombre…" disabled={busy} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); void browse(); } }} />
          <button type="button" className={buttonClass} disabled={busy} onClick={() => void browse()}>Buscar</button>
        </div>
        {!busy && files.length === 0 && <p className="text-sm text-muted-foreground">No hay imágenes públicas compatibles en esta página. Puedes subir una o continuar a la siguiente.</p>}
        <div className="grid max-h-80 grid-cols-2 gap-2 overflow-y-auto sm:grid-cols-3">
          {files.map((file) => <button key={file.fileId} type="button" disabled={busy} aria-label={`Seleccionar ${file.name}`} aria-pressed={selected?.fileId === file.fileId} className="overflow-hidden rounded-lg border border-input text-left hover:border-primary focus-visible:ring-2 focus-visible:ring-primary" onClick={() => { setSelected(file); setOpen(false); }}>
            <div className="relative aspect-square"><Image src={file.url} alt={file.name} fill sizes="160px" className="object-cover" /></div>
            <span className="block truncate p-2 text-xs" title={file.filePath}>{file.name}</span>
          </button>)}
        </div>
        <div className="flex items-center justify-between gap-2">
          <button type="button" className={buttonClass} disabled={busy || skip === 0} onClick={() => void browse(activeQuery, Math.max(0, skip - 24))}>Anterior</button>
          <span className="text-xs">Página {skip / 24 + 1}</span>
          <button type="button" className={buttonClass} disabled={busy || !hasMore} onClick={() => void browse(activeQuery, skip + 24)}>Siguiente</button>
        </div>
      </div>}
      {selected && <div className="grid gap-2">
        <div className="relative aspect-video overflow-hidden rounded-lg"><Image src={selected.url} alt={selected.name} fill sizes="500px" className="object-contain" /></div>
        <p className="text-sm">Seleccionada: {selected.name}. Guarda la foto para publicar el cambio.</p>
        <button type="button" disabled={busy} className={buttonClass} onClick={() => setSelected(null)}>Cancelar selección</button>
      </div>}
      {(selected?.url || currentUrl) && <label className="pdh-label">URL de la imagen<input className="pdh-input mt-2" readOnly value={selected?.url || currentUrl} onFocus={(e) => e.target.select()} /></label>}
      <p className="text-xs text-muted-foreground">Subir una imagen la agrega a ImageKit. Usa Guardar foto para vincularla al sitio.</p>
      <fieldset className="grid min-w-0 gap-4" disabled={busy || (!currentUrl && !selected)}>{children}</fieldset>
    </div>
  );
}
