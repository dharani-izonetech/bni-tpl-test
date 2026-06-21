import { type CSSProperties } from "react";
import { cn } from "@/lib/utils";
import type { Match, RevealPhase } from "@/types/tournament";

interface Props {
  matches: Match[];
  revealPhase: RevealPhase;
  activeMatchIndex: number | null; // index of match currently being revealed
  selectedTeamName: string | null;
  groupLabel: string;
}

const MatchReveal = ({
  matches,
  revealPhase,
  activeMatchIndex,
  selectedTeamName,
  groupLabel,
}: Props) => {
  const isEmpty = matches.length === 0;

  return (
    <div
      className={cn(
        "flex flex-col rounded-2xl border p-4 md:p-6",
        "border-[rgba(166,124,0,0.35)]",
        "bg-[linear-gradient(160deg,#F0E8D0_0%,#F0C040_52%,#A67C00_100%)]",
        "shadow-[0_30px_64px_rgba(28,22,0,0.42),0_0_58px_rgba(166,124,0,0.4),inset_0_1px_0_rgba(255,255,255,0.35),inset_0_-22px_40px_rgba(28,22,0,0.22)]",
        "ring-1 ring-[rgba(166,124,0,0.4)]",
      )}
    >
      {/* Header */}
      <div className="mb-4 rounded-xl border border-[rgba(166,124,0,0.3)] bg-[rgba(255,253,245,0.55)] px-4 py-2 text-center">
        <p className="font-heading text-xs font-bold uppercase tracking-[0.18em] text-[#5C4A10]">
          {selectedTeamName
            ? `Match Reveal Card: ${selectedTeamName}`
            : `${groupLabel} — Match Reveal`}
        </p>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-3">
        {isEmpty ? (
          <div className="flex flex-1 items-center justify-center rounded-xl border border-[rgba(166,124,0,0.2)] bg-[rgba(255,253,245,0.4)] p-8 text-center">
            <p className="text-sm text-[#5C4A10]">
              {selectedTeamName
                ? "Spinning to generate matches…"
                : "Select a team to start match picking."}
            </p>
          </div>
        ) : (
          matches.map((match, idx) => {
            const isActive = activeMatchIndex === idx;
            const isRevealed = activeMatchIndex === null || idx < (activeMatchIndex ?? matches.length);

            return (
              <MatchCard
                key={match.matchNumber}
                match={match}
                isActive={isActive}
                isRevealed={isRevealed}
                revealPhase={isActive ? revealPhase : "done"}
                delay={idx * 120}
              />
            );
          })
        )}
      </div>
    </div>
  );
};

// ── Individual match card ────────────────────────────────────────────────────
interface MatchCardProps {
  match: Match;
  isActive: boolean;
  isRevealed: boolean;
  revealPhase: RevealPhase;
  delay: number;
}

const MatchCard = ({ match, isActive, isRevealed, revealPhase, delay }: MatchCardProps) => {
  const showTeam1 = isRevealed || revealPhase === "team1" || revealPhase === "versus" || revealPhase === "team2" || revealPhase === "done";
  const showVs = isRevealed || revealPhase === "versus" || revealPhase === "team2" || revealPhase === "done";
  const showTeam2 = isRevealed || revealPhase === "team2" || revealPhase === "done";

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border px-4 py-3 transition-all duration-300",
        "border-[rgba(166,124,0,0.4)]",
        "bg-[linear-gradient(135deg,rgba(240,232,208,0.9)_0%,rgba(240,192,64,0.55)_100%)]",
        "shadow-[0_4px_16px_rgba(28,22,0,0.18),inset_0_1px_0_rgba(255,255,255,0.5)]",
        isActive && "ring-2 ring-[#A67C00] shadow-[0_0_24px_rgba(166,124,0,0.5)]",
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Shimmer overlay when active */}
      {isActive && revealPhase === "loading" && (
        <div className="absolute inset-0 overflow-hidden rounded-xl">
          <div
            className="absolute inset-0 -translate-x-full animate-[shimmer_1s_ease-in-out_infinite]"
            style={{
              background:
                "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)",
            }}
          />
        </div>
      )}

      <div className="flex items-center justify-between gap-2">
        {/* Match number */}
        <span className="shrink-0 font-heading text-xs font-bold uppercase tracking-[0.14em] text-[#5C4A10]">
          Match {match.matchNumber}:
        </span>

        {/* Teams */}
        <div className="flex flex-1 items-center justify-center gap-2 overflow-hidden">
          {/* Team 1 */}
          <span
            className={cn(
              "font-heading text-sm font-bold text-[#1A1200] transition-all duration-300 sm:text-base",
              showTeam1 ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4",
            )}
            style={
              {
                transitionDelay: showTeam1 ? "0ms" : "0ms",
              } as CSSProperties
            }
          >
            {match.team1.name}
          </span>

          {/* VS */}
          <span
            className={cn(
              "shrink-0 font-heading text-xs font-black uppercase tracking-[0.12em] text-[#A67C00] transition-all duration-200",
              showVs ? "opacity-100 scale-100" : "opacity-0 scale-50",
            )}
          >
            vs
          </span>

          {/* Team 2 */}
          <span
            className={cn(
              "font-heading text-sm font-bold text-[#1A1200] transition-all duration-300 sm:text-base",
              showTeam2 ? "opacity-100 translate-x-0" : "opacity-0 translate-x-4",
            )}
          >
            {match.team2.name}
          </span>
        </div>
      </div>
    </div>
  );
};

export default MatchReveal;
