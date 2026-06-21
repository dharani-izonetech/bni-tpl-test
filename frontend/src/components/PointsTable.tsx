import { useState } from "react";
import { TEAM_SQUADS } from "@/data/teamSquads";
import { TEAM_LOGOS } from "@/lib/logos";

type StandingRow = {
  pos: number;
  team: string;
  short: string;
  p: number;
  w: number;
  l: number;
  nrr: string;
  pts: number;
};

const standings: StandingRow[] = TEAM_SQUADS.map((team, index) => ({
  pos: index + 1,
  team: team.name,
  short: team.short,
  p: 0,
  w: 0,
  l: 0,
  nrr: "0.000",
  pts: 0,
}));

const initialsFromName = (value: string) =>
  value
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .slice(0, 3)
    .toUpperCase();

const TeamLogoAvatar = ({ teamCode, teamName }: { teamCode: string; teamName: string }) => {
  const [logoError, setLogoError] = useState(false);
  const logoSrc = TEAM_LOGOS[teamCode];

  if (!logoSrc || logoError) {
    return (
      <div className="flex h-7 w-7 items-center justify-center rounded-full border border-primary/45 bg-primary/10 font-heading text-[10px] font-bold text-foreground">
        {initialsFromName(teamName)}
      </div>
    );
  }

  return (
    <img
      src={logoSrc}
      alt={`${teamName} logo`}
      className="h-7 w-7 rounded-full object-contain"
      loading="lazy"
      onError={() => setLogoError(true)}
    />
  );
};

const PointsTable = () => {
  return (
    <section id="points-table" className="px-4 pt-6 pb-12 md:pb-16">
      <div className="container mx-auto">
        <h2 className="mb-8 text-center font-heading text-3xl font-bold uppercase text-foreground md:text-4xl">Points Table</h2>

        <div className="gold-panel overflow-x-auto">
          <table className="w-full min-w-[620px] text-xs sm:text-sm">
            <thead>
              <tr className="bg-[linear-gradient(90deg,rgba(var(--surface-dim-rgb),0.98),rgba(var(--primary-light-rgb),0.88),rgba(var(--primary-rgb),0.62))] text-foreground">
                <th className="px-2 py-3 text-left font-heading sm:px-4">#</th>
                <th className="px-2 py-3 text-left font-heading sm:px-4">Team</th>
                <th className="px-2 py-3 text-center font-heading sm:px-4">P</th>
                <th className="px-2 py-3 text-center font-heading sm:px-4">W</th>
                <th className="px-2 py-3 text-center font-heading sm:px-4">L</th>
                <th className="px-2 py-3 text-center font-heading sm:px-4">NRR</th>
                <th className="px-2 py-3 text-center font-heading sm:px-4">Pts</th>
              </tr>
            </thead>
            <tbody>
              {standings.map((row, index) => (
                <tr
                  key={row.short}
                  className={`animate-fade-up border-t border-border transition-colors hover:bg-muted/50 ${row.pos <= 4 ? "bg-secondary/10" : ""}`}
                  style={{ animationDelay: `${index * 60}ms` }}
                >
                  <td className="px-2 py-3 font-bold text-muted-foreground sm:px-4">{row.pos}</td>
                  <td className="px-2 py-3 sm:px-4">
                    <div className="flex items-center gap-2">
                      <TeamLogoAvatar teamCode={row.short} teamName={row.team} />
                      <span className="font-heading font-semibold text-foreground sm:hidden">{row.short}</span>
                      <span className="hidden font-heading font-semibold text-foreground sm:inline">{row.team}</span>
                    </div>
                  </td>
                  <td className="px-2 py-3 text-center text-muted-foreground sm:px-4">{row.p}</td>
                  <td className="px-2 py-3 text-center font-semibold text-secondary sm:px-4">{row.w}</td>
                  <td className="px-2 py-3 text-center font-semibold text-ipl-red sm:px-4">{row.l}</td>
                  <td className="px-2 py-3 text-center text-muted-foreground sm:px-4">{row.nrr}</td>
                  <td className="px-2 py-3 text-center font-heading font-bold text-primary sm:px-4">{row.pts}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-center text-xs text-muted-foreground">Top 4 teams (highlighted) qualify for the playoffs</p>
      </div>
    </section>
  );
};

export default PointsTable;
