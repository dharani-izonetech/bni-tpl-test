/**
 * News storage — replaced with live API calls to backend /news endpoint.
 * Keeps the same public function signatures so all existing consumers work unchanged.
 */
import { apiFetch } from "@/lib/api";

const BASE = (import.meta.env.VITE_API_BASE_URL ?? "").trim();
const NEWS_STORAGE_EVENT = "bni-trichy-news-updated";

// ── Types (unchanged from original) ───────────────────────────────────────
export type Language = "en" | "ta";
export type LocalizedText = { en: string; ta: string };

export type NewsItem = {
  category: any;
  id: string;
  newsTitle: LocalizedText;
  newsDescription: LocalizedText;
  venue: LocalizedText;
  matchTime: LocalizedText;
  status: LocalizedText;
  audience: number;
  mediaEmbedUrl: string;
  matchStoryTitle: LocalizedText;
  matchStoryDescription: LocalizedText;
  matchStoryImageUrl: string;
  publishedAt: string;
};

export type NewsFormValues = Omit<NewsItem, "id" | "publishedAt">;

const text = (en: string, ta = ""): LocalizedText => ({ en, ta });

export const emptyNewsForm: NewsFormValues = {

  category: "",
  newsTitle: text(""),
  newsDescription: text(""),
  venue: text(""),
  matchTime: text(""),
  status: text("Video story available", "வீடியோ செய்தி உள்ளது"),
  audience: 0,
  mediaEmbedUrl: "",
  matchStoryTitle: text(""),
  matchStoryDescription: text(""),
  matchStoryImageUrl: "",
};

// ── Adapter: backend shape → frontend shape ────────────────────────────────
function adapt(raw: Record<string, unknown>): NewsItem {
  return {
    category: String(raw.category ?? ""),
    id:               String(raw.id ?? ""),
    newsTitle:        { en: String(raw.news_title_en ?? ""), ta: String(raw.news_title_ta ?? "") },
    newsDescription:  { en: String(raw.news_description_en ?? ""), ta: String(raw.news_description_ta ?? "") },
    venue:            { en: String(raw.venue_en ?? ""), ta: String(raw.venue_ta ?? "") },
    matchTime:        { en: String(raw.match_time_en ?? ""), ta: String(raw.match_time_ta ?? "") },
    status:           { en: String(raw.status_en ?? "Video story available"), ta: String(raw.status_ta ?? "") },
    audience:         Number(raw.audience ?? 0),
    mediaEmbedUrl:    String(raw.media_embed_url ?? ""),
    matchStoryTitle:  { en: String(raw.match_story_title_en ?? ""), ta: String(raw.match_story_title_ta ?? "") },
    matchStoryDescription: { en: String(raw.match_story_description_en ?? ""), ta: String(raw.match_story_description_ta ?? "") },
    matchStoryImageUrl: String(raw.match_story_image_url ?? ""),
    publishedAt:      String(raw.published_at ?? new Date().toISOString()),
  };
}

// ── Cache ──────────────────────────────────────────────────────────────────
let _cache: NewsItem[] | null = null;

async function fetchAll(adminMode = false): Promise<NewsItem[]> {
  const hasToken = !!localStorage.getItem("bni_access_token");
  // Public endpoint max page_size is now 100; admin endpoint also allows up to 100.
  const path = (adminMode && hasToken)
    ? "/news/admin/all?page=1&page_size=100"
    : "/news?page=1&page_size=100";
  const res = await apiFetch<{ data: unknown[] }>(path);
  _cache = (res.data ?? []).map(r => adapt(r as Record<string, unknown>));
  window.dispatchEvent(new Event(NEWS_STORAGE_EVENT));
  return _cache;
}

// ── Public API (same signatures as original) ───────────────────────────────
export const getNewsItems = (): NewsItem[] => _cache ?? [];

/** Used by the public News page — always fetches from the public endpoint. */
export const getNewsItemsAsync = async (): Promise<NewsItem[]> => fetchAll(false);

/** Used by the admin dashboard — fetches from the admin endpoint (all drafts included). */
export const getNewsItemsAdminAsync = async (): Promise<NewsItem[]> => fetchAll(true);

export const addNewsItem = async (values: NewsFormValues): Promise<NewsItem> => {
  const body = {
    news_title:              values.newsTitle,
    news_description:        values.newsDescription,
    venue:                   values.venue,
    match_time:              values.matchTime,
    status:                  values.status,
    audience:                values.audience,
    media_embed_url:         values.mediaEmbedUrl,
    match_story_title:       values.matchStoryTitle,
    match_story_description: values.matchStoryDescription,
    match_story_image_url:   values.matchStoryImageUrl || null,
    is_published:            true,
  };
  const res = await apiFetch<{ data: Record<string, unknown> }>("/news", {
    method: "POST",
    body: JSON.stringify(body),
  });
  const item = adapt(res.data);
  _cache = [item, ...(_cache ?? [])];
  window.dispatchEvent(new Event(NEWS_STORAGE_EVENT));
  return item;
};

export const updateNewsItem = async (id: string, values: NewsFormValues): Promise<NewsItem | null> => {
  const body = {
    news_title:              values.newsTitle,
    news_description:        values.newsDescription,
    venue:                   values.venue,
    match_time:              values.matchTime,
    status:                  values.status,
    audience:                values.audience,
    media_embed_url:         values.mediaEmbedUrl,
    match_story_title:       values.matchStoryTitle,
    match_story_description: values.matchStoryDescription,
    match_story_image_url:   values.matchStoryImageUrl || null,
  };
  const res = await apiFetch<{ data: Record<string, unknown> }>(`/news/${id}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
  const updated = adapt(res.data);
  _cache = (_cache ?? []).map(n => n.id === id ? updated : n);
  window.dispatchEvent(new Event(NEWS_STORAGE_EVENT));
  return updated;
};

export const deleteNewsItem = async (id: string): Promise<void> => {
  await apiFetch(`/news/${id}`, { method: "DELETE" });
  _cache = (_cache ?? []).filter(n => n.id !== id);
  window.dispatchEvent(new Event(NEWS_STORAGE_EVENT));
};

export const incrementNewsAudience = async (id: string): Promise<NewsItem | null> => {
  const item = (_cache ?? []).find(n => n.id === id);
  if (!item) return null;
  return updateNewsItem(id, { ...item, audience: item.audience + 1 });
};

export const subscribeToNewsItems = (callback: () => void) => {
  const handleStorage = (event: StorageEvent) => {
    if (event.key === "bni_trichy_news_items") callback();
  };
  window.addEventListener(NEWS_STORAGE_EVENT, callback);
  window.addEventListener("storage", handleStorage);
  return () => {
    window.removeEventListener(NEWS_STORAGE_EVENT, callback);
    window.removeEventListener("storage", handleStorage);
  };
};
