import "server-only";
import { createAdminClient } from "@insforge/sdk";

const baseUrl = process.env.INSFORGE_URL ?? process.env.NEXT_PUBLIC_INSFORGE_URL;
const apiKey = process.env.INSFORGE_API_KEY;

if (!baseUrl || !apiKey) {
  throw new Error("Falta la configuracion privada de InsForge.");
}

export const adminInsforge = createAdminClient({ baseUrl, apiKey });
