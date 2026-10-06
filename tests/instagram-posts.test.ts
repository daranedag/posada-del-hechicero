import test from "node:test";
import assert from "node:assert/strict";
import { normalizeInstagramPosts } from "../lib/instagram-posts.ts";

const account = "posada.delhechicero";
const post = (id: string, timestamp: string, extra = {}) => ({
  id, timestamp, username: account, media_type: "IMAGE",
  media_url: "https://scontent.cdninstagram.com/photo.jpg",
  permalink: `https://www.instagram.com/p/${id}/`, ...extra,
});

test("selects three newest unique publications", () => {
  const result = normalizeInstagramPosts([post("old", "2025-01-01"), post("new", "2026-10-06"), post("third", "2026-10-01"), post("second", "2026-10-02"), post("new", "2026-10-06")], account);
  assert.deepEqual(result.map(p => p.id), ["new", "second", "third"]);
});
test("never shows publications from another account", () => {
  assert.deepEqual(normalizeInstagramPosts([post("personal", "2026-10-06", { username: "mrdiegui" })], account), []);
});
test("videos use thumbnails; carousel uses its cover", () => {
  const result = normalizeInstagramPosts([post("video", "2026-10-06", { media_type: "VIDEO", thumbnail_url: "https://scontent.fbcdn.net/thumb.jpg" }), post("album", "2026-10-02", { media_type: "CAROUSEL_ALBUM" })], account);
  assert.equal(result[0].imageUrl, "https://scontent.fbcdn.net/thumb.jpg");
  assert.equal(result[1].imageUrl, "https://scontent.cdninstagram.com/photo.jpg");
});
test("rejects unsafe links and invalid dates; allows image fallback", () => {
  assert.deepEqual(normalizeInstagramPosts([post("bad", "2026-10-06", { permalink: "javascript:alert(1)" }), post("date", "invalid")], account), []);
  assert.equal(normalizeInstagramPosts([post("image", "2026-10-06", { media_url: "https://cdninstagram.com.evil.example/photo.jpg" })], account)[0].imageUrl, null);
  assert.equal(normalizeInstagramPosts([post("video", "2026-10-06", { media_type: "VIDEO" })], account)[0].imageUrl, null);
});
test("empty feed and invalid response are handled explicitly", () => {
  assert.deepEqual(normalizeInstagramPosts([], account), []);
  assert.throws(() => normalizeInstagramPosts(undefined, account));
});
