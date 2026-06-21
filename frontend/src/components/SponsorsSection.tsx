// import { useEffect, useMemo, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import {
//   ChevronLeft,
//   ChevronRight,
//   Crown,
//   Star,
//   Handshake,
//   Sparkles,
//   MapPin,
//   Trophy,
//   Pause,
//   Play,
// } from "lucide-react";
// import SponsorLogo from "./SponsorLogo";
// import {
//   sponsors,
//   getSponsorSlug,
//   type Sponsor,
//   type SponsorCategory,
// } from "@/data/sponsors";

// const CATEGORIES: {
//   id: SponsorCategory;
//   label: string;
//   blurb: string;
//   icon: React.ElementType;
//   visible: number;
// }[] = [
//   {
//     id: "title",
//     label: "Title Sponsor",
//     blurb: "Headline partner powering the league.",
//     icon: Crown,
//     visible: 1,
//   },
//   {
//     id: "co",
//     label: "CO Sponsor",
//     blurb: "Trusted brands fueling every match-day.",
//     icon: Star,
//     visible: 4,
//   },
//   {
//     id: "associate",
//     label: "Associate Sponsor",
//     blurb: "Community partners behind the scenes.",
//     icon: Handshake,
//     visible: 10,
//   },
// ];

// const AUTOPLAY_MS = 2500;

// const SponsorsSection = () => {
//   const navigate = useNavigate();
//   const [active, setActive] = useState<SponsorCategory>("title");
//   const [page, setPage] = useState(0);
//   const [paused, setPaused] = useState(false);

//   const cat = CATEGORIES.find((c) => c.id === active)!;
//   const filtered = useMemo(
//     () => sponsors.filter((s) => s.category === active),
//     [active],
//   );
//   const pages = Math.max(1, Math.ceil(filtered.length / cat.visible));
//   const current = filtered.slice(
//     page * cat.visible,
//     page * cat.visible + cat.visible,
//   );

//   // reset page on category change
//   useEffect(() => setPage(0), [active]);

//   // auto-carousel
//   useEffect(() => {
//     if (paused || pages <= 1) return;
//     const id = setInterval(() => setPage((p) => (p + 1) % pages), AUTOPLAY_MS);
//     return () => clearInterval(id);
//   }, [paused, pages, active]);

//   const go = (s: Sponsor) => navigate(`/${getSponsorSlug(s.name)}`);

//   return (
//     <section id="sponsors" className="relative overflow-hidden bg-gradient-to-b from-[#f3ebbd] via-[#e8e5eb] to-[#e4c76f] py-24 text-white">
//       {/* ambient */}
//       <div className="absolute inset-0 pointer-events-none">
//         <div className="absolute -top-32 left-1/4 h-96 w-96 rounded-full bg-[#E63946]/20 blur-3xl" />
//         <div className="absolute bottom-0 right-0 rounded-full h-96 w-96 bg-amber-500/10 blur-3xl" />
//         <div
//           className="absolute inset-0 opacity-[0.04]"
//           style={{
//             backgroundImage:
//               "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
//             backgroundSize: "32px 32px",
//           }}
//         />
//       </div>

//       <div className="relative px-6 mx-auto max-w-7xl">
//         {/* header */}
//         <div className="mb-12 text-center">
//           <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white px-4 py-1.5 text-xs uppercase tracking-[0.2em] text-[#24201d] font-bold backdrop-blur">
//             <Sparkles className="h-3.5 w-3.5 text-amber-300" /> Powered
//             Partnerships
//           </div>
//           <h2 className="text-4xl font-black text-[#24201d] tracking-tight md:text-6xl">
//             Official{" "}
//             <span className="bg-gradient-to-r from-amber-300 via-[#E63946] to-amber-300 bg-clip-text text-transparent">
//               Sponsors
//             </span>
//           </h2>
//           <p className="max-w-xl mx-auto mt-3 text-sm text-[#24201d]/75 md:text-base">
//             Premium brands powering every moment of the BNI Premier League.
//           </p>
//         </div>

//         {/* tabs */}
//         <div className="grid gap-3 mb-10 md:grid-cols-3">
//           {CATEGORIES.map((c) => {
//             const Icon = c.icon;
//             const count = sponsors.filter((s) => s.category === c.id).length;
//             const isActive = active === c.id;
//             return (
//               <button
//                 key={c.id}
//                 onClick={() => setActive(c.id)}
//                 className={`group relative overflow-hidden rounded-2xl border p-5 text-left transition-all bg-[#f0eded] ${
//                   isActive
//                     ? "border-amber-400/60 bg-gradient-to-br from-[#E63946]/30 via-[#7A0C12]/30 to-amber-500/20 shadow-[0_10px_40px_-10px_rgba(230,57,70,0.6)]"
//                     : "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06]"
//                 }`}
//               >
//                 <div className="flex items-start gap-3">
//                   <div
//                     className={`flex h-11 w-11 items-center justify-center rounded-xl bg-[#EB5D47] ${
//                       isActive
//                         ? "bg-amber-400 text-[#1a0a14]"
//                         : "bg-white/10 text-white/80"
//                     }`}
//                   >
//                     <Icon className="w-5 h-5" />
//                   </div>
//                   <div className="flex-1">
//                     <div className="flex items-center gap-2">
//                       <span className="font-semibold text-[#1a0a14]">
//                         {c.label}
//                       </span>
//                       <span className="rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-bold text-[#e9890c]">
//                         {count}
//                       </span>
//                     </div>
//                     <p className="mt-1 text-xs text-[#1a0a14]/75">{c.blurb}</p>
//                   </div>
//                 </div>
//               </button>
//             );
//           })}
//         </div>

//         {/* carousel toolbar */}
//         <div className="flex items-center justify-between mb-5 font-bold">
//           <span className="text-xs uppercase tracking-[0.18em] text-[#e92c2c]">
//             Showing <span className="text-[#EB5D47]">{current.length}</span> of{" "}
//             <span className="text-[#f63113]">{filtered.length}</span>
//           </span>
//           {pages > 1 && (
//             <div className="flex items-center gap-2">
//               <button
//                 onClick={() => setPaused((p) => !p)}
//                 className="p-2 border rounded-full border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
//                 aria-label={paused ? "Play" : "Pause"}
//               >
//                 {paused ? (
//                   <Play className="w-4 h-4" />
//                 ) : (
//                   <Pause className="w-4 h-4" />
//                 )}
//               </button>
//               <button
//                 onClick={() => setPage((p) => (p - 1 + pages) % pages)}
//                 className="p-2 border rounded-full border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
//                 aria-label="Previous"
//               >
//                 <ChevronLeft className="w-4 h-4" />
//               </button>
//               <button
//                 onClick={() => setPage((p) => (p + 1) % pages)}
//                 className="p-2 border rounded-full border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
//                 aria-label="Next"
//               >
//                 <ChevronRight className="w-4 h-4" />
//               </button>
//             </div>
//           )}
//         </div>

//         {/* CARDS */}
//         <div
//           onMouseEnter={() => setPaused(true)}
//           onMouseLeave={() => setPaused(false)}
//           className="animate-fade-in"
//           key={`${active}-${page}`}
//         >
//           {active === "title" &&
//             current.map((s) => (
//               <TitleSponsorCard
//                 key={s.name}
//                 sponsor={s}
//                 onClick={() => go(s)}
//               />
//             ))}

