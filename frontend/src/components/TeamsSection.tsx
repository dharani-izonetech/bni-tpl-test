// import { useEffect, useMemo, useState } from "react";
// import { TEAM_SQUADS } from "@/data/teamSquads";
// import { TEAM_LOGOS } from "@/lib/logos";
// import {
//   loadRegisteredPlayers,
//   loadRegisteredPlayersAsync,
//   subscribeToRegisteredPlayers,
//   type RegisteredPlayer,
// } from "@/lib/registeredPlayersStorage";

// type TeamMember = {
//   name: string;
//   role: string;
//   info: string;
//   img: string;
//   membershipYears?: number;
// };

// type Team = {
//   name: string;
//   short: string;
//   captain: string;
//   members: TeamMember[];
// };

// const TEAM_ORDER = [
//   "PRC",
//   "JAG",
//   "DYN",
//   "VTY",
//   "BMK",
//   "ICN",
//   "WAR",
//   "OSC",
//   "EMP",
//   "FOR",
//   "MLN",
//   "NST",
//   "LGD",
//   "KNG",
//   "ROY",
//   "SPK",
//   "GLD",
//   "HMY",
//   "AZP",
//   "CHP",
// ];

// const baseTeams = TEAM_SQUADS as Team[];

// const initialsFromName = (value: string) => {
//   const normalized = value.trim();
//   const trailingNumber = normalized.match(/(\d+)\s*$/);

//   if (trailingNumber) {
//     const numberPart = trailingNumber[1];
//     const textWithoutNumber = normalized.slice(0, trailingNumber.index).trim();
//     const prefix = textWithoutNumber
//       .split(/\s+/)
//       .filter(Boolean)
//       .map((word) => word[0])
//       .join("")
//       .slice(0, 2)
//       .toUpperCase();
//     return `${prefix}${numberPart}`.slice(0, 5);
//   }

//   return normalized
//     .split(/\s+/)
//     .filter(Boolean)
//     .map((word) => word[0])
//     .join("")
//     .slice(0, 3)
//     .toUpperCase();
// };

// const toRegisteredMember = (player: RegisteredPlayer): TeamMember => {
//   const infoParts = [player.business, player.category].filter((value) =>
//     value.trim(),
//   );
//   return {
//     name: player.name,
//     role: player.role || "Player",
//     info: infoParts.length > 0 ? infoParts.join(" | ") : "Registered Player",
//     img: player.photoDataUrl,
//     membershipYears: player.membershipYears,
//   };
// };

// const memberKey = (member: TeamMember) =>
//   `${member.name.trim().toLowerCase()}|${member.role.trim().toLowerCase()}`;

// const getDisplayPlayerName = (member: TeamMember, slotNumber: number) => {
//   const placeholderMatch = member.name.match(/^(.*\bPlayer)\s+\d+$/i);
//   if (member.info === "Squad" && placeholderMatch) {
//     return `${placeholderMatch[1]} ${slotNumber}`;
//   }
//   return member.name;
// };

// const mergeRegisteredPlayersIntoTeams = (
//   teams: Team[],
//   players: RegisteredPlayer[],
// ) => {
//   if (players.length === 0) return teams;

//   const membersByTeam = new Map<string, RegisteredPlayer[]>();
//   players.forEach((player) => {
//     const key =
//       player.teamShort || player.teamName.trim().toUpperCase().slice(0, 3);
//     const existing = membersByTeam.get(key) ?? [];
//     existing.push(player);
//     membersByTeam.set(key, existing);
//   });

//   return teams.map((team) => {
//     const teamPlayers = membersByTeam.get(team.short);
//     if (!teamPlayers?.length) return team;

//     const seen = new Set<string>();
//     const registeredMembers = [...teamPlayers]
//       .sort(
//         (a, b) =>
//           new Date(b.registeredAt).getTime() -
//           new Date(a.registeredAt).getTime(),
//       )
//       .map(toRegisteredMember)
//       .filter((member) => {
//         const key = memberKey(member);
//         if (seen.has(key)) return false;
//         seen.add(key);
//         return true;
//       });

//     return { ...team, members: registeredMembers };
//   });
// };

// const TeamsSection = () => {
//   const [selectedTeamShort, setSelectedTeamShort] = useState<string | null>(
//     null,
//   );
//   const [registeredPlayers, setRegisteredPlayers] = useState<
//     RegisteredPlayer[]
//   >(() => loadRegisteredPlayers());
//   const [logoErrors, setLogoErrors] = useState<Record<string, boolean>>({});

