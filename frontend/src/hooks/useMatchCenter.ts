/**
 * useMatchCenter.ts
 * ----------------------------------------------------------------------------
 * Data layer for the public Match Center (Live Video) page.
 *
 * Pulls real matches from the scoring backend, keeps the active match live via
 * WebSocket (with polling fallback), and also fetches the BNI video attachment
 * (YouTube URL / uploaded file) for the active match so VideoPlayer can render it.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { matchesApi, scoringApi } from "@/api/services";
import { useMatchWebSocket } from "@/hooks/useWebSocket";
import { adaptMatchSummary, adaptLiveScore } from "@/lib/matchCenterAdapter";
import type { Match } from "@/types/match-center";

const LIST_POLL_MS   = 15_000;  // refresh live/upcoming/completed lists
const DETAIL_POLL_MS = 8_000;   // fallback refresh for active match detail
const API_BASE       = (import.meta.env.VITE_API_BASE_URL ?? "").trim();

// ── Video attachment helpers ───────────────────────────────────────────────

/** Fetch the BNI video linked to a scoring match (public, no auth). */
async function fetchVideoForMatch(matchId: string): Promise<string | null> {
  try {
    const res = await fetch(`${API_BASE}/live-scores/by-match/${matchId}`);
    if (!res.ok) return null;
    const json = await res.json() as {
      data?: { video?: { embed_url?: string; public_url?: string } | null } | null;
    };
    const video = json.data?.video;
    if (!video) return null;
    return video.embed_url ?? video.public_url ?? null;
  } catch {
    return null;
  }
}

/**
 * Normalise a video URL/ID into the value stored in Match.youtubeId.
 * For YouTube links we extract the bare video ID so VideoPlayer can build
 * the embed URL. For non-YouTube URLs we return the URL as-is.
 */
