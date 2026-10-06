import "server-only";
import { normalizeInstagramPosts, type InstagramPost } from "@/lib/instagram-posts";

export async function getInstagramPosts(): Promise<InstagramPost[]> {
  const token = process.env.IG_TOKEN?.trim();
  if (!token) return [];
  try {
    const url = new URL("https://graph.instagram.com/v25.0/me/media");
    url.searchParams.set("fields", "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,username");
    url.searchParams.set("limit", "3");
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate: 900 },
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) return [];
    const body = await response.json();
    // A token for another account must not publish its content on the Posada site.
    return normalizeInstagramPosts(body.data, "posada.delhechicero");
  } catch {
    // Keep upstream errors and credentials out of logs and public output.
    return [];
  }
}