//   const teams = useMemo(() => {
//     const mergedTeams = mergeRegisteredPlayersIntoTeams(
//       baseTeams,
//       registeredPlayers,
//     );

//     // return [...mergedTeams].sort(
//     //   (a, b) => TEAM_ORDER.indexOf(a.short) - TEAM_ORDER.indexOf(b.short),
//     // );
//     return [...mergedTeams].sort((a, b) =>
//       a.name.localeCompare(b.name)
//     );
//   }, [registeredPlayers]);

//   const selectedTeam = useMemo(
//     () =>
//       selectedTeamShort
//         ? (teams.find((team) => team.short === selectedTeamShort) ?? null)
//         : null,
//     [selectedTeamShort, teams],
//   );

//   useEffect(() => {
//     void loadRegisteredPlayersAsync().then((players) => {
//       if (players.length > 0) setRegisteredPlayers(players);
//     });

//     const refreshPlayers = () => setRegisteredPlayers(loadRegisteredPlayers());
//     const unsubscribe = subscribeToRegisteredPlayers(refreshPlayers);
//     window.addEventListener("focus", refreshPlayers);
//     window.addEventListener("pageshow", refreshPlayers);
//     return () => {
//       unsubscribe();
//       window.removeEventListener("focus", refreshPlayers);
//       window.removeEventListener("pageshow", refreshPlayers);
//     };
//   }, []);

//   useEffect(() => {
//     if (!selectedTeam) {
//       document.body.style.overflow = "";
//       return;
//     }

//     const handleEscape = (event: KeyboardEvent) => {
//       if (event.key === "Escape") setSelectedTeamShort(null);
//     };

//     document.body.style.overflow = "hidden";
//     window.addEventListener("keydown", handleEscape);
//     return () => {
//       document.body.style.overflow = "";
//       window.removeEventListener("keydown", handleEscape);
//     };
//   }, [selectedTeam]);

//   return (
//     <>
//       <section
//         id="teams"
//         className="relative px-4 py-16 overflow-hidden md:py-24"
//         style={{
//           background: "#F1EBDF",
//         }}
//       >
//         {/* Stadium glow */}
//         <div className="absolute inset-0 pointer-events-none">
//           <div className="absolute left-0 top-0 h-72 w-72 rounded-full bg-[#B31217]/15 blur-[120px]" />
//           <div className="absolute right-0 bottom-0 h-72 w-72 rounded-full bg-[#E63946]/12 blur-[140px]" />
//         </div>

//         <div className="container relative mx-auto">
//           {/* Header */}
//           <div className="mb-12 text-center md:mb-16">
//             <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#B31217]/40 bg-[#B31217]/10 px-4 py-1.5 backdrop-blur">
//               <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#E63946]" />
//               <span className="text-[10px] font-bold uppercase tracking-[0.32em] text-[#E63946]">
//                 Official Franchise Teams
//               </span>
//             </div>
//             <h2 className="text-4xl font-black tracking-tight text-[#332E28] uppercase font-heading md:text-6xl">
//               Meet the{" "}
//               <span className="bg-gradient-to-r from-[#E63946] via-[#B31217] to-[#7A0C12] bg-clip-text text-transparent">
//                 Squads
//               </span>
//             </h2>
//             <p className="max-w-xl mx-auto mt-3 text-sm text-[#332E28]/50 md:text-base">
//               Eight franchises. One trophy. Step inside the dressing rooms of
//               the BNI Premier League.
//             </p>
//             <div className="mx-auto mt-6 h-px w-24 bg-gradient-to-r from-transparent via-[#B31217] to-transparent" />
//           </div>

//           <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 md:grid-cols-4 lg:grid-cols-5">
//             {teams.map((team, index) => (
//               <button
//                 key={team.short}
//                 type="button"
//                 onClick={() => setSelectedTeamShort(team.short)}
//                 className="group relative overflow-hidden rounded-2xl p-[1.5px] text-center transition-all duration-500 hover:-translate-y-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E63946] animate-fade-up"
//                 style={{ animationDelay: `${index * 70}ms` }}
//               >
//                 {/* Animated border */}
//                 <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#B31217] via-[#1a1413] to-[#E63946] opacity-60 transition-opacity duration-500 group-hover:opacity-100" />
//                 <div className="absolute inset-0 rounded-2xl bg-[#E63946]/0 blur-2xl transition-all duration-500 group-hover:bg-[#E63946]/40" />

