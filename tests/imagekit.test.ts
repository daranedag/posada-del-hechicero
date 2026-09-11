import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { createHmac } from "node:crypto";
import { runInNewContext } from "node:vm";
import ts from "typescript";

const require = createRequire(import.meta.url);
const source = ts.transpileModule(readFileSync(new URL("../lib/imagekit.ts", import.meta.url), "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const asset = { fileId: "abc123", name: "foto local.jpg", filePath: "/carpeta/foto local.jpg", fileType: "image", url: "https://ik.imagekit.io/demo/foto.jpg", isPrivateFile: false };

function setup(data: unknown = asset, status = 200, configured = true) {
  const calls: { url: string; options: RequestInit }[] = [];
  const exports: Record<string, (...args: unknown[]) => any> = {}; // eslint-disable-line @typescript-eslint/no-explicit-any
  runInNewContext(source, {
    exports,
    require: (name: string) => name === "server-only" ? {} : require(name),
    process: { env: configured ? { IMAGEKIT_PRIVATE_KEY: "test-private", IMAGEKIT_PUBLIC_KEY: "test-public", IMAGEKIT_URL_ENDPOINT: "https://ik.imagekit.io/my-account/" } : {} },
    Buffer, URL, URLSearchParams, AbortSignal,
    fetch: async (url: string, options: RequestInit) => { calls.push({ url, options }); return { ok: status === 200, status, json: async () => data }; },
  });
  return { api: exports, calls };
}

test("firma de subida temporal y sin revelar clave privada", () => {
  const { api } = setup();
  const auth = api.imageKitUploadAuth();
  assert.equal(auth.signature, createHmac("sha1", "test-private").update(auth.token + auth.expire).digest("hex"));
  assert.ok(auth.expire > Date.now() / 1000 && auth.expire <= Date.now() / 1000 + 600);
  assert.equal(auth.publicKey, "test-public");
  assert.ok(!JSON.stringify(auth).includes("test-private"));
});

test("consulta por ID y URL de entrega desde endpoint configurado", async () => {
  const { api, calls } = setup();
  const selected = await api.getImageKitAsset("abc123");
  assert.equal(selected.url, "https://ik.imagekit.io/my-account/carpeta/foto%20local.jpg");
  assert.equal(calls[0].url, "https://api.imagekit.io/v1/files/abc123/details");
  assert.equal(calls[0].options.cache, "no-store");
  await assert.rejects(api.getImageKitAsset("../private"));
  assert.equal(calls.length, 1);
});

test("rechaza imágenes privadas y archivos no compatibles al guardar", async () => {
  await assert.rejects(setup({ ...asset, isPrivateFile: true }).api.getImageKitAsset("abc123"));
  await assert.rejects(setup({ ...asset, name: "logo.svg" }).api.getImageKitAsset("abc123"));
  await assert.rejects(setup({ ...asset, fileType: "non-image" }).api.getImageKitAsset("abc123"));
});

test("biblioteca pagina sin perder avance al filtrar archivos privados", async () => {
  const { api, calls } = setup(Array.from({ length: 24 }, (_, index) => ({ ...asset, fileId: String(index), isPrivateFile: index === 0 })));
  const result = await api.listImageKitAssets("foto", 24);
  assert.equal(result.files.length, 23);
  assert.equal(result.hasMore, true);
  const url = new URL(calls[0].url);
  assert.equal(url.searchParams.get("skip"), "24");
  assert.equal(url.searchParams.get("limit"), "24");
  assert.equal(url.searchParams.get("searchQuery"), 'name = "*foto*"');
});

test("configuración ausente y fallos de ImageKit se reportan sin credenciales", async () => {
  assert.throws(() => setup(undefined, 200, false).api.imageKitUploadAuth(), /Configura IMAGEKIT/);
  await assert.rejects(setup({}, 401).api.getImageKitAsset("abc123"), /credenciales/);
  await assert.rejects(setup({}, 429).api.getImageKitAsset("abc123"), /Inténtalo/);
});
