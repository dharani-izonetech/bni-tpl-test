import type { Match } from "@/types/match-center";
import { TeamBadge } from "./shared";

/**
 * Determine what to render:
 *  - youtubeId is a bare 11-char ID  → embed as YouTube iframe
 *  - youtubeId is a full embed/watch URL → embed as iframe
 *  - youtubeId is a data URI or http URL for a video file → render as <video>
 *  - null/undefined → show "Stream offline" placeholder
 */
function resolveVideoSrc(youtubeId?: string): { type: "youtube" | "file" | "none"; src: string } {
  if (!youtubeId) return { type: "none", src: "" };

  // Bare 11-char YouTube ID
  if (/^[A-Za-z0-9_-]{11}$/.test(youtubeId)) {
    return { type: "youtube", src: `https://www.youtube.com/embed/${youtubeId}?rel=0&modestbranding=1&autoplay=1` };
  }

  // Any YouTube URL → extract ID and embed
  const ytPatterns = [
    /youtube\.com\/embed\/([A-Za-z0-9_-]{11})/,
    /[?&]v=([A-Za-z0-9_-]{11})/,
    /youtu\.be\/([A-Za-z0-9_-]{11})/,
    /youtube\.com\/live\/([A-Za-z0-9_-]{11})/,
  ];
  for (const pattern of ytPatterns) {
    const match = youtubeId.match(pattern);
    if (match) {
      return { type: "youtube", src: `https://www.youtube.com/embed/${match[1]}?rel=0&modestbranding=1&autoplay=1` };
    }
  }

  // data: URI or direct video URL → use <video> tag
  if (youtubeId.startsWith("data:video") || youtubeId.startsWith("http")) {
    return { type: "file", src: youtubeId };
  }

  // Fallback: treat as an embed URL directly
  return { type: "youtube", src: youtubeId };
}

export function VideoPlayer({ match }: { match: Match }) {
  const { type, src } = resolveVideoSrc(match.youtubeId);

  return (
    <div className="relative w-full overflow-hidden border rounded-2xl border-ink/10 bg-ink shadow-broadcast group">
      <div className="relative w-full" style={{ aspectRatio: "16 / 9" }}>

        {type === "youtube" && (
          <iframe
            src={src}
            title={match.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="absolute inset-0 w-full h-full border-0"
          />
        )}

        {type === "file" && (
          <video
            src={src}
            controls
            autoPlay
            className="absolute inset-0 w-full h-full"
            style={{ background: "#000" }}
          />
        )}

        {type === "none" && (
          <div className="absolute inset-0 grid place-items-center bg-gradient-to-br from-ink to-[#1E293B]">
            <div className="text-center">
              <div className="grid w-16 h-16 mx-auto mb-3 rounded-full place-items-center bg-accent-red/20 backdrop-blur">
                <div className="w-0 h-0 ml-1 border-t-8 border-b-8 border-l-[14px] border-transparent border-l-accent-red" />
              </div>
              <p className="text-sm font-semibold tracking-widest uppercase text-cream/70">
                Stream offline
              </p>
            </div>
          </div>
        )}

        {/* Top overlay: LIVE badge + competition */}
        <div className="absolute inset-x-0 top-0 flex items-start justify-between p-3 pointer-events-none md:p-4 bg-gradient-to-b from-black/70 to-transparent">
          <div className="flex items-center gap-2">
            {match.status === "LIVE" && (
              <span className="flex items-center gap-1.5 rounded-md bg-accent-red px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-widest text-white live-pulse">
                <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                Live
              </span>
            )}
            <span className="rounded-md bg-black/55 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur">
              {match.competition}
            </span>
          </div>
          <div className="hidden md:flex items-center gap-2 rounded-md bg-black/55 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur">
            {match.venue}
          </div>
        </div>

        {/* Bottom overlay: team badges + title */}
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-3 pointer-events-none md:p-4 bg-gradient-to-t from-black/85 via-black/40 to-transparent">
          <div className="flex items-center gap-3">
            <TeamBadge short={match.teamA.short} color={match.teamA.color} size={38} />
            <span className="text-xs font-extrabold tracking-widest text-accent-red">VS</span>
            <TeamBadge short={match.teamB.short} color={match.teamB.color} size={38} />
          </div>
          <p className="hidden md:block max-w-[60%] truncate text-right text-sm font-bold text-white/90">
            {match.title}
          </p>
        </div>
      </div>
    </div>
  );
}