//           {active === "co" && (
//             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
//               {current.map((s) => (
//                 <CoSponsorCard key={s.name} sponsor={s} onClick={() => go(s)} />
//               ))}
//             </div>
//           )}

//           {active === "associate" && (
//             <div className="grid gap-6 md:grid-cols-2">
//               {current.map((s) => (
//                 <AssociateSponsorCard
//                   key={s.name}
//                   sponsor={s}
//                   onClick={() => go(s)}
//                 />
//               ))}
//             </div>
//           )}

//           {filtered.length === 0 && (
//             <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] py-16 text-center text-white/50">
//               No sponsors in this tier yet.
//             </div>
//           )}
//         </div>

//         {/* pagination dots */}
//         {pages > 1 && (
//           <div className="flex items-center justify-center gap-2 mt-8">
//             {Array.from({ length: pages }).map((_, i) => (
//               <button
//                 key={i}
//                 onClick={() => setPage(i)}
//                 className={`h-1.5 rounded-full transition-all ${
//                   i === page
//                     ? "w-10 bg-gradient-to-r from-amber-300 to-[#E63946]"
//                     : "w-1.5 bg-[#E63946] hover:bg-white/40"
//                 }`}
//                 aria-label={`Go to page ${i + 1}`}
//               />
//             ))}
//           </div>
//         )}
//       </div>
//     </section>
//   );
// };

// /* ============== TITLE CARD — big, cricket-themed ============== */
// const TitleSponsorCard = ({
//   sponsor,
//   onClick,
// }: {
//   sponsor: Sponsor;
//   onClick: () => void;
// }) => (
//   <button
//     onClick={onClick}
//     className="group relative block w-full overflow-hidden rounded-3xl border border-amber-400/30 bg-gradient-to-br from-[#1a0a14] via-[#2a0f1f] to-[#1a0a14] p-1 text-left shadow-[0_30px_80px_-20px_rgba(230,57,70,0.5)] transition-all hover:shadow-[0_40px_100px_-20px_rgba(230,57,70,0.7)]"
//   >
//     {/* gradient ring */}
//     <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-amber-400/40 via-transparent to-[#E63946]/40 opacity-60" />
//     {/* stadium light burst */}
//     <div className="pointer-events-none absolute -top-40 left-1/2 h-80 w-[120%] -translate-x-1/2 rounded-full bg-amber-400/15 blur-3xl" />

//     <div className="relative rounded-[22px] bg-gradient-to-br from-[#1a0a14]/95 via-[#15081a]/95 to-[#1a0a14]/95 p-5 sm:p-6 md:p-10">
//       {/* cricket pitch lines decoration */}
//       <CricketAccents />

//       <div className="relative grid gap-8 md:grid-cols-[1.1fr_1fr] md:items-center">
//         {/* LEFT: branding */}
//         <div>
//           <div className="flex items-center gap-2 mb-5">
//             <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-200 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-[#1a0a14]">
//               <Trophy className="w-3 h-3 " /> {sponsor.tier}
//             </span>
//             <span className="inline-flex items-center gap-1 text-xs text-white/90">
//               <MapPin className="w-3 h-3" />
//               {sponsor.company.location}
//             </span>
//           </div>

//           {/* logo plate */}
//           <div className="inline-flex items-center p-3 sm:p-4 mb-6 bg-white border shadow-2xl h-20 sm:h-24 md:h-32 rounded-2xl border-white/10">
//             <SponsorLogo
//               name={sponsor.name}
//               logoUrl={sponsor.logoUrl}
//               className="h-full"
//             />
//           </div>

//           <h3 className="text-2xl sm:text-3xl font-black leading-tight md:text-5xl">
//             <span className="text-transparent bg-gradient-to-r from-white via-amber-100 to-white bg-clip-text">
//               {sponsor.name}
//             </span>
//           </h3>
//           {sponsor.tagline && (
//             <p className="mt-3 text-base italic text-amber-200/80 md:text-lg">
//               "{sponsor.tagline}"
//             </p>
//           )}
//           <p className="max-w-xl mt-4 text-sm leading-relaxed text-white/70 md:text-base">
//             {sponsor.highlight}
//           </p>

//           <div className="flex flex-wrap gap-2 mt-6">
//             {sponsor.focusAreas?.slice(0, 4).map((f) => (
//               <span
//                 key={f}
//                 className="px-3 py-1 text-xs border rounded-full border-amber-300/30 bg-amber-300/5 text-amber-100/90"
//               >
//                 {f}
//               </span>
//             ))}
//           </div>

//           <span className="mt-7 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#E63946] to-amber-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg transition-transform group-hover:translate-x-1">
//             Explore Portfolio <ChevronRight className="w-4 h-4" />
//           </span>
//         </div>

//         {/* RIGHT: founder portrait */}
//         {sponsor.owner.photoUrl && (
//           <div className="relative">
//             {/* trophy glow */}
//             <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-amber-400/30 to-[#E63946]/30 blur-2xl" />
//             <div className="relative overflow-hidden rounded-3xl border border-amber-300/30 bg-gradient-to-br from-white/5 to-white/[0.02] p-2 w-full sm:w-[90%] md:w-[80%] mx-auto">
//               <div className="relative aspect-[3/4] sm:aspect-[4/5] overflow-hidden rounded-2xl">
//                 <img
//                   src={sponsor.owner.photoUrl}
//                   alt={sponsor.owner.name}
//                   className="absolute inset-0 h-full w-full object-cover object-top md:object-center transition-transform duration-700 group-hover:scale-105"
//                 />
//                 <div className="absolute inset-0 bg-gradient-to-t from-[#1a0a14] via-transparent to-transparent" />
//                 <div className="absolute bottom-0 left-0 right-0 p-5">
//                   <div className="text-[10px] uppercase tracking-[0.2em] text-amber-300/80">
//                     {sponsor.owner.role}
//                   </div>
//                   <div className="mt-1 text-xl font-bold">
//                     {sponsor.owner.name}
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   </button>
// );

// /* ============== CO SPONSOR — split horizontal card ============== */
// const CoSponsorCard = ({
//   sponsor,
//   onClick,
// }: {
//   sponsor: Sponsor;
//   onClick: () => void;
// }) => (
//   <button
//     onClick={onClick}
//     className="group relative flex h-full w-full md:left-9 flex-col overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#1C0C16]/90 to-[#1C0C16]/70 text-left transition-all hover:-translate-y-1 hover:border-amber-300/40 hover:shadow-[0_20px_60px_-20px_rgba(245,200,80,0.4)]"
//   >
//     {/* top banner with founder */}
//     <div className="relative h-56 overflow-hidden md:h-80 lg:h-80">
//       {sponsor.owner.photoUrl ? (
//         <img
//           src={sponsor.owner.photoUrl}
//           alt={sponsor.owner.name}
//           className="absolute inset-0 object-cover object-[center_10%] w-full h-full transition-transform duration-700 group-hover:scale-110"
//         />
//       ) : (
//         <div className="absolute inset-0 bg-gradient-to-br from-[#E63946]/90 to-amber-500/30" />
//       )}
//       <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

