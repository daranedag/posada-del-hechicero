export type InstagramPost = {
  id: string;
  caption: string;
  imageUrl: string | null;
  permalink: string;
  timestamp: string;
  username: string;
  type: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
};

function safeUrl(value: unknown, kind: "post" | "image"): string | null {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password) return null;
    const validHost = kind === "post"
      ? ["instagram.com", "www.instagram.com"].includes(url.hostname)
      : ["cdninstagram.com", "fbcdn.net"].some(host => url.hostname === host || url.hostname.endsWith(`.${host}`));
    return validHost ? url.href : null;
  } catch { return null; }
}

export function normalizeInstagramPosts(value: unknown, expectedUsername: string): InstagramPost[] {
  if (!Array.isArray(value)) throw new Error("Invalid Instagram response");
  const seen = new Set<string>();
  return value.flatMap((item): InstagramPost[] => {
    if (!item || typeof item !== "object") return [];
    const permalink = safeUrl(item.permalink, "post");
    if (typeof item.id !== "string" || !permalink || typeof item.timestamp !== "string" || !Number.isFinite(Date.parse(item.timestamp))) return [];
    if (typeof item.username !== "string" || item.username.toLowerCase() !== expectedUsername.toLowerCase()) return [];
    if (!["IMAGE", "VIDEO", "CAROUSEL_ALBUM"].includes(item.media_type) || seen.has(item.id)) return [];
    seen.add(item.id);
    return [{
      id: item.id,
      caption: typeof item.caption === "string" ? item.caption : "",
      imageUrl: safeUrl(item.media_type === "VIDEO" ? item.thumbnail_url : item.media_url, "image"),
      permalink,
      timestamp: item.timestamp,
      username: item.username,
      type: item.media_type,
    }];
  }).sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp)).slice(0, 3);
}
