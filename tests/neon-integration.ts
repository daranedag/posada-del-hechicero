import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import pg from "pg";
import { adminDb } from "../lib/db/admin";
import { publicDb } from "../lib/db/public";
import { queryDatabase } from "../lib/db/server";
import { authorizeIdentity } from "../lib/auth/identity";
import { getCalendarMonth } from "../lib/events/data";

async function main() {
  assert.match(process.env.NEON_BRANCH ?? "", /^migration-/, "Integration fixtures must run on the migration branch");
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL_UNPOOLED });
  await client.connect();
  try {
    await client.query("BEGIN");
    for (const file of ["tests/event-calendar-db.sql", "tests/event-deck-registration-db.sql"]) {
      await client.query(readFileSync(file, "utf8"));
    }
    await client.query("ROLLBACK");
  } finally { await client.end(); }
  console.log("Calendar SQL: recurrence, conflicts, tournament links, rollback and RLS passed");

  const events = await publicDb.from("pdh_events").select("id,status,starts_at").order("starts_at");
  assert.equal(events.error, null);
  assert.ok(events.data?.every(e => ["published", "completed"].includes(String(e.status))));
  assert.ok(events.data?.every(e => typeof e.starts_at === "string"));
  assert.equal((await publicDb.from("pdh_players").select("id")).data?.length, 0);
  assert.equal((await publicDb.from("pdh_admins").select("user_id")).data?.length, 0);
  assert.ok((await publicDb.from("pdh_users").select("email")).error);
  assert.ok((await publicDb.from("pdh_events").insert([{ title: "Forbidden" }])).error);
  await assert.rejects(queryDatabase("public", "DELETE FROM public.pdh_events"), /permission denied/);
  const adminEvents = await adminDb.from("pdh_events").select("id");
  assert.equal(adminEvents.error, null, "Public errors must not leave a pooled connection in the reader role");
  assert.equal(adminEvents.data?.length, 2);
  const page = await adminDb.from("pdh_events").select("id,title", { count: "exact" }).order("updated_at").range(0, 0);
  assert.equal(page.error, null);
  assert.equal(page.count, 2);
  assert.equal(page.data?.length, 1);
  const emptyPage = await adminDb.from("pdh_events").select("id", { count: "exact" }).range(999, 999);
  assert.equal(emptyPage.count, 2);
  assert.equal(emptyPage.data?.length, 0);
  const code = await adminDb.from("pdh_tournaments").select("code").limit(1).single();
  assert.equal(code.error, null);
  assert.equal((await publicDb.from("pdh_tournaments").select("id").eq("code", "' OR true --")).data?.length, 0);
  assert.equal((await adminDb.from("pdh_players").select("id").in("id", [])).data?.length, 0);
  assert.equal((await adminDb.from("pdh_events").select("id").eq("id", randomUUID()).maybeSingle()).data, null);
  assert.ok((await adminDb.from("pdh_events").select("id").eq("id", randomUUID()).single()).error);
  await getCalendarMonth("2026-11");
  await getCalendarMonth("2026-11", true);

  const key = `neon_test_${randomUUID().replaceAll("-", "")}`;
  const identityId = randomUUID();
  const email = `${identityId}@example.invalid`;
  const user = { id: randomUUID(), email, emailVerified: true, name: "Migration test" };
  const eventIds: string[] = [];
  try {
    const insert = await adminDb.from("pdh_site_sections").insert([{ key, admin_label: "Migration fixture" }]).select("key,updated_at").single();
    assert.equal(insert.error, null);
    const update = await adminDb.from("pdh_site_sections").update({ title: "Updated fixture" }).eq("key", key).select("key,title,updated_at").single();
    assert.equal(update.error, null);
    assert.equal(update.data?.title, "Updated fixture");
    assert.ok(Date.parse(String(update.data?.updated_at)) >= Date.parse(String(insert.data?.updated_at)));
    assert.equal((await adminDb.from("pdh_site_sections").upsert([{ key, admin_label: "Migration fixture", is_visible: false }], { onConflict: "key" })).error, null);
    assert.equal((await publicDb.from("pdh_site_sections").select("key").eq("key", key)).data?.length, 0);
    await queryDatabase("admin", "INSERT INTO public.pdh_users(id,email,email_verified) VALUES($1,$2,true)", [identityId, email]);
    assert.equal((await authorizeIdentity(user, email))?.id, identityId, "Linking must keep the migrated UUID");
    assert.equal((await authorizeIdentity(user, email))?.id, identityId, "Subsequent login must reuse the link");
    assert.equal(await authorizeIdentity({ ...user, id: randomUUID() }, email), null, "A linked identity cannot be rebound");
    const args = {
      p_id: null, p_mode: "create", p_date: null, p_expected_updated_at: null,
      p_values: { title: "Migration fixture", description: "", event_type: "community", location: "Test",
        starts_at: "2026-11-10T21:00:00Z", ends_at: "2026-11-10T22:00:00Z", status: "draft" },
      p_owner_id: identityId, p_registration: null,
    };
    const event = await adminDb.rpc("pdh_save_calendar_event_with_registration", args);
    assert.equal(event.error, null);
    eventIds.push(String(event.data));
    assert.equal((await publicDb.from("pdh_events").select("id").eq("id", event.data)).data?.length, 0);
    assert.equal((await adminDb.rpc("pdh_save_calendar_event_with_registration", {
      ...args, p_id: event.data, p_mode: "update", p_expected_updated_at: "2000-01-01T00:00:00Z",
    })).error?.message, "EVENT_CONFLICT");
    assert.equal(await authorizeIdentity(user, undefined), null, "Removing an allowed email must revoke access");
    assert.equal((await adminDb.from("pdh_admins").select("user_id").eq("user_id", identityId)).data?.length, 0);
    assert.equal(await authorizeIdentity({ ...user, emailVerified: false }, email), null);
  } finally {
    for (const id of eventIds) await adminDb.from("pdh_events").delete().eq("id", id);
    await adminDb.from("pdh_site_sections").delete().eq("key", key);
    await adminDb.from("pdh_users").delete().eq("id", identityId);
  }
  console.log("Neon integration: public privacy, pagination, parameterized queries, CRUD, RPC and identity continuity passed");
}

main().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => {
  const state = globalThis as typeof globalThis & { pdhPool?: pg.Pool };
  await state.pdhPool?.end();
});
