
import { useEffect, useState } from "react";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Languages,
  MapPin,
  Newspaper,
  PlayCircle,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import NewsDetailsPopup from "@/components/NewsDetailsPopup";
import {
  getNewsItems,
  getNewsItemsAsync,
  incrementNewsAudience,
  subscribeToNewsItems,
  type Language,
  type NewsItem,
} from "@/lib/newsStorage";
import cricketBanner from "@/assets/images/bg1.png";

/* ─────────────────── helpers ─────────────────── */
const formatDate = (date: string) => {
  const d = new Date(date);
  if (isNaN(d.getTime())) return date;
  return d
    .toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
    .toUpperCase();
};

const FALLBACK_IMG = cricketBanner;
const ITEMS_PER_PAGE = 5;

function getYoutubeThumbnail(url: string): string | null {
  const m =
    url.match(/youtube\.com\/embed\/([^?&/]+)/) ||
    url.match(/youtu\.be\/([^?&/]+)/) ||
    url.match(/[?&]v=([^&]+)/);
  return m ? `https://img.youtube.com/vi/${m[1]}/hqdefault.jpg` : null;
}

function getCardImage(post: NewsItem): string {
  if (post.matchStoryImageUrl?.trim()) return post.matchStoryImageUrl;
  const e = post.mediaEmbedUrl?.trim();
  if (e) {
    if (e.includes("youtube") || e.includes("youtu.be"))
      return getYoutubeThumbnail(e) ?? FALLBACK_IMG;
    return e;
  }
  return FALLBACK_IMG;
}

function getPageNumbers(current: number, total: number): (number | "...")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | "...")[] = [1];
  if (current > 3) pages.push("...");
  for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++)
    pages.push(i);
  if (current < total - 2) pages.push("...");
  pages.push(total);
  return pages;
}