//       {/* tier chip */}
//       <span className="absolute left-4 top-4 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-300 to-amber-100 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-[#1a0a14]">
//         <Star className="w-3 h-3" /> {sponsor.tier}
//       </span>

//       {/* founder label */}
//      <div className="absolute flex items-end justify-between bottom-2 left-4 right-4 md:bottom-4">
//         <div>
//           <div className="text-[10px] uppercase tracking-[0.2em] text-[#ef2020] font-semibold">
//             {sponsor.owner.role}
//           </div>
//           <div className="text-sm font-semibold text-white">
//             {sponsor.owner.name}
//           </div>
//         </div>
//         {/* logo bubble */}
//         <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-white/20 bg-white p-1.5 shadow-lg">
//           <SponsorLogo
//             name={sponsor.name}
//             logoUrl={sponsor.logoUrl}
//             className="w-full h-full"
//           />
//         </div>
//       </div>
//     </div>

//     {/* body */}
//     <div className="flex flex-col flex-1 p-5">
//       <h3 className="text-lg font-bold leading-tight text-white">
//         {sponsor.name}
//       </h3>
//       <p className="mt-1.5 text-xs text-amber-200/70">
//         {sponsor.tagline ?? sponsor.highlight}
//       </p>
//       <p className="mt-3 text-xs line-clamp-2 text-white/75">
//         {sponsor.company.summary}
//       </p>

//       <div className="flex items-center justify-between pt-4 mt-auto">
//         <span className="inline-flex items-center gap-1 text-xs text-white/95">
//           <MapPin className="w-3 h-3" /> {sponsor.company.location}
//         </span>
//         <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-300">
//           View <ChevronRight className="h-3.5 w-3.5" />
//         </span>
//       </div>
//     </div>
//   </button>
// );

// /* ============== ASSOCIATE — compact circular-founder card ============== */
// const AssociateSponsorCard = ({
//   sponsor,
//   onClick,
// }: {
//   sponsor: Sponsor;
//   onClick: () => void;
// }) => (
//   <button
//     onClick={onClick}
//     className="group relative flex items-center gap-5 overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#1C0C16]/70 to-[#1C0C16]/50 p-5 text-left transition-all hover:-translate-y-1 hover:border-[#E63946]/40 hover:bg-white/[0.06] hover:shadow-[0_20px_60px_-20px_rgba(230,57,70,0.4)]"
//   >
//     {/* founder avatar - circular */}
//     <div className="relative flex-shrink-0">
//       <div className="absolute -inset-1 rounded-full bg-gradient-to-br from-[#E63946] to-amber-400 opacity-70 blur" />
//       <div className="relative w-20 h-20 overflow-hidden border-2 rounded-full border-white/20 bg-white/5">
//         {sponsor.owner.photoUrl ? (
//           <img
//             src={sponsor.owner.photoUrl}
//             alt={sponsor.owner.name}
//             className="object-cover object-top w-full h-full"
//           />
//         ) : (
//           <div className="flex items-center justify-center w-full h-full text-2xl font-bold text-white/60">
//             {sponsor.owner.name[0]}
//           </div>
//         )}
//       </div>
//       {/* logo dot */}
//       <div className="absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-full border-2 border-[#0b0612] bg-white p-1 shadow-lg">
//         <SponsorLogo
//           name={sponsor.name}
//           logoUrl={sponsor.logoUrl}
//           className="w-full h-full"
//         />
//       </div>
//     </div>

//     {/* body */}
//     <div className="flex-1 min-w-0">
//       <span className="inline-block rounded-full border border-white/15 bg-[#FDDA67] px-2 py-0.5 text-[10px] uppercase tracking-wider text-[#0b0612] font-semibold">
//         <Handshake className="inline w-3 h-3 mr-1" /> {sponsor.tier}
//       </span>
//       <h3 className="mt-2 text-base font-bold text-white truncate">
//         {sponsor.name}
//       </h3>
//       <p className="mt-0.5 truncate text-xs text-white/55">
//         {sponsor.highlight}
//       </p>
//       <div className="mt-2 flex items-center gap-2 text-[11px] text-white/45">
//         <MapPin className="w-3 h-3" /> {sponsor.company.location}
//       </div>
//     </div>

//     <ChevronRight className="flex-shrink-0 w-5 h-5 transition-all text-white/30 group-hover:translate-x-1 group-hover:text-amber-300" />
//   </button>
// );

// /* ============== cricket-themed SVG decor for title card ============== */
// const CricketAccents = () => (
//   <svg
//     className="absolute hidden md:block w-32 h-32 pointer-events-none right-4 top-4 text-amber-300/15"
//     viewBox="0 0 100 100"
//     fill="none"
//     aria-hidden
//   >
//     {/* cricket ball seam */}
//     <circle cx="50" cy="50" r="22" stroke="currentColor" strokeWidth="1.5" />
//     <path
//       d="M28 50 Q50 35 72 50"
//       stroke="currentColor"
//       strokeWidth="1"
//       strokeDasharray="2 2"
//     />
//     <path
//       d="M28 50 Q50 65 72 50"
//       stroke="currentColor"
//       strokeWidth="1"
//       strokeDasharray="2 2"
//     />
//     {/* stumps */}
//     <g transform="translate(78 8)">
//       <line
//         x1="0"
//         y1="0"
//         x2="0"
//         y2="22"
//         stroke="currentColor"
//         strokeWidth="1.2"
//       />
//       <line
//         x1="4"
//         y1="0"
//         x2="4"
//         y2="22"
//         stroke="currentColor"
//         strokeWidth="1.2"
//       />
//       <line
//         x1="8"
//         y1="0"
//         x2="8"
//         y2="22"
//         stroke="currentColor"
//         strokeWidth="1.2"
//       />
//       <line
//         x1="-1"
//         y1="0"
//         x2="9"
//         y2="0"
//         stroke="currentColor"
//         strokeWidth="1.2"
//       />
//     </g>
//   </svg>
// );

// export default SponsorsSection;














































// import { useEffect, useMemo, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import {
//   ChevronLeft,
//   ChevronRight,
//   Crown,
//   Star,
//   Handshake,
//   Sparkles,
//   MapPin,
//   Trophy,
//   Pause,
//   Play,
// } from "lucide-react";
// import SponsorLogo from "./SponsorLogo";
// import {
//   sponsors,
//   getSponsorSlug,
//   type Sponsor,
//   type SponsorCategory,
// } from "@/data/sponsors";

// const CATEGORIES: {
//   id: SponsorCategory;
//   label: string;
//   blurb: string;
//   icon: React.ElementType;
//   visible: number;
// }[] = [
//   {
//     id: "title",
//     label: "Title Sponsor",
//     blurb: "Headline partner powering the league.",
//     icon: Crown,
//     visible: 1,
//   },
//   {
//     id: "co",
//     label: "CO Sponsor",
//     blurb: "Trusted brands fueling every match-day.",
//     icon: Star,
//     visible: 4,
//   },
//   {
//     id: "associate",
//     label: "Associate Sponsor",
//     blurb: "Community partners behind the scenes.",
//     icon: Handshake,
//     visible: 10,
//   },
// ];

// const AUTOPLAY_MS = 2500;

// const SponsorsSection = () => {
//   const navigate = useNavigate();
//   const [active, setActive] = useState<SponsorCategory>("title");
//   const [page, setPage] = useState(0);
//   const [paused, setPaused] = useState(false);

