import { useEffect, useRef, useState, type CSSProperties } from "react";
import { cn } from "@/lib/utils";
import type { Team } from "@/types/tournament";
import { startSpinSound } from "@/utils/audioEngine";
import type { SpinHandle } from "@/utils/audioEngine";

// ── Constants ────────────────────────────────────────────────────────────────
const CELL_H = 72;
const LANE_LEN = 160; // virtual lane length (repeating)

interface Props {
  teams: Team[];           // all 5 teams in the group
  isSpinning: boolean;
  targetTeam: Team | null; // team to land on when stopping
  onSpinComplete: (team: Team) => void;
}

const SpinnerWheel = ({ teams, isSpinning, targetTeam, onSpinComplete }: Props) => {
  const [step, setStep] = useState(0);
  const [transitionMs, setTransitionMs] = useState(90);
  const spinHandleRef = useRef<SpinHandle | null>(null);
  const intervalRef = useRef<number | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const prevSpinning = useRef(false);

  // Build a long repeating lane of team names
  const lane = Array.from({ length: LANE_LEN }, (_, i) => teams[i % teams.length]);

  useEffect(() => {
    if (isSpinning && !prevSpinning.current) {
      // Start spinning
      prevSpinning.current = true;
      setTransitionMs(90);

      // Reset step if near end of lane
      setStep(prev => {
        if (prev > LANE_LEN - 30) return (prev % teams.length) + teams.length * 4;
        return prev;
      });

      spinHandleRef.current = startSpinSound();

      intervalRef.current = window.setInterval(() => {
        setStep(prev => prev + 1);
      }, 80);
    }

    if (!isSpinning && prevSpinning.current) {
      // Stop spinning — snap to target
      prevSpinning.current = false;

      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      spinHandleRef.current?.stop();
      spinHandleRef.current = null;

      if (targetTeam) {
        const targetIdx = teams.findIndex(t => t.id === targetTeam.id);
        setStep(prev => {
          const nowMod = prev % teams.length;
          const delta = (targetIdx - nowMod + teams.length) % teams.length;
          return prev + delta + teams.length * 2;
        });
        setTransitionMs(700);

        timeoutRef.current = window.setTimeout(() => {
          onSpinComplete(targetTeam);
          setTransitionMs(120);
        }, 720);
      }
    }

    return () => {};
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSpinning]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (intervalRef.current !== null) window.clearInterval(intervalRef.current);
      if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
      spinHandleRef.current?.stop();
    };
  }, []);

  return (
    <div
      className={cn(
        "relative h-[72px] overflow-hidden rounded-xl border",
        "border-[rgba(166,124,0,0.35)]",
        "bg-[linear-gradient(120deg,rgba(240,232,208,0.96)_0%,rgba(240,192,64,0.62)_48%,rgba(166,124,0,0.42)_100%)]",
        "shadow-[inset_0_2px_5px_rgba(255,255,255,0.34),inset_0_-12px_22px_rgba(28,22,0,0.2)]",
      )}
    >
      {/* Top fade */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-5 bg-gradient-to-b from-[#FFFDF5] to-transparent" />
      {/* Bottom fade */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-5 bg-gradient-to-t from-[#FFFDF5] to-transparent" />
      {/* Ring */}
      <div className="pointer-events-none absolute inset-0 z-10 rounded-xl ring-1 ring-[rgba(166,124,0,0.2)]" />

      {/* Scrolling lane */}
      <div
        className="will-change-transform"
        style={
          {
            transform: `translateY(-${step * CELL_H}px)`,
            transition: `transform ${transitionMs}ms linear`,
          } as CSSProperties
        }
      >
        {lane.map((team, idx) => (
          <div
            key={`${team.id}-${idx}`}
            className="flex h-[72px] items-center justify-center text-xl font-black tracking-[0.16em] text-[#A67C00] drop-shadow-[0_2px_4px_rgba(28,22,0,0.3)] sm:text-2xl"
          >
            {team.name}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SpinnerWheel;
