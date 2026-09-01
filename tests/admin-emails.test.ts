import assert from "node:assert/strict";
import test from "node:test";
import { isAdminEmailAllowed, parseAdminEmails } from "../lib/auth/admin-emails.ts";

test("normaliza y elimina correos administradores duplicados", () => {
  assert.deepEqual(
    parseAdminEmails(" Admin@Example.com,editor@example.com ", "admin@example.com; owner@example.com"),
    ["admin@example.com", "editor@example.com", "owner@example.com"],
  );
});

test("acepta varios separadores y compara sin distinguir mayúsculas", () => {
  const configured = "uno@example.com dos@example.com\ntres@example.com";
  assert.equal(isAdminEmailAllowed("DOS@EXAMPLE.COM", configured), true);
  assert.equal(isAdminEmailAllowed("otro@example.com", configured), false);
});

test("una lista vacía no autoriza ninguna cuenta", () => {
  assert.equal(isAdminEmailAllowed("admin@example.com", undefined, ""), false);
});
