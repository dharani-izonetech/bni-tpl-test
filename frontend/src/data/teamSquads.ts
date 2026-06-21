type SquadMember = {
  name: string;
  role: string;
  info: string;
  img: string;
  membershipYears?: number;
};

// 5 groups × 4 teams = 20 teams → C(4,2) = 6 matches per group
// One spin reveals all 6 matches, zero duplicates
export const TEAM_DEFS = [
  // Group A (4 teams)
  { name: "BNI Azpire",      short: "AZP" },
  { name: "BNI Benchmark",   short: "BMK" },
  { name: "BNI Champions",   short: "CHP" },
  { name: "BNI Dynamic",     short: "DYN" },
  // Group B (4 teams)
  { name: "BNI Emperor",     short: "EMP" },
  { name: "BNI Fortune",     short: "FOR" },
  { name: "BNI Gladiators",  short: "GLD" },
  { name: "BNI Harmony",     short: "HMY" },
  // Group C (4 teams)
  { name: "BNI Icons",       short: "ICN" },
  { name: "BNI Jaaguar",     short: "JAG" },
  { name: "BNI Kings",       short: "KNG" },
  { name: "BNI Legends",     short: "LGD" },
  // Group D (4 teams)
  { name: "BNI Millionaire", short: "MLN" },
  { name: "BNI Nest",        short: "NST" },
  { name: "BNI Oscar",       short: "OSC" },
  { name: "BNI Prince",      short: "PRC" },
  // Group E (4 teams)
  { name: "BNI Royals",      short: "ROY" },
  { name: "BNI Spark",       short: "SPK" },
  // { name: "BNI Tycoon",      short: "TYC" },
  { name: "BNI Victory",     short: "VTY" },
  { name: "BNI Warriors",    short: "WAR" },
] as const;

export const ALL_TEAM_DEFS = [...TEAM_DEFS] as const;

// Captain names by team short code
const TEAM_CAPTAINS: Record<string, string> = {
  AZP: "Vishwa DC",
  BMK: "Sathishwaran B",
  CHP: "Infant",
  DYN: "Shyam",
  EMP: "Vigneshwaran Y",
  FOR: "Mohan",
  GLD: "Anand",
  HMY: "Elayaraja R",
  ICN: "Prasath",
  JAG: "Thiyagarajan",
  KNG: "Prasanth",
  LGD: "Chandrasekar",
  MLN: "Vijeya Balaji",
  NST: "Anand Pillai",
  OSC: "Lingaselvan A",
  PRC: "Sivaprakash G",
  ROY: "Mohamed Mustaffa Nihal A",
  SPK: "Harrison",
  VTY: "Balamurugan S",
  WAR: "Veera",
};

// Empty squad — all players come from the registration DB
export const TEAM_SQUADS = TEAM_DEFS.map(team => ({
  name:    team.name,
  short:   team.short,
  captain: TEAM_CAPTAINS[team.short] ?? "TBD",
  members: [] as SquadMember[],
}));