//   const cat = CATEGORIES.find((c) => c.id === active)!;
//   const filtered = useMemo(
//     () => sponsors.filter((s) => s.category === active),
//     [active],
//   );
//   const pages = Math.max(1, Math.ceil(filtered.length / cat.visible));
//   const current = filtered.slice(
//     page * cat.visible,
//     page * cat.visible + cat.visible,
//   );

//   // reset page on category change
//   useEffect(() => setPage(0), [active]);

//   // auto-carousel
//   useEffect(() => {
//     if (paused || pages <= 1) return;
//     const id = setInterval(() => setPage((p) => (p + 1) % pages), AUTOPLAY_MS);
//     return () => clearInterval(id);
//   }, [paused, pages, active]);

//   const go = (s: Sponsor) => navigate(`/${getSponsorSlug(s.name)}`);

//   return (
//     <section id="sponsors" className="relative overflow-hidden bg-gradient-to-b from-[#f3ebbd] via-[#e8e5eb] to-[#e4c76f] py-24 text-white">
//       {/* ambient */}
//       <div className="absolute inset-0 pointer-events-none">
//         <div className="absolute -top-32 left-1/4 h-96 w-96 rounded-full bg-[#E63946]/20 blur-3xl" />
//         <div className="absolute bottom-0 right-0 rounded-full h-96 w-96 bg-amber-500/10 blur-3xl" />
//         <div
//           className="absolute inset-0 opacity-[0.04]"
//           style={{
//             backgroundImage:
//               "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
//             backgroundSize: "32px 32px",
//           }}
//         />
//       </div>

//       <div className="relative px-6 mx-auto max-w-7xl">
//         {/* header */}
//         <div className="mb-12 text-center">
//           <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white px-4 py-1.5 text-xs uppercase tracking-[0.2em] text-[#24201d] font-bold backdrop-blur">
//             <Sparkles className="h-3.5 w-3.5 text-amber-300" /> Powered
//             Partnerships
//           </div>
//           <h2 className="text-4xl font-black text-[#24201d] tracking-tight md:text-6xl">
//             Official{" "}
//             <span className="bg-gradient-to-r from-amber-300 via-[#E63946] to-amber-300 bg-clip-text text-transparent">
//               Sponsors
//             </span>
//           </h2>
//           <p className="max-w-xl mx-auto mt-3 text-sm text-[#24201d]/75 md:text-base">
//             Premium brands powering every moment of the BNI Premier League.
//           </p>
//         </div>

//         {/* tabs */}
//         <div className="grid gap-3 mb-10 md:grid-cols-3">
//           {CATEGORIES.map((c) => {
//             const Icon = c.icon;
//             const count = sponsors.filter((s) => s.category === c.id).length;
//             const isActive = active === c.id;
//             return (
//               <button
//                 key={c.id}
//                 onClick={() => setActive(c.id)}
//                 className={`group relative overflow-hidden rounded-2xl border p-5 text-left transition-all bg-[#f0eded] ${
//                   isActive
//                     ? "border-amber-400/60 bg-gradient-to-br from-[#E63946]/30 via-[#7A0C12]/30 to-amber-500/20 shadow-[0_10px_40px_-10px_rgba(230,57,70,0.6)]"
//                     : "border-[#24201d]/15 bg-white/40 hover:border-[#24201d]/25 hover:bg-white/60"
//                 }`}
//               >
//                 <div className="flex items-start gap-3">
//                   <div
//                     className={`flex h-11 w-11 items-center justify-center rounded-xl ${
//                       isActive
//                         ? "bg-amber-400 text-[#1a0a14]"
//                         : "bg-[#24201d]/10 text-[#24201d]/70"
//                     }`}
//                   >
//                     <Icon className="w-5 h-5" />
//                   </div>
//                   <div className="flex-1">
//                     <div className="flex items-center gap-2">
//                       <span className="font-semibold text-[#1a0a14]">
//                         {c.label}
//                       </span>
//                       <span className="rounded-full bg-[#1a0a14]/90 px-2 py-0.5 text-[10px] font-bold text-amber-300">
//                         {count}
//                       </span>
//                     </div>
//                     <p className="mt-1 text-xs text-[#1a0a14]/65">{c.blurb}</p>
//                   </div>
//                 </div>
//               </button>
//             );
//           })}
//         </div>

//         {/* carousel toolbar */}
//         <div className="flex items-center justify-between mb-5 font-bold">
//           <span className="text-xs uppercase tracking-[0.18em] text-[#e92c2c]">
//             Showing <span className="text-[#EB5D47]">{current.length}</span> of{" "}
//             <span className="text-[#f63113]">{filtered.length}</span>
//           </span>
//           {pages > 1 && (
//             <div className="flex items-center gap-2">
//               <button
//                 onClick={() => setPaused((p) => !p)}
//                 className="p-2 border rounded-full border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
//                 aria-label={paused ? "Play" : "Pause"}
//               >
//                 {paused ? (
//                   <Play className="w-4 h-4" />
//                 ) : (
//                   <Pause className="w-4 h-4" />
//                 )}
//               </button>
//               <button
//                 onClick={() => setPage((p) => (p - 1 + pages) % pages)}
//                 className="p-2 border rounded-full border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
//                 aria-label="Previous"
//               >
//                 <ChevronLeft className="w-4 h-4" />
//               </button>
//               <button
//                 onClick={() => setPage((p) => (p + 1) % pages)}
//                 className="p-2 border rounded-full border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
//                 aria-label="Next"
//               >
//                 <ChevronRight className="w-4 h-4" />
//               </button>
//             </div>
//           )}
//         </div>

//         {/* CARDS */}
//         <div
//           onMouseEnter={() => setPaused(true)}
//           onMouseLeave={() => setPaused(false)}
//           className="animate-fade-in"
//           key={`${active}-${page}`}
//         >
//           {active === "title" &&
//             current.map((s) => (
//               <TitleSponsorCard
//                 key={s.name}
//                 sponsor={s}
//                 onClick={() => go(s)}
//               />
//             ))}

//           {active === "co" && (
//             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
//               {current.map((s) => (
//                 <CoSponsorCard key={s.name} sponsor={s} onClick={() => go(s)} />
//               ))}
//             </div>
//           )}

//           {active === "associate" && (
//             <div className="grid gap-6 md:grid-cols-2">
//               {current.map((s) => (
//                 <AssociateSponsorCard
//                   key={s.name}
//                   sponsor={s}
//                   onClick={() => go(s)}
//                 />
//               ))}
//             </div>
//           )}

//           {filtered.length === 0 && (
//             <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] py-16 text-center text-white/50">
//               No sponsors in this tier yet.
//             </div>
//           )}
//         </div>

//         {/* pagination dots */}
//         {pages > 1 && (
//           <div className="flex items-center justify-center gap-2 mt-8">
//             {Array.from({ length: pages }).map((_, i) => (
//               <button
//                 key={i}
//                 onClick={() => setPage(i)}
//                 className={`h-1.5 rounded-full transition-all ${
//                   i === page
//                     ? "w-10 bg-gradient-to-r from-amber-300 to-[#E63946]"
//                     : "w-1.5 bg-[#E63946] hover:bg-white/40"
//                 }`}
//                 aria-label={`Go to page ${i + 1}`}
//               />
//             ))}
//           </div>
//         )}
//       </div>
//     </section>
//   );
// };

