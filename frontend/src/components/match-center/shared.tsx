import type { BallEventType } from "@/types/match-center";

export const BALL_COLORS: Record<BallEventType, { bg: string; text: string; label: string }> = {
  "0": { bg: "bg-[#E2E8F0]", text: "text-ink", label: "0" },
  "1": { bg: "bg-[#7C8EA3]", text: "text-white", label: "1" },
  "2": { bg: "bg-[#3F8F6E]", text: "text-white", label: "2" },
  "3": { bg: "bg-[#2F8F5B]", text: "text-white", label: "3" },
  "4": { bg: "bg-[#D9A441]", text: "text-ink", label: "4" },
  "6": { bg: "bg-[#E94D47]", text: "text-white", label: "6" },
  W: { bg: "bg-ink", text: "text-white", label: "W" },
  WD: { bg: "bg-[#A78BFA]", text: "text-ink", label: "WD" },
  NB: { bg: "bg-[#F472B6]", text: "text-ink", label: "NB" },
};

export function TeamBadge({
  short,
  color,
  size = 40,
}: {
  short: string;
  color: string;
  size?: number;
}) {
  return (
    <div
      className="flex items-center justify-center font-extrabold text-white border-2 border-white rounded-full shrink-0 shadow-soft"
      style={{
        background: `radial-gradient(circle at 30% 30%, ${color}, ${color}d0 70%, ${color}a0)`,
        width: size,
        height: size,
        fontSize: size * 0.32,
        letterSpacing: "-0.02em",
      }}
    >
      {short}
    </div>
  );
}

export function CaptainTag({ name, size = "sm" }: { name?: string; size?: "sm" | "xs" }) {
  if (!name) return null;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-accent-red-soft text-accent-red font-extrabold uppercase tracking-wider ring-1 ring-accent-red/30 ${
        size === "xs" ? "px-1.5 py-0.5 text-[9px]" : "px-2 py-0.5 text-[10px]"
      }`}
      title={`Captain: ${name}`}
    >
      <span className="grid w-3 h-3 text-[8px] place-items-center rounded-full bg-accent-red text-white">
        C
      </span>
      {name}
    </span>
  );
}

/** Returns true if a player's name matches the team captain (loose match). */
export function isCaptain(playerName: string, captain?: string): boolean {
  if (!captain) return false;
  const a = playerName.toLowerCase();
  const b = captain.toLowerCase();
  return a.includes(b) || b.includes(a) || a.split(" ").some((p) => b.includes(p) && p.length > 2);
}
