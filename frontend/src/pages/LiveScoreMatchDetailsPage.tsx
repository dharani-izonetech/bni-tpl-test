import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { matchesApi, scoringApi } from "@/api/services";
import { useMatchWebSocket } from "@/hooks/useWebSocket";
import { adaptLiveScore, adaptMatchSummary } from "@/lib/matchCenterAdapter";
import type { Match } from "@/types/match-center";
import { VideoPlayer } from "@/components/match-center/video-player";
import { ScoreRibbon } from "@/components/match-center/score-ribbon";
import { LiveScorecard } from "@/components/match-center/live-scorecard";
import { MatchInfoCard } from "@/components/match-center/match-info-card";
import { OverProgress } from "@/components/match-center/over-progress";

const LiveScoreMatchDetailsPage = () => {
  const { matchId } = useParams();
  const id = matchId || "";

  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);

  // Real-time updates for a live match.
  const { lastUpdate } = useMatchWebSocket(
    match?.status === "LIVE" ? id : null,
  );

  const load = async () => {
    try {
      const [summaryRaw, live, scorecard] = await Promise.all([
        matchesApi.get(id).catch(() => null),
        scoringApi.getLiveScore(id).catch(() => null),
        matchesApi.getScorecard(id).catch(() => []),
      ]);
      const summary = summaryRaw ? adaptMatchSummary(summaryRaw) : undefined;
      if (live) {
        setMatch(adaptLiveScore(live, summary, scorecard as any[]));
      } else if (summary) {
        setMatch(summary);
      } else {
        setMatch(null);
      }
    } catch {
      setMatch(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Refetch on every live score push.
  useEffect(() => {
    if (lastUpdate) void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastUpdate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-broadcast grid place-items-center">
        <span className="text-sm font-semibold uppercase tracking-widest text-muted-ink">
          Loading match…
        </span>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="min-h-screen bg-broadcast">
        <div className="container px-4 py-10 mx-auto max-w-7xl">
          <Link to="/live-scores" className="text-sm font-bold text-accent-red">
            ← Back to Live Scores
          </Link>
          <p className="mt-6 text-muted-ink">Match not found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-broadcast">
      <div className="container px-4 py-6 mx-auto max-w-7xl">
        <Link
          to="/live-scores"
          className="inline-block mb-6 text-sm font-bold text-accent-red"
        >
          ← Back to Live Scores
        </Link>

        <div className="mb-6">
          <h1 className="text-3xl font-black">{match.title}</h1>
          <p className="mt-2 text-muted-ink">{match.competition}</p>
          <p className="text-muted-ink">{match.venue}</p>

          {match.result && (
            <div className="mt-3">
              <span className="px-3 py-1 text-sm font-bold text-green-700 bg-green-100 rounded">
                {match.result}
              </span>
            </div>
          )}
        </div>

        <div className="space-y-5">
          <VideoPlayer match={match} />
          <ScoreRibbon match={match} />

          {match.currentInnings && (
            <>
              <OverProgress match={match} />
              <MatchInfoCard match={match} />
            </>
          )}

          <LiveScorecard match={match} />
        </div>
      </div>
    </div>
  );
};

export default LiveScoreMatchDetailsPage;
