// Read-only integration probes. Invalid IDs ensure the RPC cannot change data.
import assert from "node:assert/strict";
import { createClient, createAdminClient } from "@insforge/sdk";
const publicClient = createClient({ baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL, anonKey: process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY });
const admin = createAdminClient({ baseUrl: process.env.INSFORGE_URL ?? process.env.NEXT_PUBLIC_INSFORGE_URL, apiKey: process.env.INSFORGE_API_KEY });
const args = {
  p_id: "00000000-0000-4000-8000-000000000000", p_mode: "update", p_date: null, p_expected_updated_at: null,
  p_values: { title: "Read-only access probe", description: "", event_type: "community", location: "Test", starts_at: "2026-09-15T21:00:00Z", ends_at: "2026-09-15T22:00:00Z", status: "draft" },
};
const publicWrite = await publicClient.database.rpc("pdh_save_calendar_event", args);
assert.ok(publicWrite.error, "Anonymous RPC must be denied");
assert.match(publicWrite.error.message, /permission|denied|not find|schema cache/i);
const adminWrite = await admin.database.rpc("pdh_save_calendar_event", args);
assert.ok(adminWrite.error);
assert.match(adminWrite.error.message, /Event not found/, "Admin client must reach the guarded function without changing data");
const { data, error } = await publicClient.database.from("pdh_events").select("id,status,recurrence_days,recurrence_until").limit(100);
assert.equal(error, null);
assert.ok(data.every(event => ["published", "completed"].includes(event.status)), "Public reads must hide drafts and cancelled schedules");
const exceptions = await publicClient.database.from("pdh_event_exceptions").select("event_id,occurrence_date").limit(100);
assert.equal(exceptions.error, null);
console.log("Backend access checks passed: public calendar reads, anonymous RPC denied, admin RPC available, no data changed.");