//                 {/* Body */}
//                 <div className="relative h-full rounded-2xl bg-gradient-to-br from-[#F1EBDF] via-[#ebe7e0] to-[#f3e6cc] p-5 backdrop-blur-xl sm:p-6">
//                   {/* Spotlight */}
//                   <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[#B31217]/25 blur-3xl transition-all duration-500 group-hover:scale-150 group-hover:bg-[#f5f4f2]" />
//                   <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-2xl">
//                     <div className="absolute h-32 transition-all duration-700 opacity-0 -inset-x-12 -top-12 rotate-12 bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:translate-x-16 group-hover:opacity-100" />
//                   </div>

//                   <div className="relative flex flex-col items-center">
//                     <h3 className="min-h-[2.5rem] font-heading text-sm font-bold uppercase leading-tight tracking-wide text-[#332E28] sm:text-base">
//                       {team.name}
//                     </h3>

//                     {/* Team badge */}
//                     <div className="relative flex items-center justify-center w-20 h-20 mt-3 shrink-0 sm:h-24 sm:w-24">
//                       <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#B31217] via-[#E63946] to-[#7A0C12] p-[2px] shadow-[0_0_30px_rgba(230,57,70,0.4)] transition-all duration-500 group-hover:shadow-[0_0_45px_rgba(230,57,70,0.7)] group-hover:rotate-3">
//                         <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-white to-white/90 font-heading text-base font-black text-[#1a1413] sm:text-lg">
//                           {TEAM_LOGOS[team.short] && !logoErrors[team.short] ? (
//                             <img
//                               src={TEAM_LOGOS[team.short]}
//                               alt={`${team.name} logo`}
//                               className="object-cover w-full h-full rounded-full"
//                               loading="lazy"
//                               onError={() =>
//                                 setLogoErrors((prev) => ({
//                                   ...prev,
//                                   [team.short]: true,
//                                 }))
//                               }
//                             />
//                           ) : (
//                             initialsFromName(team.name)
//                           )}
//                         </div>
//                       </div>
//                     </div>

//                     {/* Short tag */}
//                     <span className="mt-3 text-[14px] font-bold uppercase tracking-[0.3em] text-[#E63946]/80">
//                       {team.short}
//                     </span>
//                   </div>

//                   <div className="relative flex justify-center mt-4">
//                     <span className="inline-flex items-center gap-1.5 rounded-full border border-[#B31217]/50 bg-[#B31217]/15 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#332E28]/50 transition-all duration-300 group-hover:border-[#E63946] group-hover:bg-[#E63946]/25 group-hover:shadow-[0_0_15px_rgba(230,57,70,0.4)]">
//                       View Squad
//                       <span className="transition-transform group-hover:translate-x-0.5">
//                         →
//                       </span>
//                     </span>
//                   </div>
//                 </div>
//               </button>
//             ))}
//           </div>
//         </div>
//       </section>

//       {selectedTeam && (
//         <div
//           className="fixed inset-0 z-50 p-3 overflow-y-auto sm:p-8"
//           onClick={() => setSelectedTeamShort(null)}
//           role="dialog"
//           aria-modal="true"
//           aria-label={`${selectedTeam.name} squad`}
//           style={{
//             background:
//               "radial-gradient(circle at 50% 0%, rgba(179,18,23,0.25), transparent 50%), rgba(8,6,6,0.92)",
//             backdropFilter: "blur(12px)",
//           }}
//         >
//           <div
//             className="relative mx-auto max-w-5xl animate-fade-up overflow-hidden rounded-3xl p-[1.5px]"
//             onClick={(event) => event.stopPropagation()}
//           >
//             {/* Gradient border */}
//             <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-[#B31217] via-[#1a1413] to-[#E63946] opacity-80" />