function extractYouTubeId(url: string): string | undefined {
  if (!url) return undefined;
  if (/^[A-Za-z0-9_-]{11}$/.test(url)) return url;
  const patterns = [
    /youtube\.com\/embed\/([A-Za-z0-9_-]{11})/,
    /[?&]v=([A-Za-z0-9_-]{11})/,
    /youtu\.be\/([A-Za-z0-9_-]{11})/,
    /youtube\.com\/live\/([A-Za-z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  // Non-YouTube URL (uploaded file / other embed) — return raw
  return url;
}

// ── State shape ────────────────────────────────────────────────────────────

interface MatchCenterState {
  liveMatches: Match[];
  upcomingMatches: Match[];
  recentMatches: Match[];
  activeMatch: Match | null;
  activeId: string;
  setActiveId: (id: string) => void;
  loading: boolean;
  error: boolean;
  isLive: boolean;
  isConnected: boolean;
  hasMatches: boolean;
  refresh: () => void;
}

// ── Hook ───────────────────────────────────────────────────────────────────

export function useMatchCenter(): MatchCenterState {
  const [liveMatches,     setLiveMatches]     = useState<Match[]>([]);
  const [upcomingMatches, setUpcomingMatches] = useState<Match[]>([]);
  const [recentMatches,   setRecentMatches]   = useState<Match[]>([]);
  const [activeDetail,    setActiveDetail]    = useState<Match | null>(null);
  const [activeId,        setActiveIdState]   = useState<string>("");
  const [loading,         setLoading]         = useState(true);
  const [error,           setError]           = useState(false);

  // Summary cache for all matches (venue / competition / date fallback)
  const summaryById = useRef<Record<string, Match>>({});

  const setActiveId = useCallback((id: string) => {
    setActiveIdState(id);
    setActiveDetail(null); // force fresh detail for new selection
  }, []);

  /* ── Load match lists ─────────────────────────────────────────────────── */
  const loadLists = useCallback(async () => {
    try {
      const [liveRaw, scheduledRaw, upcomingRaw, completedRaw] = await Promise.all([
        matchesApi.live().catch(() => []),
        matchesApi.list({ status: "scheduled" }).catch(() => []),
        matchesApi.list({ status: "UPCOMING" }).catch(() => []),
        matchesApi.list({ status: "COMPLETED" }).catch(() => []),
      ]);

      const liveSummaries = (liveRaw ?? []).map(adaptMatchSummary);

      // Enrich live summaries with real scores from the live-score endpoint
      const enrichedLive = await Promise.all(
        liveSummaries.map(async (m) => {
          try {
            const liveScore = await scoringApi.getLiveScore(m.id).catch(() => null);
            if (!liveScore) return m;
            const enriched = adaptLiveScore(liveScore, m, []);
            return enriched;
          } catch {
            return m;
          }
        })
      );

      // De-dupe upcoming across scheduled + upcoming statuses
      const upMap = new Map<string, Match>();
      [...(scheduledRaw ?? []), ...(upcomingRaw ?? [])]
        .map(adaptMatchSummary)
        .forEach((m) => upMap.set(m.id, m));
      const upcoming  = Array.from(upMap.values());
      const completed = (completedRaw ?? []).map(adaptMatchSummary);

      [...enrichedLive, ...upcoming, ...completed].forEach((m) => {
        summaryById.current[m.id] = m;
      });

      setError(false);
      setLiveMatches(enrichedLive);
      setUpcomingMatches(upcoming);
      setRecentMatches(completed);

      setActiveIdState((cur) => {
        if (cur && summaryById.current[cur]) return cur;
        return enrichedLive[0]?.id ?? upcoming[0]?.id ?? completed[0]?.id ?? "";
      });
    } catch (err) {
      console.warn("Match Center: failed to load match lists", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  /* ── Load rich detail (scores + video) for active match ──────────────── */
  const loadDetail = useCallback(async (id: string) => {
    if (!id) return;
    const summary = summaryById.current[id];

    // Always re-fetch video so newly attached URLs appear immediately
    const videoUrl  = await fetchVideoForMatch(id);
    const youtubeId = videoUrl ? extractYouTubeId(videoUrl) : undefined;

    try {
      const [live, scorecard] = await Promise.all([
        scoringApi.getLiveScore(id).catch(() => null),
        matchesApi.getScorecard(id).catch(() => []),
      ]);
      if (live) {
        const adapted = adaptLiveScore(live, summary, scorecard as any[]);
        setActiveDetail({ ...adapted, youtubeId: youtubeId ?? adapted.youtubeId });
      } else if (summary) {
        setActiveDetail({ ...summary, youtubeId: youtubeId ?? summary.youtubeId });
      }
    } catch (err) {
      console.warn("Match Center: failed to load match detail", err);
      if (summary) setActiveDetail({ ...summary, youtubeId: youtubeId ?? summary.youtubeId });
    }
  }, []);

  /* ── Polling ──────────────────────────────────────────────────────────── */
  useEffect(() => {
    void loadLists();
    const t = setInterval(() => void loadLists(), LIST_POLL_MS);
    return () => clearInterval(t);
  }, [loadLists]);

  useEffect(() => {
    if (!activeId) return;
    void loadDetail(activeId);
  }, [activeId, loadDetail]);

  /* ── WebSocket real-time updates ──────────────────────────────────────── */
  const isActiveLive = useMemo(
    () => liveMatches.some((m) => m.id === activeId),
    [liveMatches, activeId],
  );
  const { isConnected, lastUpdate } = useMatchWebSocket(
    isActiveLive ? activeId : null,
  );

  useEffect(() => {
    if (lastUpdate && activeId) {
      void loadDetail(activeId);
      void loadLists();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastUpdate]);

  useEffect(() => {
    if (!isActiveLive || isConnected) return;
    const t = setInterval(() => void loadDetail(activeId), DETAIL_POLL_MS);
    return () => clearInterval(t);
  }, [isActiveLive, isConnected, activeId, loadDetail]);

  /* ── Resolve active match ─────────────────────────────────────────────── */
  const activeMatch = useMemo<Match | null>(() => {
    if (activeDetail && activeDetail.id === activeId) return activeDetail;
    return (
      summaryById.current[activeId] ??
      liveMatches[0] ??
      upcomingMatches[0] ??
      recentMatches[0] ??
      null
    );
  }, [activeDetail, activeId, liveMatches, upcomingMatches, recentMatches]);

  const hasMatches =
    liveMatches.length + upcomingMatches.length + recentMatches.length > 0;

  return {
    liveMatches,
    upcomingMatches,
    recentMatches,
    activeMatch,
    activeId,
    setActiveId,
    loading,
    error,
    isLive: liveMatches.length > 0,
    isConnected,
    hasMatches,
    refresh: () => void loadLists(),
  };
}
