import Image from "next/image";
import { ExternalLink, Images, Play } from "lucide-react";
import type { InstagramPost } from "@/lib/instagram-posts";

const dateFormat = new Intl.DateTimeFormat("es-CL", {
  day: "numeric", month: "short", year: "numeric", timeZone: "America/Santiago",
});

export function InstagramFeed({ posts }: { posts: InstagramPost[] }) {
  return (
    <div className="min-w-0">
      <p className="mb-3 text-xs font-bold text-muted-foreground">Últimas publicaciones · @posada.delhechicero</p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {posts.map(post => (
          <a key={post.id} href={post.permalink} target="_blank" rel="noopener noreferrer" className="group flex min-w-0 flex-col overflow-hidden rounded-[1.25rem] border border-border bg-card transition hover:border-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary" aria-label={`Ver publicación en Instagram: ${post.caption.slice(0, 100) || dateFormat.format(new Date(post.timestamp))}`}>
            <div className="relative aspect-[4/5] overflow-hidden bg-muted">
              {post.imageUrl ? <Image src={post.imageUrl} alt={post.caption.slice(0, 180) || "Publicación de La Posada del Hechicero"} fill unoptimized className="object-cover transition duration-500 group-hover:scale-[1.03]" sizes="(max-width: 639px) 100vw, (max-width: 1023px) 33vw, 24vw" /> : <span className="absolute inset-0 grid place-items-center text-sm">Ver en Instagram</span>}
              {post.type !== "IMAGE" && <span className="absolute right-3 top-3 rounded-full bg-black/60 p-2 text-white">{post.type === "VIDEO" ? <Play className="size-4" aria-label="Video" /> : <Images className="size-4" aria-label="Varias imágenes" />}</span>}
            </div>
            <div className="flex flex-1 flex-col p-4">
              <p className="mb-4 line-clamp-3 break-words text-sm leading-6">{post.caption || "Ver publicación en Instagram"}</p>
              <div className="mt-auto flex items-center justify-between gap-2 text-xs text-muted-foreground">
                <time dateTime={post.timestamp}>{dateFormat.format(new Date(post.timestamp))}</time>
                <ExternalLink className="size-4 shrink-0" aria-hidden="true" />
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
