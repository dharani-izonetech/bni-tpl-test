import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { GROUPS } from "@/data/tournamentData";
import GroupCard from "./GroupCard";
import type { GroupId } from "@/types/tournament";
import { playButtonClick } from "@/utils/audioEngine";

// Each group generates 2 matches → offsets: A=1, B=3, C=5, D=7
const GROUP_MATCH_OFFSETS: Record<GroupId, number> = {
  A: 0,
  B: 2,
  C: 4,
  D: 6,
  E: 8,
};

// Floating cricket ball particle
const Particle = ({ style }: { style: React.CSSProperties }) => (
  <div
    className="pointer-events-none absolute select-none text-2xl opacity-20"
    style={style}
  >
    🏏
  </div>
);

const PARTICLES: React.CSSProperties[] = [
  { top: "8%",  left: "4%",  animationDelay: "0s",    animationDuration: "6s"  },
  { top: "15%", right: "6%", animationDelay: "1.2s",  animationDuration: "7s"  },
  { top: "40%", left: "2%",  animationDelay: "2.4s",  animationDuration: "5.5s"},
  { top: "60%", right: "3%", animationDelay: "0.8s",  animationDuration: "8s"  },
  { top: "80%", left: "7%",  animationDelay: "3s",    animationDuration: "6.5s"},
  { top: "88%", right: "8%", animationDelay: "1.6s",  animationDuration: "7.5s"},
];

const TournamentPage = () => {
  const navigate = useNavigate();
  const [activeGroup, setActiveGroup] = useState<GroupId>("A");

  const handleGroupTab = (gid: GroupId) => {
    playButtonClick();
    setActiveGroup(gid);
  };

  return (
    <div
      className="relative min-h-screen overflow-x-hidden"
      style={{
        background:
          "linear-gradient(180deg, #FFFDF5 0%, #FFF8E8 60%, #F0E8D0 100%)",
      }}
    >
      {/* ── Floating particles ── */}
      {PARTICLES.map((style, i) => (
        <Particle key={i} style={{ ...style, animation: `float-gentle ${style.animationDuration} ease-in-out infinite` }} />
      ))}

      {/* ── Stadium glow blobs ── */}
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        aria-hidden
      >
        <div
          className="absolute -top-32 left-1/2 h-[420px] w-[700px] -translate-x-1/2 rounded-full opacity-20 blur-[80px]"
          style={{ background: "radial-gradient(circle, #F0C040 0%, transparent 70%)" }}
        />
        <div
          className="absolute bottom-0 right-0 h-[300px] w-[400px] rounded-full opacity-10 blur-[60px]"
          style={{ background: "radial-gradient(circle, #A67C00 0%, transparent 70%)" }}
        />
      </div>

      {/* ── Top bar ── */}
      <div className="relative z-10 flex items-center gap-3 px-4 pt-4 pb-2">
        <button
          onClick={() => { playButtonClick(); navigate(-1); }}
          className={cn(
            "inline-flex h-10 w-10 items-center justify-center rounded-full transition",
            "border border-[rgba(166,124,0,0.4)] bg-[rgba(255,253,245,0.8)]",
            "shadow-[0_0_15px_rgba(166,124,0,0.3)] hover:scale-105 hover:bg-[rgba(240,192,64,0.2)]",
          )}
          aria-label="Go back"
        >
          <ArrowLeft className="h-5 w-5 text-[#A67C00]" />
        </button>
      </div>

      {/* ── Page title ── */}
      <div className="relative z-10 px-4 pb-4 pt-2 text-center">
        <h1 className="font-heading text-3xl font-bold uppercase tracking-wide text-[#1A1200] md:text-4xl">
          Cricket Match Scheduler
        </h1>
        <p className="mt-1 text-sm text-[#5C4A10]">
          Select your team · Spin to reveal matches
        </p>
      </div>

      {/* ── Group tabs ── */}
      <div className="relative z-10 flex justify-center gap-2 px-4 pb-5">
        {GROUPS.map(group => (
          <button
            key={group.id}
            onClick={() => handleGroupTab(group.id)}
            className={cn(
              "rounded-xl border px-5 py-2 text-sm font-bold uppercase tracking-[0.12em] transition-all duration-200",
              activeGroup === group.id
                ? [
                    "border-[rgba(166,124,0,0.6)]",
                    "bg-[linear-gradient(135deg,rgba(166,124,0,0.96),rgba(200,150,12,0.94))]",
                    "text-white shadow-[0_6px_20px_rgba(166,124,0,0.4),inset_0_1px_0_rgba(255,255,255,0.25)]",
                    "scale-105",
                  ]
                : [
                    "border-[rgba(166,124,0,0.3)] bg-[rgba(255,253,245,0.7)] text-[#5C4A10]",
                    "hover:bg-[rgba(240,192,64,0.2)] hover:border-[rgba(166,124,0,0.5)]",
                  ],
            )}
          >
            {group.label}
          </button>
        ))}
      </div>

      {/* ── Active group card ── */}
      <div className="relative z-10 px-4 pb-12">
        <div className="mx-auto max-w-6xl">
          {GROUPS.filter(g => g.id === activeGroup).map(group => (
            <GroupCard
              key={group.id}
              group={group}
              globalMatchOffset={GROUP_MATCH_OFFSETS[group.id]}
            />
          ))}
        </div>
      </div>

      {/* ── All groups overview (collapsed summary) ── */}
      <div className="relative z-10 px-4 pb-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-3 flex items-center gap-2">
            <div className="h-px flex-1 bg-[rgba(166,124,0,0.2)]" />
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#5C4A10]">
              All Groups
            </span>
            <div className="h-px flex-1 bg-[rgba(166,124,0,0.2)]" />
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {GROUPS.map(group => (
              <button
                key={group.id}
                onClick={() => handleGroupTab(group.id)}
                className={cn(
                  "rounded-xl border p-3 text-left transition-all duration-200",
                  "border-[rgba(166,124,0,0.3)]",
                  activeGroup === group.id
                    ? "bg-[rgba(240,192,64,0.25)] border-[rgba(166,124,0,0.55)]"
                    : "bg-[rgba(255,253,245,0.6)] hover:bg-[rgba(240,192,64,0.15)]",
                )}
              >
                <p className="font-heading text-sm font-bold text-[#1A1200]">{group.label}</p>
                <p className="mt-0.5 text-xs text-[#5C4A10]">
                  {group.teams.length} teams
                </p>
                <div className="mt-2 space-y-0.5">
                  {group.teams.map(t => (
                    <p key={t.id} className="truncate text-xs text-[#5C4A10]/80">
                      · {t.name}
                    </p>
                  ))}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TournamentPage;