//             <div
//               className="relative p-5 rounded-3xl sm:p-8"
//               style={{
//                 background:
//                   "radial-gradient(circle at 0% 0%, rgba(179,18,23,0.15), transparent 40%), radial-gradient(circle at 100% 100%, rgba(230,57,70,0.10), transparent 40%), linear-gradient(160deg, #14100f 0%, #0c0a0a 100%)",
//               }}
//             >
//               {/* Header bar */}
//               <div
//                 className="relative mb-7 flex flex-col items-start justify-between gap-4 overflow-hidden rounded-2xl border border-[#B31217]/40 p-5 sm:flex-row sm:items-center sm:p-6"
//                 style={{
//                   background:
//                     "linear-gradient(120deg, rgba(179,18,23,0.18) 0%, rgba(20,16,15,0.95) 50%, rgba(230,57,70,0.15) 100%)",
//                 }}
//               >
//                 <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#E63946]/15 blur-3xl" />
//                 <div className="relative flex items-center min-w-0 gap-4">
//                   {/* Team logo */}
//                   <div className="relative w-16 h-16 shrink-0 sm:h-20 sm:w-20">
//                     <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#B31217] via-[#E63946] to-[#7A0C12] p-[2.5px] shadow-[0_0_30px_rgba(230,57,70,0.5)]">
//                       <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-white font-heading text-sm font-black text-[#1a1413]">
//                         {TEAM_LOGOS[selectedTeam.short] &&
//                         !logoErrors[selectedTeam.short] ? (
//                           <img
//                             src={TEAM_LOGOS[selectedTeam.short]}
//                             alt={`${selectedTeam.name} logo`}
//                             className="object-cover w-full h-full rounded-full"
//                             loading="lazy"
//                             onError={() =>
//                               setLogoErrors((prev) => ({
//                                 ...prev,
//                                 [selectedTeam.short]: true,
//                               }))
//                             }
//                           />
//                         ) : (
//                           initialsFromName(selectedTeam.name)
//                         )}
//                       </div>
//                     </div>
//                   </div>
//                   <div className="min-w-0">
//                     <span className="text-[10px] font-bold uppercase tracking-[0.32em] text-[#E63946]">
//                       Franchise · {selectedTeam.short}
//                     </span>
//                     <h3 className="mt-1 text-2xl font-black text-white uppercase break-words font-heading sm:text-3xl">
//                       {selectedTeam.name}
//                     </h3>
//                     <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
//                       <span className="text-white/60">
//                         <span className="font-bold tracking-wider uppercase text-white/40">
//                           Captain:
//                         </span>{" "}
//                         <span className="font-semibold text-white">
//                           {selectedTeam.captain}
//                         </span>
//                       </span>
//                       <span className="hidden text-white/20 sm:inline">•</span>
//                       <span className="inline-flex items-center gap-1 rounded-full border border-[#B31217]/40 bg-[#B31217]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#E63946]">
//                         {selectedTeam.members.length} Players
//                       </span>
//                     </div>
//                   </div>
//                 </div>
//                 <button
//                   type="button"
//                   onClick={() => setSelectedTeamShort(null)}
//                   aria-label="Close squad details"
//                   className="relative self-start rounded-full border border-[#B31217]/50 bg-[#1a1413]/80 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white transition-all duration-300 hover:border-[#E63946] hover:bg-[#B31217]/30 hover:shadow-[0_0_18px_rgba(230,57,70,0.4)] sm:self-auto"
//                 >
//                   Close ✕
//                 </button>
//               </div>

//               {/* Squad grid */}
//               <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
//                 {selectedTeam.members.length === 0 ? (
//                   <div className="col-span-full flex flex-col items-center justify-center rounded-2xl border border-[#B31217]/20 bg-[#14100f]/60 py-16 text-center">
//                     <div className="mb-3 text-5xl opacity-40">🏏</div>
//                     <p className="text-lg font-bold tracking-wider text-white uppercase font-heading">
//                       No players registered yet
//                     </p>
//                     <p className="max-w-xs mt-2 text-sm text-white/50">
//                       Players who register for this team will appear here.
//                     </p>
//                   </div>
//                 ) : (
//                   selectedTeam.members.map((player, index) => (
//                     <div
//                       key={`${player.name}-${index}`}
//                       className="group relative overflow-hidden rounded-2xl p-[1px] animate-fade-up transition-all duration-300 hover:-translate-y-1"
//                       style={{ animationDelay: `${index * 35}ms` }}
//                     >
//                       <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#B31217]/40 via-[#1a1413] to-[#E63946]/30 opacity-50 transition-opacity duration-300 group-hover:opacity-100" />
//                       <div className="relative flex items-start gap-4 rounded-2xl bg-gradient-to-br from-[#15100f] to-[#0c0a0a] p-4 pr-16 sm:items-center">
//                         <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[#B31217]/15 blur-2xl transition-all duration-500 group-hover:bg-[#E63946]/30" />

//                         {/* Avatar */}
//                         <div className="relative h-16 w-16 shrink-0 sm:h-[68px] sm:w-[68px]">
//                           <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#B31217] via-[#E63946] to-[#7A0C12] p-[2px] shadow-[0_4px_18px_rgba(179,18,23,0.4)]">
//                             {player.img ? (
//                               <img
//                                 src={player.img}
//                                 alt={player.name}
//                                 className="object-cover w-full h-full rounded-full"
//                                 loading="lazy"
//                               />
//                             ) : (
//                               <div className="flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-[#1a1413] to-[#0c0a0a] font-heading text-sm font-black text-white">
//                                 {initialsFromName(
//                                   getDisplayPlayerName(player, index + 1),
//                                 )}
//                               </div>
//                             )}
//                           </div>
//                         </div>