/* ─────────────────── component ─────────────────── */
const NewsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [newsItems, setNewsItems] = useState<NewsItem[]>(() => getNewsItems());
  const [selectedPost, setSelectedPost] = useState<NewsItem | null>(null);
  const [language, setLanguage] = useState<Language>("en");
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [ready, setReady] = useState(false); // prevent flash before data loaded

  /* ── Load news, then resolve ?id= from URL ── */
  useEffect(() => {
    void getNewsItemsAsync()
      .then(() => {
        setNewsItems(getNewsItems());
        setFetchError(null);
      })
      .catch((err: unknown) =>
        setFetchError(err instanceof Error ? err.message : "Failed to load news.")
      )
      .finally(() => setReady(true));

    return subscribeToNewsItems(() => setNewsItems(getNewsItems()));
  }, []);

  /* ── When newsItems load OR URL changes, open the correct post ── */
  useEffect(() => {
    if (!ready) return;
    const params = new URLSearchParams(location.search);
    const id = params.get("id");
    if (id) {
      const items = getNewsItems();
      const match = items.find((n) => n.id === decodeURIComponent(id));
      if (match) {
        setSelectedPost(match);
        // Ensure the page containing this post is shown in the list
        const idx = items.findIndex((n) => n.id === match.id);
        if (idx !== -1) {
          setCurrentPage(Math.floor(idx / ITEMS_PER_PAGE) + 1);
        }
      }
    } else {
      setSelectedPost(null);
    }
  }, [ready, location.search, newsItems]);

  /* Reset page on language change */
  useEffect(() => { setCurrentPage(1); }, [language]);

  const totalPages = Math.ceil(newsItems.length / ITEMS_PER_PAGE);
  const paginatedNews = newsItems.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  /* ── Open post: update URL (so shareable), increment audience ── */
  const openPost = async (post: NewsItem) => {
    // Push the id into the URL so copy-paste always opens this exact post
    navigate(`/news?id=${encodeURIComponent(post.id)}`, { replace: false });

    const hasToken = !!localStorage.getItem("bni_access_token");
    if (hasToken) {
      try {
        const updated = await incrementNewsAudience(post.id);
        setNewsItems(getNewsItems());
        setSelectedPost(updated ?? post);
      } catch {
        setSelectedPost(post);
      }
    } else {
      setSelectedPost(post);
    }
  };

  /* ── Close popup: remove ?id= from URL ── */
  const handleClose = () => {
    setSelectedPost(null);
    navigate("/news", { replace: true });
  };

  const changePage = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const isTamil = language === "ta";

  return (
    <>
      <main className="min-h-screen bg-ipl-surface">

        {/* ══ Header ══ */}
        <section className="border-b border-border bg-white px-4 py-8 md:py-12">
          <div className="mx-auto w-full max-w-6xl">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-primary">
                  {isTamil ? "போட்டி செய்திகள்" : "Tournament Updates"}
                </p>
                <h1 className="mt-1 font-heading text-4xl font-bold uppercase text-foreground md:text-6xl">
                  {isTamil ? "செய்தி & வீடியோ" : "News & Blogs"}
                </h1>
                <p className="mt-2 max-w-2xl text-base leading-7 text-muted-foreground">
                  {isTamil
                    ? "Admin panel-இல் இருந்து சேர்க்கப்படும் செய்திகள், YouTube வீடியோக்கள், இட விவரங்கள்."
                    : "Latest cricket news, match stories, YouTube highlights, venue details, and live audience views from the admin panel."}
                </p>
              </div>

              {/* Language toggle */}
              <div className="inline-flex shrink-0 self-start rounded-xl border border-primary/30 bg-white p-1 shadow-sm sm:self-auto">
                <button
                  type="button"
                  onClick={() => setLanguage("en")}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-5 py-2.5 text-sm font-bold transition ${
                    language === "en"
                      ? "bg-primary text-primary-foreground shadow"
                      : "text-foreground hover:bg-primary/10"
                  }`}
                >
                  <Languages className="h-4 w-4" aria-hidden="true" />
                  English
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage("ta")}
                  className={`rounded-lg px-5 py-2.5 text-sm font-bold transition ${
                    language === "ta"
                      ? "bg-primary text-primary-foreground shadow"
                      : "text-foreground hover:bg-primary/10"
                  }`}
                >
                  தமிழ்
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ══ Content ══ */}
        <section className="px-4 py-8 md:py-12">
          <div className="mx-auto w-full max-w-6xl">

            {/* Error */}
            {fetchError && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
                <p className="text-sm font-semibold text-red-600">
                  Could not load news: {fetchError}
                </p>
                <p className="mt-1 text-xs text-red-400">
                  Check your connection or try refreshing the page.
                </p>
              </div>
            )}

            {/* Empty */}
            {!fetchError && newsItems.length === 0 && ready && (
              <div className="rounded-xl border border-primary/25 bg-white p-12 text-center shadow-sm">
                <Newspaper className="mx-auto h-12 w-12 text-primary" aria-hidden="true" />
                <h2 className="mt-4 font-heading text-2xl font-bold text-foreground">
                  {isTamil ? "செய்திகள் இல்லை" : "No news added yet"}
                </h2>
                <p className="mt-2 text-base text-muted-foreground">
                  {isTamil
                    ? "முதல் செய்தியை admin panel-இல் சேர்க்கவும்."
                    : "Add the first story from the admin panel."}
                </p>
              </div>
            )}

            {/* News list */}
            {!fetchError && newsItems.length > 0 && (
              <>
                <div className="flex flex-col gap-4 md:gap-5">
                  {paginatedNews.map((post, index) => {
                    const isFirst = index === 0 && currentPage === 1;
                    const img = getCardImage(post);

                    return (
                      <button
                        key={post.id}
                        type="button"
                        onClick={() => openPost(post)}
                        className="group w-full overflow-hidden rounded-2xl border border-border bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-stretch">

                          {/* ── Thumbnail — full image, no crop ── */}
                          <div className="relative w-full shrink-0 overflow-hidden bg-gray-50 sm:w-52 md:w-60 lg:w-64">
                            {/* Mobile: natural aspect ratio, max height capped */}
                            <img
                              src={img}
                              alt={post.newsTitle[language]}
                              loading="lazy"
                              className="block w-full object-contain transition-transform duration-500 group-hover:scale-[1.03] sm:hidden"
                              style={{ maxHeight: "220px" }}
                              onError={(e) => { e.currentTarget.src = FALLBACK_IMG; }}
                            />
                            {/* Desktop: fill the sidebar width, contain so nothing is cut */}
                            <img
                              src={img}
                              alt={post.newsTitle[language]}
                              loading="lazy"
                              className="hidden h-full w-full object-contain transition-transform duration-500 group-hover:scale-[1.03] sm:block"
                              style={{ minHeight: "160px", maxHeight: "220px" }}
                              onError={(e) => { e.currentTarget.src = FALLBACK_IMG; }}
                            />

                            {/* Play overlay */}
                            {post.mediaEmbedUrl?.trim() && (
                              <span className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity group-hover:opacity-100">
                                <PlayCircle className="h-10 w-10 text-white drop-shadow-lg" />
                              </span>
                            )}
                            {/* Latest badge */}
                            {isFirst && (
                              <span className="absolute bottom-3 left-3 rounded-md bg-primary px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-primary-foreground shadow">
                                {isTamil ? "புதியது" : "Latest"}
                              </span>
                            )}
                          </div>

                          {/* ── Body ── */}
                          <div className="flex min-w-0 flex-1 flex-col gap-2 px-5 py-5 md:px-6 md:py-6">

                            {/* Category + Date */}
                            <div className="flex flex-wrap items-center gap-2">
                              {post.category?.[language] && (
                                <span className="rounded-md bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary">
                                  {post.category[language]}
                                </span>
                              )}
                              <span className="ml-auto text-xs font-semibold tabular-nums text-muted-foreground">
                                {formatDate(post.publishedAt)}
                              </span>
                            </div>

                            {/* Title */}
                            <h2 className="line-clamp-2 font-heading text-xl font-bold leading-snug text-foreground transition-colors group-hover:text-primary md:text-2xl">
                              {post.newsTitle[language]}
                            </h2>

                            {/* Excerpt */}
                            <p className="line-clamp-2 text-base leading-7 text-muted-foreground md:line-clamp-3">
                              {post.newsDescription[language]}
                            </p>

                            {/* Footer */}
                            <div className="mt-auto flex flex-wrap items-center gap-3 pt-2">
                              {post.venue?.[language] && (
                                <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">
                                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                                  {post.venue[language]}
                                </span>
                              )}
                              <span className="ml-auto flex items-center gap-1.5 text-sm font-bold text-primary">
                                {isTamil ? "முழுவதும் படிக்க" : "Read More"}
                                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                              </span>
                            </div>

                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* ── Pagination ── */}
                {totalPages > 1 && (
                  <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
                    <button
                      type="button"
                      disabled={currentPage === 1}
                      onClick={() => changePage(currentPage - 1)}
                      className="flex h-10 min-w-[80px] items-center justify-center gap-1.5 rounded-lg border border-border bg-white px-4 text-sm font-semibold text-foreground shadow-sm transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      {isTamil ? "முந்தைய" : "Prev"}
                    </button>

                    {getPageNumbers(currentPage, totalPages).map((page, i) =>
                      page === "..." ? (
                        <span
                          key={`ellipsis-${i}`}
                          className="flex h-10 w-10 items-center justify-center text-sm text-muted-foreground"
                        >
                          …
                        </span>
                      ) : (
                        <button
                          key={page}
                          type="button"
                          onClick={() => changePage(page as number)}
                          className={`flex h-10 w-10 items-center justify-center rounded-lg border text-sm font-bold transition ${
                            currentPage === page
                              ? "border-primary bg-primary text-primary-foreground shadow"
                              : "border-border bg-white text-foreground hover:bg-muted"
                          }`}
                        >
                          {page}
                        </button>
                      )
                    )}

                    <button
                      type="button"
                      disabled={currentPage === totalPages}
                      onClick={() => changePage(currentPage + 1)}
                      className="flex h-10 min-w-[80px] items-center justify-center gap-1.5 rounded-lg border border-border bg-white px-4 text-sm font-semibold text-foreground shadow-sm transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {isTamil ? "அடுத்து" : "Next"}
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </>
            )}

          </div>
        </section>
      </main>

      <NewsDetailsPopup
        post={selectedPost}
        onClose={handleClose}
        formatDate={formatDate}
        language={language}
      />
    </>
  );
};

export default NewsPage;