// /* ============== TITLE CARD — big, cricket-themed ============== */
// const TitleSponsorCard = ({
//   sponsor,
//   onClick,
// }: {
//   sponsor: Sponsor;
//   onClick: () => void;
// }) => (
//   <button
//     onClick={onClick}
//     className="group relative block w-full overflow-hidden rounded-3xl border border-amber-400/30 bg-gradient-to-br from-[#1a0a14] via-[#2a0f1f] to-[#1a0a14] p-1 text-left shadow-[0_30px_80px_-20px_rgba(230,57,70,0.5)] transition-all hover:shadow-[0_40px_100px_-20px_rgba(230,57,70,0.7)]"
//   >
//     {/* gradient ring */}
//     <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-amber-400/40 via-transparent to-[#E63946]/40 opacity-60" />
//     {/* stadium light burst */}
//     <div className="pointer-events-none absolute -top-40 left-1/2 h-80 w-[120%] -translate-x-1/2 rounded-full bg-amber-400/15 blur-3xl" />

//     <div className="relative rounded-[22px] bg-gradient-to-br from-[#1a0a14]/95 via-[#15081a]/95 to-[#1a0a14]/95 p-5 sm:p-6 md:p-10">
//       {/* cricket pitch lines decoration */}
//       <CricketAccents />

//       <div className="relative grid gap-8 md:grid-cols-[1.1fr_1fr] md:items-center">
//         {/* LEFT: branding */}
//         <div>
//           <div className="flex items-center gap-2 mb-5">
//             <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-200 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-[#1a0a14]">
//               <Trophy className="w-3 h-3 " /> {sponsor.tier}
//             </span>
//             <span className="inline-flex items-center gap-1 text-xs text-white/90">
//               <MapPin className="w-3 h-3" />
//               {sponsor.company.location}
//             </span>
//           </div>

//           {/* logo plate */}
//           <div className="inline-flex items-center p-3 sm:p-4 mb-6 bg-white border shadow-2xl h-20 sm:h-24 md:h-32 rounded-2xl border-white/10">
//             <SponsorLogo
//               name={sponsor.name}
//               logoUrl={sponsor.logoUrl}
//               className="h-full"
//             />
//           </div>

//           <h3 className="text-2xl sm:text-3xl font-black leading-tight md:text-5xl">
//             <span className="text-transparent bg-gradient-to-r from-white via-amber-100 to-white bg-clip-text">
//               {sponsor.name}
//             </span>
//           </h3>
//           {sponsor.tagline && (
//             <p className="mt-3 text-base italic text-amber-200/80 md:text-lg">
//               "{sponsor.tagline}"
//             </p>
//           )}
//           <p className="max-w-xl mt-4 text-sm leading-relaxed text-white/70 md:text-base">
//             {sponsor.highlight}
//           </p>

//           <div className="flex flex-wrap gap-2 mt-6">
//             {sponsor.focusAreas?.slice(0, 4).map((f) => (
//               <span
//                 key={f}
//                 className="px-3 py-1 text-xs border rounded-full border-amber-300/30 bg-amber-300/5 text-amber-100/90"
//               >
//                 {f}
//               </span>
//             ))}
//           </div>

//           <span className="mt-7 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#E63946] to-amber-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg transition-transform group-hover:translate-x-1">
//             Explore Portfolio <ChevronRight className="w-4 h-4" />
//           </span>
//         </div>

//         {/* RIGHT: founder portrait */}
//         {sponsor.owner.photoUrl && (
//           <div className="relative">
//             {/* trophy glow */}
//             <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-amber-400/30 to-[#E63946]/30 blur-2xl" />
//             <div className="relative overflow-hidden rounded-3xl border border-amber-300/30 bg-gradient-to-br from-white/5 to-white/[0.02] p-2 w-full sm:w-[90%] md:w-[80%] mx-auto">
//               <div className="relative aspect-[3/4] sm:aspect-[4/5] overflow-hidden rounded-2xl">
//                 <img
//                   src={sponsor.owner.photoUrl}
//                   alt={sponsor.owner.name}
//                   className="absolute inset-0 h-full w-full object-cover object-top md:object-center transition-transform duration-700 group-hover:scale-105"
//                 />
//                 <div className="absolute inset-0 bg-gradient-to-t from-[#1a0a14] via-transparent to-transparent" />
//                 <div className="absolute bottom-0 left-0 right-0 p-5">
//                   <div className="text-[10px] uppercase tracking-[0.2em] text-amber-300/80">
//                     {sponsor.owner.role}
//                   </div>
//                   <div className="mt-1 text-xl font-bold">
//                     {sponsor.owner.name}
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   </button>
// );

// /* ============== CO SPONSOR — split horizontal card ============== */
// const CoSponsorCard = ({
//   sponsor,
//   onClick,
// }: {
//   sponsor: Sponsor;
//   onClick: () => void;
// }) => (
//   <button
//     onClick={onClick}
//     className="group relative flex h-full w-full md:left-9 flex-col overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#1C0C16]/90 to-[#1C0C16]/70 text-left transition-all hover:-translate-y-1 hover:border-amber-300/40 hover:shadow-[0_20px_60px_-20px_rgba(245,200,80,0.4)]"
//   >
//     {/* top banner with founder */}
//     <div className="relative h-56 overflow-hidden md:h-80 lg:h-80">
//       {sponsor.owner.photoUrl ? (
//         <img
//           src={sponsor.owner.photoUrl}
//           alt={sponsor.owner.name}
//           className="absolute inset-0 object-cover object-[center_10%] w-full h-full transition-transform duration-700 group-hover:scale-110"
//         />
//       ) : (
//         <div className="absolute inset-0 bg-gradient-to-br from-[#E63946]/90 to-amber-500/30" />
//       )}
//       <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

//       {/* tier chip */}
//       <span className="absolute left-4 top-4 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-300 to-amber-100 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-[#1a0a14]">
//         <Star className="w-3 h-3" /> {sponsor.tier}
//       </span>

//       {/* founder label */}
//      <div className="absolute flex items-end justify-between bottom-2 left-4 right-4 md:bottom-4">
//         <div>
//           <div className="text-[10px] uppercase tracking-[0.2em] text-[#ef2020] font-semibold">
//             {sponsor.owner.role}
//           </div>
//           <div className="text-sm font-semibold text-white">
//             {sponsor.owner.name}
//           </div>
//         </div>
//         {/* logo bubble */}
//         <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-white/20 bg-white p-1.5 shadow-lg">
//           <SponsorLogo
//             name={sponsor.name}
//             logoUrl={sponsor.logoUrl}
//             className="w-full h-full"
//           />
//         </div>
//       </div>
//     </div>

//     {/* body */}
//     <div className="flex flex-col flex-1 p-5">
//       <h3 className="text-lg font-bold leading-tight text-white">
//         {sponsor.name}
//       </h3>
//       <p className="mt-1.5 text-xs text-amber-200/70">
//         {sponsor.tagline ?? sponsor.highlight}
//       </p>
//       <p className="mt-3 text-xs line-clamp-2 text-white/75">
//         {sponsor.company.summary}
//       </p>