//                         {/* Info */}
//                         <div className="flex-1 min-w-0">
//                           <p className="text-base font-bold text-white break-words font-heading">
//                             {getDisplayPlayerName(player, index + 1)}
//                           </p>
//                           <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-[#E63946]">
//                             {player.role}
//                           </p>
//                           <p className="mt-1.5 line-clamp-2 text-xs text-white/50">
//                             {player.info}
//                           </p>
//                         </div>

//                         {/* Membership badge */}
//                         {typeof player.membershipYears === "number" && (
//                           <div
//                             className="absolute flex flex-col items-center text-center right-3 top-3"
//                             aria-label={`${player.membershipYears} years of membership`}
//                           >
//                             <span className="relative flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#B31217] via-[#E63946] to-[#7A0C12] font-heading text-sm font-black leading-none text-white shadow-[0_0_14px_rgba(230,57,70,0.5)]">
//                               {player.membershipYears}
//                             </span>
//                             <span className="mt-1 text-[8px] font-bold uppercase leading-none tracking-[0.15em] text-white/60">
//                               years
//                             </span>
//                           </div>
//                         )}
//                       </div>
//                     </div>
//                   ))
//                 )}
//               </div>
//             </div>
//           </div>
//         </div>
//       )}
//     </>
//   );
// };

// export default TeamsSection;




























import { useEffect, useMemo, useState } from "react";
import { TEAM_SQUADS } from "@/data/teamSquads";
import { TEAM_LOGOS } from "@/lib/logos";
import {
  loadRegisteredPlayers,
  loadRegisteredPlayersAsync,
  subscribeToRegisteredPlayers,
  type RegisteredPlayer,
} from "@/lib/registeredPlayersStorage";

type TeamMember = {
  name: string;
  role: string;
  info: string;
  img: string;
  membershipYears?: number;
};

type Team = {
  name: string;
  short: string;
  captain: string;
  members: TeamMember[];
};

const TEAM_ORDER = [
  "PRC",
  "JAG",
  "DYN",
  "VTY",
  "BMK",
  "ICN",
  "WAR",
  "OSC",
  "EMP",
  "FOR",
  "MLN",
  "NST",
  "LGD",
  "KNG",
  "ROY",
  "SPK",
  "GLD",
  "HMY",
  "AZP",
  "CHP",
];

const baseTeams = TEAM_SQUADS as Team[];

