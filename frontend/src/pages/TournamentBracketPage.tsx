import React, { useState, useEffect } from "react";
import { tournamentStagesApi } from "../api/tournamentStages";

interface GroupBracket { group: { name: string }; points: any[]; matches: any[]; }

export default function TournamentBracketPage() {
  const [bracket, setBracket] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    tournamentStagesApi.getBracket()
      .then(r => setBracket(r.data?.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center items-center h-64 text-gray-400">Loading bracket…</div>;
  if (!bracket) return <div className="text-center text-gray-400 py-20">Bracket not available yet.</div>;

  const { super12_groups = [], quarter_finals = [], semi_finals = [], final, champion } = bracket;

  const stageColor = (status: string) =>
    status === "completed" ? "border-emerald-500 bg-emerald-950/30" :
    status === "live" ? "border-red-500 bg-red-950/30" : "border-gray-600 bg-gray-800/60";

  const MatchBox = ({ m, label }: { m: any; label?: string }) => (
    <div className={`border rounded-xl p-3 text-sm ${stageColor(m.status)} min-w-[180px]`}>
      {label && <p className="text-xs font-bold text-amber-400 mb-1">{label}</p>}
      <div className="space-y-1">
        <div className={`flex justify-between ${m.winner_id === m.team1_id ? "text-emerald-300 font-bold" : "text-gray-300"}`}>
          <span>{m.team1_id ? m.team1_id.slice(-5) : "TBD"}</span>
          <span>{m.team1_score != null ? `${m.team1_score}/${m.team1_wickets || 0}` : ""}</span>
        </div>
        <div className={`flex justify-between ${m.winner_id === m.team2_id ? "text-emerald-300 font-bold" : "text-gray-300"}`}>
          <span>{m.team2_id ? m.team2_id.slice(-5) : "TBD"}</span>
          <span>{m.team2_score != null ? `${m.team2_score}/${m.team2_wickets || 0}` : ""}</span>
        </div>
      </div>
      {m.match_date && <p className="text-xs text-gray-500 mt-1">{m.match_date} {m.start_time || ""}</p>}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-950 text-white px-4 py-8 space-y-10">
      <h1 className="text-3xl font-bold text-center text-amber-400">🏆 Tournament Bracket</h1>

      {/* Champion banner */}
      {champion?.champion_team_id && (
        <div className="text-center bg-amber-500/20 border border-amber-500 rounded-2xl py-6 px-4">
          <p className="text-xs text-amber-400 font-semibold tracking-widest uppercase mb-1">Champion</p>
          <p className="text-2xl font-black text-amber-300">🏆 {champion.champion_team_id.slice(-8)}</p>
          {champion.runner_up_team_id && <p className="text-sm text-gray-400 mt-1">Runner-up: {champion.runner_up_team_id.slice(-8)}</p>}
        </div>
      )}

      {/* Super 12 */}
      {super12_groups.length > 0 && (
        <section>
          <h2 className="text-xl font-bold text-center mb-4 text-gray-300">Super 12</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {super12_groups.map((g: GroupBracket) => (
              <div key={g.group.name} className="space-y-2">
                <h3 className="text-amber-400 font-bold text-center text-sm">{g.group.name}</h3>
                {/* Points mini-table */}
                <div className="bg-gray-800/80 rounded-lg p-2 text-xs">
                  {g.points.map((p: any, i: number) => (
                    <div key={p.id} className="flex justify-between text-gray-300 py-0.5">
                      <span>{i+1}. {p.team_id.slice(-5)}</span>
                      <span className="text-amber-300 font-bold">{p.points}pts</span>
                    </div>
                  ))}
                </div>
                {/* Matches */}
                <div className="space-y-1">
                  {g.matches.map((m: any) => (
                    <MatchBox key={m.id} m={m} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Quarter Finals */}
      {quarter_finals.length > 0 && (
        <section>
          <h2 className="text-xl font-bold text-center mb-4 text-gray-300">Quarter Finals</h2>
          <div className="flex flex-wrap justify-center gap-4">
            {quarter_finals.map((m: any) => <MatchBox key={m.id} m={m} label={`QF${m.match_number}`} />)}
          </div>
        </section>
      )}

      {/* Arrow */}
      {quarter_finals.length > 0 && semi_finals.length > 0 && (
        <div className="text-center text-2xl text-gray-600">↓</div>
      )}

      {/* Semi Finals */}
      {semi_finals.length > 0 && (
        <section>
          <h2 className="text-xl font-bold text-center mb-4 text-gray-300">Semi Finals</h2>
          <div className="flex flex-wrap justify-center gap-8">
            {semi_finals.map((m: any) => <MatchBox key={m.id} m={m} label={`SF${m.match_number}`} />)}
          </div>
        </section>
      )}

      {semi_finals.length > 0 && final && (
        <div className="text-center text-2xl text-gray-600">↓</div>
      )}

      {/* Final */}
      {final && (
        <section>
          <h2 className="text-xl font-bold text-center mb-4 text-amber-400">🏆 Final</h2>
          <div className="flex justify-center">
            <MatchBox m={final} label="FINAL" />
          </div>
        </section>
      )}
    </div>
  );
}
