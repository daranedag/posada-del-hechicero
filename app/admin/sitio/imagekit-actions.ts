"use server";

import { getAdminUser } from "@/lib/auth/admin";
import { getImageKitAsset, imageKitUploadAuth, listImageKitAssets } from "@/lib/imagekit";

async function authorized<T>(operation: () => Promise<T>) {
  if (!await getAdminUser()) return { error: "Tu sesión no tiene acceso. Inicia sesión como administrador." };
  try { return { data: await operation() }; }
  catch (error) { return { error: error instanceof Error ? error.message : "No se pudo conectar con ImageKit." }; }
}

export async function browseImagesAction(query: string, skip: number) {
  return authorized(async () => {
    if (typeof query !== "string" || query.length > 100 || !Number.isInteger(skip) || skip < 0 || skip > 100000) throw new Error("Búsqueda inválida.");
    return listImageKitAssets(query.trim(), skip);
  });
}

export async function imageUploadAuthAction() {
  return authorized(async () => imageKitUploadAuth());
}

export async function verifyImageAction(fileId: string) {
  return authorized(async () => getImageKitAsset(fileId));
}
