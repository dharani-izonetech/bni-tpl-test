import { Play, X, Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";

type MediaItem = {
  id: string;
  filename: string;
  original_filename: string;
  media_type: "video_file" | "video_link" | "image";
  public_url?: string;
  embed_url?: string;
  created_at: string;
};

/* Fallback static items shown only when API returns no data */
const FALLBACK_THUMBS = [
  "https://images.unsplash.com/photo-1521412644187-c49fa049e84d?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1624526267942-ab0ff8a3e972?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1593341646782-e0b495cff86d?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&w=1200&q=80",
];

const thumbFor = (item: MediaItem, idx: number): string =>
  item.media_type === "image" && item.public_url
    ? item.public_url
    : FALLBACK_THUMBS[idx % FALLBACK_THUMBS.length];

const titleFor = (item: MediaItem): string =>
  item.original_filename.replace(/\.[^.]+$/, "").replace(/[-_]/g, " ");

const embedFor = (item: MediaItem): string | null => {
  if (item.embed_url) return item.embed_url;
  if (item.media_type === "video_file" && item.public_url) return item.public_url;
  return null;
};

const VideosSection = () => {
  const [media,       setMedia]       = useState<MediaItem[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [selectedId,  setSelectedId]  = useState<string | null>(null);

  const selected = useMemo(() => media.find(m => m.id === selectedId) ?? null, [media, selectedId]);

  useEffect(() => {
    apiFetch<{ data: MediaItem[] }>("/media?media_type=video_file&page_size=12")
      .then(res => {
        // merge video_link items too
        return apiFetch<{ data: MediaItem[] }>("/media?media_type=video_link&page_size=12").then(res2 => {
          setMedia([...(res.data ?? []), ...(res2.data ?? [])]);
        }).catch(() => { setMedia(res.data ?? []); });
      })
      .catch(() => setMedia([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selected) { document.body.style.overflow = ""; return; }
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setSelectedId(null); };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = ""; window.removeEventListener("keydown", onKey); };
  }, [selected]);

  if (loading) {
    return (
      <section id="videos" className="px-4 py-12 md:py-16">
        <div className="container mx-auto text-center">
          <h2 className="mb-6 text-center font-heading text-3xl font-bold uppercase text-foreground md:mb-8 md:text-4xl">Videos & Highlights</h2>
          <Loader2 className="inline animate-spin text-primary" size={32} />
        </div>
      </section>
    );
  }

  if (media.length === 0) {
    return (
      <section id="videos" className="px-4 py-12 md:py-16">
        <div className="container mx-auto">
          <h2 className="mb-6 text-center font-heading text-3xl font-bold uppercase text-foreground md:mb-8 md:text-4xl">Videos & Highlights</h2>
          <p className="text-center text-muted-foreground">No videos available yet. Check back soon!</p>
        </div>
      </section>
    );
  }

  return (
    <section id="videos" className="px-4 py-12 md:py-16">
      <div className="container mx-auto">
        <h2 className="mb-6 text-center font-heading text-3xl font-bold uppercase text-foreground md:mb-8 md:text-4xl">
          Videos & Highlights
        </h2>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {media.map((item, index) => (
            <div key={item.id} className="group animate-fade-up" style={{ animationDelay: `${index * 90}ms` }}>
              <div className="gold-panel relative aspect-video flex items-center justify-center overflow-hidden transition-transform duration-300 group-hover:-translate-y-1">
                <img
                  src={thumbFor(item, index)}
                  alt={titleFor(item)}
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/35 transition-colors group-hover:bg-black/25" />
                <button
                  type="button"
                  aria-label={`Play ${titleFor(item)}`}
                  onClick={() => setSelectedId(item.id)}
                  className="z-10 flex h-12 w-12 items-center justify-center rounded-full bg-primary/90 transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-foreground sm:h-14 sm:w-14"
                >
                  <Play className="ml-1 h-6 w-6 text-primary-foreground" />
                </button>
              </div>
              <h3 className="mt-3 font-heading text-sm font-semibold text-foreground transition-colors group-hover:text-primary sm:text-base capitalize">
                {titleFor(item)}
              </h3>
              <p className="text-xs text-muted-foreground">{item.media_type === "video_link" ? "External video" : "Uploaded video"}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Modal player */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-3 backdrop-blur-sm sm:p-6"
          role="dialog" aria-modal="true" aria-label={`${titleFor(selected)} video player`}
          onClick={() => setSelectedId(null)}
        >
          <div
            className="relative h-full w-full max-w-5xl overflow-hidden rounded-lg bg-black shadow-[0_28px_90px_rgba(0,0,0,0.55)]"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="absolute left-0 right-0 top-0 z-20 flex items-center justify-between gap-3 bg-gradient-to-b from-black/90 to-transparent p-3 text-white sm:p-5">
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-primary">
                  {selected.media_type === "video_link" ? "External Video" : "Uploaded Highlight"}
                </p>
                <h3 className="truncate font-heading text-xl font-bold sm:text-3xl capitalize">{titleFor(selected)}</h3>
              </div>
              <button
                type="button" aria-label="Close video" onClick={() => setSelectedId(null)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/12 text-white transition hover:bg-white/22"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Video content */}
            {embedFor(selected) ? (
              <iframe
                src={embedFor(selected)!}
                className="absolute inset-0 h-full w-full"
                allowFullScreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                title={titleFor(selected)}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <img src={thumbFor(selected, 0)} alt={titleFor(selected)} className="h-full w-full object-cover opacity-60" />
                <p className="absolute text-white/70 text-sm">Preview not available</p>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
};

export default VideosSection;