//       <div className="flex items-center justify-between pt-4 mt-auto">
//         <span className="inline-flex items-center gap-1 text-xs text-white/95">
//           <MapPin className="w-3 h-3" /> {sponsor.company.location}
//         </span>
//         <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-300">
//           View <ChevronRight className="h-3.5 w-3.5" />
//         </span>
//       </div>
//     </div>
//   </button>
// );

// /* ============== ASSOCIATE — compact circular-founder card ============== */
// const AssociateSponsorCard = ({
//   sponsor,
//   onClick,
// }: {
//   sponsor: Sponsor;
//   onClick: () => void;
// }) => (
//   <button
//     onClick={onClick}
//     className="group relative flex items-center gap-5 overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#1C0C16]/70 to-[#1C0C16]/50 p-5 text-left transition-all hover:-translate-y-1 hover:border-[#E63946]/40 hover:bg-white/[0.06] hover:shadow-[0_20px_60px_-20px_rgba(230,57,70,0.4)]"
//   >
//     {/* founder avatar - circular */}
//     <div className="relative flex-shrink-0">
//       <div className="absolute -inset-1 rounded-full bg-gradient-to-br from-[#E63946] to-amber-400 opacity-70 blur" />
//       <div className="relative w-20 h-20 overflow-hidden border-2 rounded-full border-white/20 bg-white/5">
//         {sponsor.owner.photoUrl ? (
//           <img
//             src={sponsor.owner.photoUrl}
//             alt={sponsor.owner.name}
//             className="object-cover object-top w-full h-full"
//           />
//         ) : (
//           <div className="flex items-center justify-center w-full h-full text-2xl font-bold text-white/60">
//             {sponsor.owner.name[0]}
//           </div>
//         )}
//       </div>
//       {/* logo dot */}
//       <div className="absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-full border-2 border-[#0b0612] bg-white p-1 shadow-lg">
//         <SponsorLogo
//           name={sponsor.name}
//           logoUrl={sponsor.logoUrl}
//           className="w-full h-full"
//         />
//       </div>
//     </div>

//     {/* body */}
//     <div className="flex-1 min-w-0">
//       <span className="inline-block rounded-full border border-white/15 bg-[#FDDA67] px-2 py-0.5 text-[10px] uppercase tracking-wider text-[#0b0612] font-semibold">
//         <Handshake className="inline w-3 h-3 mr-1" /> {sponsor.tier}
//       </span>
//       <h3 className="mt-2 text-base font-bold text-white truncate">
//         {sponsor.name}
//       </h3>
//       <p className="mt-0.5 truncate text-xs text-white/55">
//         {sponsor.highlight}
//       </p>
//       <div className="mt-2 flex items-center gap-2 text-[11px] text-white/45">
//         <MapPin className="w-3 h-3" /> {sponsor.company.location}
//       </div>
//     </div>

//     <ChevronRight className="flex-shrink-0 w-5 h-5 transition-all text-white/30 group-hover:translate-x-1 group-hover:text-amber-300" />
//   </button>
// );

// /* ============== cricket-themed SVG decor for title card ============== */
// const CricketAccents = () => (
//   <svg
//     className="absolute hidden md:block w-32 h-32 pointer-events-none right-4 top-4 text-amber-300/15"
//     viewBox="0 0 100 100"
//     fill="none"
//     aria-hidden
//   >
//     {/* cricket ball seam */}
//     <circle cx="50" cy="50" r="22" stroke="currentColor" strokeWidth="1.5" />
//     <path
//       d="M28 50 Q50 35 72 50"
//       stroke="currentColor"
//       strokeWidth="1"
//       strokeDasharray="2 2"
//     />
//     <path
//       d="M28 50 Q50 65 72 50"
//       stroke="currentColor"
//       strokeWidth="1"
//       strokeDasharray="2 2"
//     />
//     {/* stumps */}
//     <g transform="translate(78 8)">
//       <line
//         x1="0"
//         y1="0"
//         x2="0"
//         y2="22"
//         stroke="currentColor"
//         strokeWidth="1.2"
//       />
//       <line
//         x1="4"
//         y1="0"
//         x2="4"
//         y2="22"
//         stroke="currentColor"
//         strokeWidth="1.2"
//       />
//       <line
//         x1="8"
//         y1="0"
//         x2="8"
//         y2="22"
//         stroke="currentColor"
//         strokeWidth="1.2"
//       />
//       <line
//         x1="-1"
//         y1="0"
//         x2="9"
//         y2="0"
//         stroke="currentColor"
//         strokeWidth="1.2"
//       />
//     </g>
//   </svg>
// );

// export default SponsorsSection;













































import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  Crown,
  Star,
  Handshake,
  Sparkles,
  MapPin,
  Trophy,
  Pause,
  Play,
} from "lucide-react";
import SponsorLogo from "./SponsorLogo";
import {
  sponsors,
  getSponsorSlug,
  type Sponsor,
  type SponsorCategory,
} from "@/data/sponsors";

const CATEGORIES: {
  id: SponsorCategory;
  label: string;
  blurb: string;
  icon: React.ElementType;
  visible: number;
}[] = [
  {
    id: "title",
    label: "Title Sponsor",
    blurb: "Headline partner powering the league.",
    icon: Crown,
    visible: 1,
  },
  {
    id: "co",
    label: "CO Sponsor",
    blurb: "Trusted brands fueling every match-day.",
    icon: Star,
    visible: 4,
  },
  {
    id: "associate",
    label: "Associate Sponsor",
    blurb: "Community partners behind the scenes.",
    icon: Handshake,
    visible: 10,
  },
];

const AUTOPLAY_MS = 2500;

