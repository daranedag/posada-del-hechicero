import "server-only";
import { createHmac, randomUUID } from "node:crypto";
import { z } from "zod";

const assetSchema = z.object({
  fileId: z.string().min(1), name: z.string(), url: z.string().url(),
  filePath: z.string(), fileType: z.literal("image"),
  isPrivateFile: z.boolean().optional(),
  size: z.number().optional(),
});
export type ImageKitAsset = z.infer<typeof assetSchema>;

function config() {
  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY?.trim();
  const publicKey = process.env.IMAGEKIT_PUBLIC_KEY?.trim();
  const endpoint = process.env.IMAGEKIT_URL_ENDPOINT?.trim().replace(/\/+$/, "");
  if (!privateKey || !publicKey || !endpoint) throw new Error("Configura IMAGEKIT_PRIVATE_KEY, IMAGEKIT_PUBLIC_KEY e IMAGEKIT_URL_ENDPOINT en .env.local.");
  const url = new URL(endpoint);
  if (url.protocol !== "https:" || url.search || url.hash || url.username || url.password) throw new Error("IMAGEKIT_URL_ENDPOINT debe ser una URL HTTPS sin parámetros.");
  return { privateKey, publicKey, endpoint, folder: process.env.IMAGEKIT_UPLOAD_FOLDER?.trim() || "/posada-del-hechicero" };
}

async function request(path: string) {
  const { privateKey } = config();
  const response = await fetch(`https://api.imagekit.io/v1/files${path}`, {
    headers: { Authorization: `Basic ${Buffer.from(`${privateKey}:`).toString("base64")}` },
    cache: "no-store", signal: AbortSignal.timeout(20000),
  });
  if (!response.ok) throw new Error(response.status === 401 || response.status === 403
    ? "ImageKit rechazó las credenciales o sus permisos. Revisa la configuración."
    : "No se pudo consultar ImageKit. Inténtalo nuevamente.");
  return response.json();
}

function publicAsset(value: unknown): ImageKitAsset {
  const asset = assetSchema.parse(value);
  if (asset.isPrivateFile || !/\.(jpe?g|png|webp|avif|gif)$/i.test(asset.name)) throw new Error("Selecciona una imagen pública JPG, PNG, WebP, AVIF o GIF.");
  // Build the delivery URL from the configured endpoint and the verified file path.
  return { ...asset, url: `${config().endpoint}/${asset.filePath.split("/").filter(Boolean).map(encodeURIComponent).join("/")}` };
}

export async function listImageKitAssets(query: string, skip: number) {
  const params = new URLSearchParams({ type: "file", fileType: "image", limit: "24", skip: String(skip), sort: "DESC_CREATED" });
  if (query) params.set("searchQuery", `name = ${JSON.stringify(`*${query.replace(/[\\*?"\r\n]/g, "")}*`)}`);
  const data = z.array(z.unknown()).parse(await request(`?${params}`));
  const files: ImageKitAsset[] = [];
  for (const item of data) {
    try { files.push(publicAsset(item)); } catch { /* Only selectable public raster images. */ }
  }
  return { files, hasMore: data.length === 24 };
}

export async function getImageKitAsset(fileId: string) {
  if (!/^[a-zA-Z0-9_-]{1,100}$/.test(fileId)) throw new Error("Selecciona una imagen válida.");
  return publicAsset(await request(`/${encodeURIComponent(fileId)}/details`));
}

export function imageKitUploadAuth() {
  const { privateKey, publicKey, folder } = config();
  const token = randomUUID();
  const expire = Math.floor(Date.now() / 1000) + 600;
  const signature = createHmac("sha1", privateKey).update(token + expire).digest("hex");
  return { token, expire, signature, publicKey, folder };
}
