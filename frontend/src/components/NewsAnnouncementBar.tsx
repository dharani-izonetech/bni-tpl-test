import { useEffect, useMemo, useState } from "react";
import { Megaphone } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  getNewsItems,
  getNewsItemsAsync,
  subscribeToNewsItems,
  type NewsItem,
} from "@/lib/newsStorage";

/**
 * NewsAnnouncementBar
 * ─────────────────────────────────────────────────────────────────────────
 * A slim, continuously-sliding green announcement strip that sits between
 * the Hero section and the Sponsors section. It does NOT touch HeroSection
 * itself — it is composed in Index.tsx as its own section.
 *
 * - Pulls the same news data used by the News page / NewsBlogsSection.
 * - Renders nothing if there is no published news (no empty bar on screen).
 * - Clicking any headline opens the News page for that item
 *   (same `/news?id=` pattern already used across the app).
 * - The marquee pauses on hover/keyboard focus so it stays readable.
 */
const MAX_TICKER_ITEMS = 12;

const NewsAnnouncementBar = () => {
  const navigate = useNavigate();
  const [newsItems, setNewsItems] = useState<NewsItem[]>(() => getNewsItems());

  useEffect(() => {
    void getNewsItemsAsync();
    return subscribeToNewsItems(() => setNewsItems(getNewsItems()));
  }, []);

  const tickerItems = useMemo(
    () => newsItems.slice(0, MAX_TICKER_ITEMS),
    [newsItems]
  );

  // Nothing published yet — don't render an empty strip between the
  // Hero and Sponsors sections.
  if (tickerItems.length === 0) return null;

  const openNews = (id: string) =>
    navigate(`/news?id=${encodeURIComponent(id)}`);

  // Duplicate the list once so the CSS animation can loop seamlessly
  // from -50% back to 0% without a visible jump.
  const loopItems = [...tickerItems, ...tickerItems];

  // Scale animation speed with the number of items so the reading pace
  // stays roughly the same whether there are 2 items or 12.
  const durationSeconds = Math.max(tickerItems.length * 7, 16);

  return (
    <section
      id="news-announcement"
      aria-label="Latest news announcements"
      className="relative z-10 flex h-12 items-stretch overflow-hidden border-y-2 border-[#CFA150] sm:h-14"
      style={{
        background: "linear-gradient(90deg, #0a3527 0%, #0F4A34 45%, #0d4530 100%)",
      }}
    >
      {/* Fixed "Latest News" label — click to view all news */}
      <button
        type="button"
        onClick={() => navigate("/news")}
        className="flex shrink-0 items-center gap-2 bg-[#CFA150] px-4 transition hover:bg-[#dba953] sm:px-6"
      >
        <span className="relative flex h-2 w-2 shrink-0">
          <span className="live-pulse absolute inline-flex h-full w-full rounded-full bg-[#B31217]" />
        </span>
        <Megaphone className="h-4 w-4 text-[#1a1200] sm:h-5 sm:w-5" aria-hidden="true" />
        <span className="hidden font-heading text-xs font-bold uppercase tracking-[0.12em] text-[#1a1200] sm:inline sm:text-sm">
          Latest News
        </span>
      </button>

      {/* Sliding headlines */}
      <div className="relative flex-1 overflow-hidden">
        <div
          className="news-ticker-track flex h-full items-center"
          style={{ animationDuration: `${durationSeconds}s` }}
        >
          {loopItems.map((item, i) => {
            const title = item.newsTitle.en?.trim() || item.matchStoryTitle.en?.trim();
            if (!title) return null;
            return (
              <span key={`${item.id}-${i}`} className="flex shrink-0 items-center">
                <button
                  type="button"
                  onClick={() => openNews(item.id)}
                  className="px-1 text-sm font-medium text-white/95 transition hover:text-[#f0c040] focus-visible:outline-none focus-visible:text-[#f0c040] sm:text-base"
                >
                  {title}
                </button>
                <span className="mx-4 select-none text-[#CFA150]" aria-hidden="true">
                  •
                </span>
              </span>
            );
          })}
        </div>

        {/* Soft edge fades so text doesn't hard-clip at the container edges */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-[#0a3527] to-transparent sm:w-12" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-[#0d4530] to-transparent sm:w-12" />
      </div>

      <style>{`
        @keyframes news-ticker-scroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .news-ticker-track {
          width: max-content;
          animation-name: news-ticker-scroll;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
        }
        .news-ticker-track:hover,
        .news-ticker-track:focus-within {
          animation-play-state: paused;
        }
        @media (prefers-reduced-motion: reduce) {
          .news-ticker-track {
            animation: none;
          }
        }
      `}</style>
    </section>
  );
};

export default NewsAnnouncementBar;