const SponsorsSection = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [active, setActive] = useState<SponsorCategory>("title");
  const [page, setPage] = useState(0);
  const [paused, setPaused] = useState(false);

  // restore active category + scroll position when coming back from a sponsor detail page
  useEffect(() => {
    const restoredCategory = (
      location.state as { sponsorCategory?: SponsorCategory } | null
    )?.sponsorCategory;

    if (restoredCategory) {
      setActive(restoredCategory);

      // delay so this runs after the router's default scroll-to-top on navigation
      const timer = setTimeout(() => {
        document
          .getElementById("sponsors")
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 300);

      // clear the state so a refresh / future nav doesn't re-trigger this
      navigate(location.pathname, { replace: true, state: {} });

      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const cat = CATEGORIES.find((c) => c.id === active)!;
  const filtered = useMemo(
    () => sponsors.filter((s) => s.category === active),
    [active],
  );
  const pages = Math.max(1, Math.ceil(filtered.length / cat.visible));
  const current = filtered.slice(
    page * cat.visible,
    page * cat.visible + cat.visible,
  );

  // reset page on category change
  useEffect(() => setPage(0), [active]);

  // auto-carousel
  useEffect(() => {
    if (paused || pages <= 1) return;
    const id = setInterval(() => setPage((p) => (p + 1) % pages), AUTOPLAY_MS);
    return () => clearInterval(id);
  }, [paused, pages, active]);

  const go = (s: Sponsor) => navigate(`/${getSponsorSlug(s.name)}`);

  return (
    <section id="sponsors" className="relative overflow-hidden bg-gradient-to-b from-[#f3ebbd] via-[#e8e5eb] to-[#e4c76f] lg:py-24 text-white py-6">
      {/* ambient */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-32 left-1/4 h-96 w-96 rounded-full bg-[#E63946]/20 blur-3xl" />
        <div className="absolute bottom-0 right-0 rounded-full h-96 w-96 bg-amber-500/10 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize: "32px 32px",
          }}
        />
      </div>

      <div className="relative px-6 mx-auto max-w-7xl">
        {/* header */}
        <div className="mb-12 text-center">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white px-4 py-1.5 text-xs uppercase tracking-[0.2em] text-[#24201d] font-bold backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-amber-300" /> Powered
            Partnerships
          </div>
          <h2 className="text-4xl font-black text-[#24201d] tracking-tight md:text-6xl">
            Official{" "}
            <span className="bg-gradient-to-r from-amber-300 via-[#E63946] to-amber-300 bg-clip-text text-transparent">
              Sponsors
            </span>
          </h2>
          <p className="max-w-xl mx-auto mt-3 text-sm text-[#24201d]/75 md:text-base">
            Premium brands powering every moment of the BNI Premier League.
          </p>
        </div>

        {/* tabs */}
        <div className="grid gap-3 mb-10 md:grid-cols-3">
          {CATEGORIES.map((c) => {
            const Icon = c.icon;
            const count = sponsors.filter((s) => s.category === c.id).length;
            const isActive = active === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setActive(c.id)}
                className={`group relative overflow-hidden rounded-2xl border p-5 text-left transition-all bg-[#f0eded] ${
                  isActive
                    ? "border-amber-400/60 bg-gradient-to-br from-[#E63946]/30 via-[#7A0C12]/30 to-amber-500/20 shadow-[0_10px_40px_-10px_rgba(230,57,70,0.6)]"
                    : "border-[#24201d]/15 bg-white/40 hover:border-[#24201d]/25 hover:bg-white/60"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                      isActive
                        ? "bg-amber-400 text-[#1a0a14]"
                        : "bg-[#24201d]/10 text-[#24201d]/70"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-[#1a0a14]">
                        {c.label}
                      </span>
                      <span className="rounded-full bg-[#1a0a14]/90 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                        {count}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-[#1a0a14]/65">{c.blurb}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* carousel toolbar */}
        <div className="flex items-center justify-between mb-5 font-bold">
          <span className="text-xs uppercase tracking-[0.18em] text-[#e92c2c]">
            Showing <span className="text-[#EB5D47]">{current.length}</span> of{" "}
            <span className="text-[#f63113]">{filtered.length}</span>
          </span>
          {pages > 1 && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPaused((p) => !p)}
                className="p-2 border rounded-full border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
                aria-label={paused ? "Play" : "Pause"}
              >
                {paused ? (
                  <Play className="w-4 h-4" />
                ) : (
                  <Pause className="w-4 h-4" />
                )}
              </button>
              <button
                onClick={() => setPage((p) => (p - 1 + pages) % pages)}
                className="p-2 border rounded-full border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
                aria-label="Previous"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage((p) => (p + 1) % pages)}
                className="p-2 border rounded-full border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
                aria-label="Next"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* CARDS */}
        <div
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          className="animate-fade-in"
          key={`${active}-${page}`}
        >
          {active === "title" &&
            current.map((s) => (
              <TitleSponsorCard
                key={s.name}
                sponsor={s}
                onClick={() => go(s)}
              />
            ))}

          {active === "co" && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {current.map((s) => (
                <CoSponsorCard key={s.name} sponsor={s} onClick={() => go(s)} />
              ))}
            </div>
          )}

          {active === "associate" && (
            <div className="grid gap-6 md:grid-cols-2">
              {current.map((s) => (
                <AssociateSponsorCard
                  key={s.name}
                  sponsor={s}
                  onClick={() => go(s)}
                />
              ))}
            </div>
          )}

          {filtered.length === 0 && (
            <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] py-16 text-center text-white/50">
              No sponsors in this tier yet.
            </div>
          )}
        </div>

        {/* pagination dots */}
        {pages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            {Array.from({ length: pages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === page
                    ? "w-10 bg-gradient-to-r from-amber-300 to-[#E63946]"
                    : "w-1.5 bg-[#E63946] hover:bg-white/40"
                }`}
                aria-label={`Go to page ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

/* ============== TITLE CARD — big, cricket-themed ============== */
const TitleSponsorCard = ({
  sponsor,
  onClick,
}: {
  sponsor: Sponsor;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className="group relative block w-full overflow-hidden rounded-3xl border border-amber-400/30 bg-gradient-to-br from-[#1a0a14] via-[#2a0f1f] to-[#1a0a14] p-1 text-left shadow-[0_30px_80px_-20px_rgba(230,57,70,0.5)] transition-all hover:shadow-[0_40px_100px_-20px_rgba(230,57,70,0.7)]"
  >
    {/* gradient ring */}
    <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-amber-400/40 via-transparent to-[#E63946]/40 opacity-60" />
    {/* stadium light burst */}
    <div className="pointer-events-none absolute -top-40 left-1/2 h-80 w-[120%] -translate-x-1/2 rounded-full bg-amber-400/15 blur-3xl" />

    <div className="relative rounded-[22px] bg-gradient-to-br from-[#1a0a14]/95 via-[#15081a]/95 to-[#1a0a14]/95 p-5 sm:p-6 md:p-10">
      {/* cricket pitch lines decoration */}
      <CricketAccents />

      <div className="relative grid gap-8 md:grid-cols-[1.1fr_1fr] md:items-center">
        {/* LEFT: branding */}
        <div>
          <div className="flex items-center gap-2 mb-5">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-200 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-[#1a0a14]">
              <Trophy className="w-3 h-3 " /> {sponsor.tier}
            </span>
            <span className="inline-flex items-center gap-1 text-xs text-white/90">
              <MapPin className="w-3 h-3" />
              {sponsor.company.location}
            </span>
          </div>

          {/* logo plate */}
          <div className="inline-flex items-center h-20 p-3 mb-6 bg-white border shadow-2xl sm:p-4 sm:h-24 md:h-32 rounded-2xl border-white/10">
            <SponsorLogo
              name={sponsor.name}
              logoUrl={sponsor.logoUrl}
              className="h-full"
            />
          </div>

          <h3 className="text-2xl font-black leading-tight sm:text-3xl md:text-5xl">
            <span className="text-transparent bg-gradient-to-r from-white via-amber-100 to-white bg-clip-text">
              {sponsor.name}
            </span>
          </h3>
          {sponsor.tagline && (
            <p className="mt-3 text-base italic text-amber-200/80 md:text-lg">
              "{sponsor.tagline}"
            </p>
          )}
          <p className="max-w-xl mt-4 text-sm leading-relaxed text-white/70 md:text-base">
            {sponsor.highlight}
          </p>

          <div className="flex flex-wrap gap-2 mt-6">
            {sponsor.focusAreas?.slice(0, 4).map((f) => (
              <span
                key={f}
                className="px-3 py-1 text-xs border rounded-full border-amber-300/30 bg-amber-300/5 text-amber-100/90"
              >
                {f}
              </span>
            ))}
          </div>

          <span className="mt-7 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#E63946] to-amber-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg transition-transform group-hover:translate-x-1">
            Explore Portfolio <ChevronRight className="w-4 h-4" />
          </span>
        </div>

        {/* RIGHT: founder portrait */}
        {sponsor.owner.photoUrl && (
          <div className="relative">
            {/* trophy glow */}
            <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-amber-400/30 to-[#E63946]/30 blur-2xl" />
            <div className="relative overflow-hidden rounded-3xl border border-amber-300/30 bg-gradient-to-br from-white/5 to-white/[0.02] p-2 w-full sm:w-[90%] md:w-[80%] mx-auto">
              <div className="relative aspect-[3/4] sm:aspect-[4/5] overflow-hidden rounded-2xl">
                <img
                  src={sponsor.owner.photoUrl}
                  alt={sponsor.owner.name}
                  className="absolute inset-0 object-cover object-top w-full h-full transition-transform duration-700 md:object-center group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1a0a14] via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <div className="text-[10px] uppercase tracking-[0.2em] text-amber-300/80">
                    {sponsor.owner.role}
                  </div>
                  <div className="mt-1 text-xl font-bold">
                    {sponsor.owner.name}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  </button>
);

/* ============== CO SPONSOR — split horizontal card ============== */
const CoSponsorCard = ({
  sponsor,
  onClick,
}: {
  sponsor: Sponsor;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className="group relative flex h-full w-full md:left-9 flex-col overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#1C0C16]/90 to-[#1C0C16]/70 text-left transition-all hover:-translate-y-1 hover:border-amber-300/40 hover:shadow-[0_20px_60px_-20px_rgba(245,200,80,0.4)]"
  >
    {/* top banner with founder */}
    <div className="relative h-56 overflow-hidden md:h-80 lg:h-80">
      {sponsor.owner.photoUrl ? (
        <img
          src={sponsor.owner.photoUrl}
          alt={sponsor.owner.name}
          className="absolute inset-0 object-cover object-[center_10%] w-full h-full transition-transform duration-700 group-hover:scale-110"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-[#E63946]/90 to-amber-500/30" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

      {/* tier chip */}
      <span className="absolute left-4 top-4 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-300 to-amber-100 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-[#1a0a14]">
        <Star className="w-3 h-3" /> {sponsor.tier}
      </span>

      {/* founder label */}
     <div className="absolute flex items-end justify-between bottom-2 left-4 right-4 md:bottom-4">
        <div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-[#ef2020] font-semibold">
            {sponsor.owner.role}
          </div>
          <div className="text-sm font-semibold text-white">
            {sponsor.owner.name}
          </div>
        </div>
        {/* logo bubble */}
        <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-white/20 bg-white p-1.5 shadow-lg">
          <SponsorLogo
            name={sponsor.name}
            logoUrl={sponsor.logoUrl}
            className="w-full h-full"
          />
        </div>
      </div>
    </div>

    {/* body */}
    <div className="flex flex-col flex-1 p-5">
      <h3 className="text-lg font-bold leading-tight text-white">
        {sponsor.name}
      </h3>
      <p className="mt-1.5 text-xs text-amber-200/70">
        {sponsor.tagline ?? sponsor.highlight}
      </p>
      <p className="mt-3 text-xs line-clamp-2 text-white/75">
        {sponsor.company.summary}
      </p>

      <div className="flex items-center justify-between pt-4 mt-auto">
        <span className="inline-flex items-center gap-1 text-xs text-white/95">
          <MapPin className="w-3 h-3" /> {sponsor.company.location}
        </span>
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-300">
          View <ChevronRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </div>
  </button>
);

/* ============== ASSOCIATE — compact circular-founder card ============== */
const AssociateSponsorCard = ({
  sponsor,
  onClick,
}: {
  sponsor: Sponsor;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className="group relative flex items-center gap-5 overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#1C0C16]/70 to-[#1C0C16]/50 p-5 text-left transition-all hover:-translate-y-1 hover:border-[#E63946]/40 hover:bg-white/[0.06] hover:shadow-[0_20px_60px_-20px_rgba(230,57,70,0.4)]"
  >
    {/* founder avatar - circular */}
    <div className="relative flex-shrink-0">
      <div className="absolute -inset-1 rounded-full bg-gradient-to-br from-[#E63946] to-amber-400 opacity-70 blur" />
      <div className="relative w-20 h-20 overflow-hidden border-2 rounded-full border-white/20 bg-white/5">
        {sponsor.owner.photoUrl ? (
          <img
            src={sponsor.owner.photoUrl}
            alt={sponsor.owner.name}
            className="object-cover object-top w-full h-full"
          />
        ) : (
          <div className="flex items-center justify-center w-full h-full text-2xl font-bold text-white/60">
            {sponsor.owner.name[0]}
          </div>
        )}
      </div>
      {/* logo dot */}
      <div className="absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-full border-2 border-[#0b0612] bg-white p-1 shadow-lg">
        <SponsorLogo
          name={sponsor.name}
          logoUrl={sponsor.logoUrl}
          className="w-full h-full"
        />
      </div>
    </div>

    {/* body */}
    <div className="flex-1 min-w-0">
      <span className="inline-block rounded-full border border-white/15 bg-[#FDDA67] px-2 py-0.5 text-[10px] uppercase tracking-wider text-[#0b0612] font-semibold">
        <Handshake className="inline w-3 h-3 mr-1" /> {sponsor.tier}
      </span>
      <h3 className="mt-2 text-base font-bold text-white truncate">
        {sponsor.name}
      </h3>
      <p className="mt-0.5 truncate text-xs text-white/55">
        {sponsor.highlight}
      </p>
      <div className="mt-2 flex items-center gap-2 text-[11px] text-white/45">
        <MapPin className="w-3 h-3" /> {sponsor.company.location}
      </div>
    </div>

    <ChevronRight className="flex-shrink-0 w-5 h-5 transition-all text-white/30 group-hover:translate-x-1 group-hover:text-amber-300" />
  </button>
);

/* ============== cricket-themed SVG decor for title card ============== */
const CricketAccents = () => (
  <svg
    className="absolute hidden w-32 h-32 pointer-events-none md:block right-4 top-4 text-amber-300/15"
    viewBox="0 0 100 100"
    fill="none"
    aria-hidden
  >
    {/* cricket ball seam */}
    <circle cx="50" cy="50" r="22" stroke="currentColor" strokeWidth="1.5" />
    <path
      d="M28 50 Q50 35 72 50"
      stroke="currentColor"
      strokeWidth="1"
      strokeDasharray="2 2"
    />
    <path
      d="M28 50 Q50 65 72 50"
      stroke="currentColor"
      strokeWidth="1"
      strokeDasharray="2 2"
    />
    {/* stumps */}
    <g transform="translate(78 8)">
      <line
        x1="0"
        y1="0"
        x2="0"
        y2="22"
        stroke="currentColor"
        strokeWidth="1.2"
      />
      <line
        x1="4"
        y1="0"
        x2="4"
        y2="22"
        stroke="currentColor"
        strokeWidth="1.2"
      />
      <line
        x1="8"
        y1="0"
        x2="8"
        y2="22"
        stroke="currentColor"
        strokeWidth="1.2"
      />
      <line
        x1="-1"
        y1="0"
        x2="9"
        y2="0"
        stroke="currentColor"
        strokeWidth="1.2"
      />
    </g>
  </svg>
);

export default SponsorsSection;