const initialsFromName = (value: string) => {
  const normalized = value.trim();
  const trailingNumber = normalized.match(/(\d+)\s*$/);

  if (trailingNumber) {
    const numberPart = trailingNumber[1];
    const textWithoutNumber = normalized.slice(0, trailingNumber.index).trim();
    const prefix = textWithoutNumber
      .split(/\s+/)
      .filter(Boolean)
      .map((word) => word[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
    return `${prefix}${numberPart}`.slice(0, 5);
  }

  return normalized
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .slice(0, 3)
    .toUpperCase();
};

const toRegisteredMember = (player: RegisteredPlayer): TeamMember => {
  const infoParts = [player.business, player.category].filter((value) =>
    value.trim(),
  );
  return {
    name: player.name,
    role: player.role || "Player",
    info: infoParts.length > 0 ? infoParts.join(" | ") : "Registered Player",
    img: player.photoDataUrl,
    membershipYears: player.membershipYears,
  };
};

const memberKey = (member: TeamMember) =>
  `${member.name.trim().toLowerCase()}|${member.role.trim().toLowerCase()}`;

const getDisplayPlayerName = (member: TeamMember, slotNumber: number) => {
  const placeholderMatch = member.name.match(/^(.*\bPlayer)\s+\d+$/i);
  if (member.info === "Squad" && placeholderMatch) {
    return `${placeholderMatch[1]} ${slotNumber}`;
  }
  return member.name;
};

const mergeRegisteredPlayersIntoTeams = (
  teams: Team[],
  players: RegisteredPlayer[],
) => {
  if (players.length === 0) return teams;

  const membersByTeam = new Map<string, RegisteredPlayer[]>();
  players.forEach((player) => {
    const key =
      player.teamShort || player.teamName.trim().toUpperCase().slice(0, 3);
    const existing = membersByTeam.get(key) ?? [];
    existing.push(player);
    membersByTeam.set(key, existing);
  });

  return teams.map((team) => {
    const teamPlayers = membersByTeam.get(team.short);
    if (!teamPlayers?.length) return team;

    const seen = new Set<string>();
    const registeredMembers = [...teamPlayers]
      .sort(
        (a, b) =>
          new Date(b.registeredAt).getTime() -
          new Date(a.registeredAt).getTime(),
      )
      .map(toRegisteredMember)
      .filter((member) => {
        const key = memberKey(member);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

    return { ...team, members: registeredMembers };
  });
};

const TeamsSection = () => {
  const [selectedTeamShort, setSelectedTeamShort] = useState<string | null>(
    null,
  );
  const [registeredPlayers, setRegisteredPlayers] = useState<
    RegisteredPlayer[]
  >(() => loadRegisteredPlayers());
  const [logoErrors, setLogoErrors] = useState<Record<string, boolean>>({});

  const teams = useMemo(() => {
    const mergedTeams = mergeRegisteredPlayersIntoTeams(
      baseTeams,
      registeredPlayers,
    );

    // return [...mergedTeams].sort(
    //   (a, b) => TEAM_ORDER.indexOf(a.short) - TEAM_ORDER.indexOf(b.short),
    // );
    return [...mergedTeams].sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }, [registeredPlayers]);

  const selectedTeam = useMemo(
    () =>
      selectedTeamShort
        ? (teams.find((team) => team.short === selectedTeamShort) ?? null)
        : null,
    [selectedTeamShort, teams],
  );

  useEffect(() => {
    void loadRegisteredPlayersAsync().then((players) => {
      if (players.length > 0) setRegisteredPlayers(players);
    });

    const refreshPlayers = () => setRegisteredPlayers(loadRegisteredPlayers());
    const unsubscribe = subscribeToRegisteredPlayers(refreshPlayers);
    window.addEventListener("focus", refreshPlayers);
    window.addEventListener("pageshow", refreshPlayers);
    return () => {
      unsubscribe();
      window.removeEventListener("focus", refreshPlayers);
      window.removeEventListener("pageshow", refreshPlayers);
    };
  }, []);

  useEffect(() => {
    if (!selectedTeam) {
      document.body.style.overflow = "";
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelectedTeamShort(null);
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleEscape);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleEscape);
    };
  }, [selectedTeam]);

  return (
    <>
      <section
        id="teams"
        className="relative px-4 py-16 overflow-hidden md:py-24"
        style={{
          background: "#F1EBDF",
        }}
      >
        {/* Stadium glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute left-0 top-0 h-72 w-72 rounded-full bg-[#B31217]/15 blur-[120px]" />
          <div className="absolute right-0 bottom-0 h-72 w-72 rounded-full bg-[#E63946]/12 blur-[140px]" />
        </div>

        <div className="container relative mx-auto">
          {/* Header */}
          <div className="mb-12 text-center md:mb-16">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#B31217]/40 bg-[#B31217]/10 px-4 py-1.5 backdrop-blur">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#E63946]" />
              <span className="text-[10px] font-bold uppercase tracking-[0.32em] text-[#E63946]">
                Official Franchise Teams
              </span>
            </div>
            <h2 className="text-4xl font-black tracking-tight text-[#332E28] uppercase font-heading md:text-6xl">
              Meet the{" "}
              <span className="bg-gradient-to-r from-[#E63946] via-[#B31217] to-[#7A0C12] bg-clip-text text-transparent">
                Squads
              </span>
            </h2>
            <p className="max-w-xl mx-auto mt-3 text-sm text-[#332E28]/50 md:text-base">
              Eight franchises. One trophy. Step inside the dressing rooms of
              the BNI Premier League.
            </p>
            <div className="mx-auto mt-6 h-px w-24 bg-gradient-to-r from-transparent via-[#B31217] to-transparent" />
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 md:grid-cols-4 lg:grid-cols-5">
            {teams.map((team, index) => (
              <button
                key={team.short}
                type="button"
                onClick={() => setSelectedTeamShort(team.short)}
                className="group relative overflow-hidden rounded-2xl p-[1.5px] text-center transition-all duration-500 hover:-translate-y-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E63946] animate-fade-up"
                style={{ animationDelay: `${index * 70}ms` }}
              >
                {/* Animated border */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#B31217] via-[#1a1413] to-[#E63946] opacity-60 transition-opacity duration-500 group-hover:opacity-100" />
                <div className="absolute inset-0 rounded-2xl bg-[#E63946]/0 blur-2xl transition-all duration-500 group-hover:bg-[#E63946]/40" />

                {/* Body */}
                <div className="relative h-full rounded-2xl bg-gradient-to-br from-[#F1EBDF] via-[#ebe7e0] to-[#f3e6cc] p-5 backdrop-blur-xl sm:p-6">
                  {/* Spotlight */}
                  <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[#B31217]/25 blur-3xl transition-all duration-500 group-hover:scale-150 group-hover:bg-[#f5f4f2]" />
                  <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-2xl">
                    <div className="absolute h-32 transition-all duration-700 opacity-0 -inset-x-12 -top-12 rotate-12 bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:translate-x-16 group-hover:opacity-100" />
                  </div>

                  <div className="relative flex flex-col items-center">
                    <h3 className="min-h-[2.5rem] font-heading text-sm font-bold uppercase leading-tight tracking-wide text-[#332E28] sm:text-base">
                      {team.name}
                    </h3>

                    {/* Team badge */}
                    <div className="relative flex items-center justify-center w-20 h-20 mt-3 shrink-0 sm:h-24 sm:w-24">
                      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#B31217] via-[#E63946] to-[#7A0C12] p-[2px] shadow-[0_0_30px_rgba(230,57,70,0.4)] transition-all duration-500 group-hover:shadow-[0_0_45px_rgba(230,57,70,0.7)] group-hover:rotate-3">
                        <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-white to-white/90 font-heading text-base font-black text-[#1a1413] sm:text-lg">
                          {TEAM_LOGOS[team.short] && !logoErrors[team.short] ? (
                            <img
                              src={TEAM_LOGOS[team.short]}
                              alt={`${team.name} logo`}
                              className="object-cover w-full h-full rounded-full"
                              loading="lazy"
                              onError={() =>
                                setLogoErrors((prev) => ({
                                  ...prev,
                                  [team.short]: true,
                                }))
                              }
                            />
                          ) : (
                            initialsFromName(team.name)
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Short tag */}
                    <span className="mt-3 text-[14px] font-bold uppercase tracking-[0.3em] text-[#E63946]/80">
                      {team.short}
                    </span>
                  </div>

                  <div className="relative flex justify-center mt-4">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-[#B31217]/50 bg-[#B31217]/15 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#332E28]/50 transition-all duration-300 group-hover:border-[#E63946] group-hover:bg-[#E63946]/25 group-hover:shadow-[0_0_15px_rgba(230,57,70,0.4)]">
                      View Squad
                      <span className="transition-transform group-hover:translate-x-0.5">
                        →
                      </span>
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {selectedTeam && (
        <div
          className="fixed inset-0 z-50 p-3 overflow-y-auto sm:p-8"
          onClick={() => setSelectedTeamShort(null)}
          role="dialog"
          aria-modal="true"
          aria-label={`${selectedTeam.name} squad`}
          style={{
            background:
              "radial-gradient(circle at 50% 0%, rgba(179,18,23,0.25), transparent 50%), rgba(8,6,6,0.92)",
            backdropFilter: "blur(12px)",
          }}
        >
          <div
            className="relative mx-auto max-w-5xl animate-fade-up overflow-hidden rounded-3xl p-[1.5px]"
            onClick={(event) => event.stopPropagation()}
          >
            {/* Gradient border */}
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-[#B31217] via-[#1a1413] to-[#E63946] opacity-80" />

            <div
              className="relative p-5 rounded-3xl sm:p-8"
              style={{
                background:
                  "radial-gradient(circle at 0% 0%, rgba(179,18,23,0.15), transparent 40%), radial-gradient(circle at 100% 100%, rgba(230,57,70,0.10), transparent 40%), linear-gradient(160deg, #14100f 0%, #0c0a0a 100%)",
              }}
            >
              {/* Header bar */}
              <div
                className="relative mb-7 flex flex-col items-start justify-between gap-4 overflow-hidden rounded-2xl border border-[#B31217]/40 p-5 sm:flex-row sm:items-center sm:p-6"
                style={{
                  background:
                    "linear-gradient(120deg, rgba(179,18,23,0.18) 0%, rgba(20,16,15,0.95) 50%, rgba(230,57,70,0.15) 100%)",
                }}
              >
                <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#E63946]/15 blur-3xl" />
                <div className="relative flex items-center min-w-0 gap-4">
                  {/* Team logo */}
                  <div className="relative w-16 h-16 shrink-0 sm:h-20 sm:w-20">
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#B31217] via-[#E63946] to-[#7A0C12] p-[2.5px] shadow-[0_0_30px_rgba(230,57,70,0.5)]">
                      <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-white font-heading text-sm font-black text-[#1a1413]">
                        {TEAM_LOGOS[selectedTeam.short] &&
                        !logoErrors[selectedTeam.short] ? (
                          <img
                            src={TEAM_LOGOS[selectedTeam.short]}
                            alt={`${selectedTeam.name} logo`}
                            className="object-cover w-full h-full rounded-full"
                            loading="lazy"
                            onError={() =>
                              setLogoErrors((prev) => ({
                                ...prev,
                                [selectedTeam.short]: true,
                              }))
                            }
                          />
                        ) : (
                          initialsFromName(selectedTeam.name)
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold uppercase tracking-[0.32em] text-[#E63946]">
                      Franchise · {selectedTeam.short}
                    </span>
                    <h3 className="mt-1 text-2xl font-black text-white uppercase break-words font-heading sm:text-3xl">
                      {selectedTeam.name}
                    </h3>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                      <span className="text-white/60">
                        <span className="font-bold tracking-wider uppercase text-white/40">
                          Captain:
                        </span>{" "}
                        <span className="font-semibold text-white">
                          {selectedTeam.captain}
                        </span>
                      </span>
                      <span className="hidden text-white/20 sm:inline">•</span>
                      <span className="inline-flex items-center gap-1 rounded-full border border-[#B31217]/40 bg-[#B31217]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#E63946]">
                        {selectedTeam.members.length} Players
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedTeamShort(null)}
                  aria-label="Close squad details"
                  className="relative self-start rounded-full border border-[#B31217]/50 bg-[#1a1413]/80 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white transition-all duration-300 hover:border-[#E63946] hover:bg-[#B31217]/30 hover:shadow-[0_0_18px_rgba(230,57,70,0.4)] sm:self-auto"
                >
                  Close ✕
                </button>
              </div>

              {/* Squad grid */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {selectedTeam.members.length === 0 ? (
                  <div className="col-span-full flex flex-col items-center justify-center rounded-2xl border border-[#B31217]/20 bg-[#14100f]/60 py-16 text-center">
                    <div className="mb-3 text-5xl opacity-40">🏏</div>
                    <p className="text-lg font-bold tracking-wider text-white uppercase font-heading">
                      No players registered yet
                    </p>
                    <p className="max-w-xs mt-2 text-sm text-white/50">
                      Players who register for this team will appear here.
                    </p>
                  </div>
                ) : (
                  selectedTeam.members.map((player, index) => (
                    <div
                      key={`${player.name}-${index}`}
                      className="group relative overflow-hidden rounded-2xl p-[1px] animate-fade-up transition-all duration-300 hover:-translate-y-1"
                      style={{ animationDelay: `${index * 35}ms` }}
                    >
                      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#B31217]/40 via-[#1a1413] to-[#E63946]/30 opacity-50 transition-opacity duration-300 group-hover:opacity-100" />
                      <div className="relative flex h-full items-start gap-4 rounded-2xl bg-gradient-to-br from-[#15100f] to-[#0c0a0a] p-4 pr-16">
                        <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[#B31217]/15 blur-2xl transition-all duration-500 group-hover:bg-[#E63946]/30" />

                        {/* Avatar */}
                        <div className="relative h-16 w-16 shrink-0 sm:h-[68px] sm:w-[68px]">
                          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#B31217] via-[#E63946] to-[#7A0C12] p-[2px] shadow-[0_4px_18px_rgba(179,18,23,0.4)]">
                            {player.img ? (
                              <img
                                src={player.img}
                                alt={player.name}
                                className="object-cover w-full h-full rounded-full"
                                loading="lazy"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-[#1a1413] to-[#0c0a0a] font-heading text-sm font-black text-white">
                                {initialsFromName(
                                  getDisplayPlayerName(player, index + 1),
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-base font-bold text-white break-words font-heading">
                            {getDisplayPlayerName(player, index + 1)}
                          </p>
                          <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-[#E63946]">
                            {player.role}
                          </p>
                          <p className="mt-1.5 line-clamp-2 text-xs text-white/50">
                            {player.info}
                          </p>
                        </div>

                        {/* Membership badge */}
                        {typeof player.membershipYears === "number" && (
                          <div
                            className="absolute flex flex-col items-center text-center right-3 top-3"
                            aria-label={`${player.membershipYears} years of membership`}
                          >
                            <span className="relative flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#B31217] via-[#E63946] to-[#7A0C12] font-heading text-sm font-black leading-none text-white shadow-[0_0_14px_rgba(230,57,70,0.5)]">
                              {player.membershipYears}
                            </span>
                            <span className="mt-1 text-[8px] font-bold uppercase leading-none tracking-[0.15em] text-white/60">
                              years
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TeamsSection;