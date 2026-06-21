// import { useEffect, useRef, useState } from "react";
// import {
//   ArrowLeft,
//   CalendarDays,
//   Clock,
//   MapPin,
//   PlayCircle,
//   Share2,
//   X,
//   ChevronRight,
//   Sparkles,
//   Crown,
//   Star,
//   Trophy,
// } from "lucide-react";
// import type { Language, NewsItem } from "@/lib/newsStorage";
// import cricketBanner from "@/assets/images/bg1.png";
// import { sponsors, getSponsorSlug, type Sponsor } from "@/data/sponsors";
// import SponsorLogo from "./SponsorLogo";
// import { useNavigate } from "react-router-dom";

// type NewsDetailsPopupProps = {
//   post: NewsItem | null;
//   onClose: () => void;
//   formatDate: (date: string) => string;
//   language: Language;
//   autoOpenVideo?: boolean;
// };

// /* ── WhatsApp icon ── */
// const WhatsAppIcon = ({ className }: { className?: string }) => (
//   <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
//     <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
//   </svg>
// );

// /* ── Tier badge chip ── */
// const TierChip = ({ tier }: { tier: string }) => {
//   const t = tier?.toLowerCase() ?? "";
//   if (t.includes("title"))
//     return (
//       <span className="inline-flex items-center gap-0.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-200 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wide text-[#1a0a14]">
//         <Crown className="w-2 h-2" /> Title
//       </span>
//     );
//   if (t.includes("co"))
//     return (
//       <span className="inline-flex items-center gap-0.5 rounded-full bg-gradient-to-r from-[#E63946] to-rose-300 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wide text-white">
//         <Star className="w-2 h-2" /> Co
//       </span>
//     );
//   return (
//     <span className="inline-flex items-center gap-0.5 rounded-full bg-white/10 border border-white/20 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wide text-amber-200">
//       <Trophy className="w-2 h-2" /> Assoc
//     </span>
//   );
// };

// /* ══════════════════════════════════════════════
//    LEFT SPONSOR PANEL — fixed, left side
// ══════════════════════════════════════════════ */
// const LeftSponsorPanel = ({
//   sponsorList,
//   onNavigate,
// }: {
//   sponsorList: Sponsor[];
//   onNavigate: (s: Sponsor) => void;
// }) => (
//   <>
//     <style>{`
//       @keyframes slideInLeft {
//         from { opacity: 0; transform: translateX(-28px); }
//         to   { opacity: 1; transform: translateX(0); }
//       }
//       .sponsor-left-card {
//         animation: slideInLeft 0.45s cubic-bezier(0.22,1,0.36,1) both;
//       }
//       .sponsor-panel-left::-webkit-scrollbar,
//       .sponsor-panel-right::-webkit-scrollbar { display: none; }
//     `}</style>
//     <div
//       style={{ top: "80px", left: 0, bottom: 0, width: "160px", zIndex: 10000, scrollbarWidth: "none" } as React.CSSProperties}
//       className="sponsor-panel-left fixed flex flex-col gap-2 overflow-y-auto bg-gradient-to-b from-[#1a0a14] via-[#200d18] to-[#0f0509] px-2.5 py-3 border-r border-amber-900/30"
//     >
//       {/* header */}
//       <div className="flex items-center gap-1 px-1 mb-1">
//         <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
//         <span className="text-[9px] font-black uppercase tracking-[0.18em] text-amber-400">
//           Sponsors
//         </span>
//       </div>

//       {sponsorList.map((s, i) => (
//         <button
//           key={s.name}
//           type="button"
//           onClick={() => onNavigate(s)}
//           className="sponsor-left-card group relative flex flex-col overflow-hidden rounded-xl border border-white/10 bg-white/5 text-left transition-all hover:border-amber-400/50 hover:bg-white/10 hover:shadow-[0_6px_24px_-6px_rgba(230,57,70,0.5)]"
//           style={{ animationDelay: `${i * 70}ms` } as React.CSSProperties}
//         >
//           {/* founder photo */}
//           {s.owner?.photoUrl ? (
//             <div className="relative overflow-hidden" style={{ height: "72px" }}>
//               <img
//                 src={s.owner.photoUrl}
//                 alt={s.owner.name}
//                 className="absolute inset-0 h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
//                 style={{ objectPosition: "center 15%" }}
//               />
//               <div
//                 className="absolute inset-x-0 bottom-0"
//                 style={{ height: "30%", background: "linear-gradient(to top, rgba(26,10,20,0.7) 0%, transparent 100%)" }}
//               />
//               <div className="absolute top-1.5 left-1.5">
//                 <TierChip tier={s.tier} />
//               </div>
//             </div>
//           ) : (
//             <div className="h-10 bg-gradient-to-br from-[#E63946]/30 to-amber-500/20 flex items-center justify-center">
//               <TierChip tier={s.tier} />
//             </div>
//           )}

//           {/* logo + name body */}
//           <div className="flex items-center gap-2 px-2.5 py-2">
//             <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white p-1 shadow">
//               <SponsorLogo name={s.name} logoUrl={s.logoUrl} className="w-full h-full" />
//             </div>
//             <div className="min-w-0 flex-1">
//               <p className="truncate text-[10px] font-bold text-white leading-tight">
//                 {s.name}
//               </p>
//               {s.tagline && (
//                 <p className="truncate text-[8px] text-amber-200/50 leading-tight mt-0.5">
//                   {s.tagline}
//                 </p>
//               )}
//             </div>
//           </div>

//           {/* hover arrow */}
//           <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
//             <ChevronRight className="h-3 w-3 text-amber-300" />
//           </div>
//         </button>
//       ))}
//     </div>
//   </>
// );

// /* ══════════════════════════════════════════════
//    RIGHT SPONSOR PANEL — fixed, right side
// ══════════════════════════════════════════════ */
// const RightSponsorPanel = ({
//   sponsorList,
//   onNavigate,
// }: {
//   sponsorList: Sponsor[];
//   onNavigate: (s: Sponsor) => void;
// }) => (
//   <>
//     <style>{`
//       @keyframes slideInRight {
//         from { opacity: 0; transform: translateX(28px); }
//         to   { opacity: 1; transform: translateX(0); }
//       }
//       .sponsor-right-card {
//         animation: slideInRight 0.45s cubic-bezier(0.22,1,0.36,1) both;
//       }
//     `}</style>
//     <div
//       style={{ top: "80px", right: 0, bottom: 0, width: "160px", zIndex: 10000, scrollbarWidth: "none" } as React.CSSProperties}
//       className="sponsor-panel-right fixed flex flex-col gap-2 overflow-y-auto bg-gradient-to-b from-[#1a0a14] via-[#200d18] to-[#0f0509] px-2.5 py-3 border-l border-amber-900/30"
//     >
//       {/* header */}
//       <div className="flex items-center justify-end gap-1 px-1 mb-1">
//         <span className="text-[9px] font-black uppercase tracking-[0.18em] text-amber-400">
//           Sponsors
//         </span>
//         <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
//       </div>

//       {sponsorList.map((s, i) => (
//         <button
//           key={s.name}
//           type="button"
//           onClick={() => onNavigate(s)}
//           className="sponsor-right-card group relative flex items-center gap-2 overflow-hidden rounded-xl border border-white/10 bg-white/5 p-2.5 text-left transition-all hover:border-[#E63946]/50 hover:bg-white/10 hover:shadow-[0_6px_24px_-6px_rgba(230,57,70,0.45)]"
//           style={{ animationDelay: `${i * 70}ms` } as React.CSSProperties}
//         >
//           {/* circular founder avatar */}
//           <div className="relative shrink-0">
//             <div className="absolute -inset-0.5 rounded-full bg-gradient-to-br from-[#E63946] to-amber-400 opacity-50 blur-[2px]" />
//             <div className="relative h-9 w-9 overflow-hidden rounded-full border border-white/20 bg-white/5">
//               {s.owner?.photoUrl ? (
//                 <img
//                   src={s.owner.photoUrl}
//                   alt={s.owner?.name}
//                   className="h-full w-full object-cover"
//                   style={{ objectPosition: "center 10%" }}
//                 />
//               ) : (
//                 <div className="flex h-full w-full items-center justify-center text-sm font-bold text-white/40">
//                   {s.owner?.name?.[0]}
//                 </div>
//               )}
//             </div>
//             {/* logo dot */}
//             <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-[#1a0a14] bg-white p-0.5 shadow">
//               <SponsorLogo name={s.name} logoUrl={s.logoUrl} className="w-full h-full" />
//             </div>
//           </div>

//           {/* text */}
//           <div className="min-w-0 flex-1">
//             <p className="truncate text-[10px] font-bold text-white">{s.name}</p>
//             <p className="truncate text-[8px] text-white/40 mt-0.5">
//               {s.company?.location}
//             </p>
//             <TierChip tier={s.tier} />
//           </div>

//           <ChevronRight className="h-3 w-3 shrink-0 text-white/20 transition-all group-hover:translate-x-0.5 group-hover:text-amber-300" />
//         </button>
//       ))}
//     </div>
//   </>
// );


// /* ══════════════════════════════════════════════
//    SPONSOR SLIDE — Title → Co → Associate
//    FIX: limitedAssoc now shows ALL associate sponsors (no hard cap)
//         so newly added sponsors always appear in the marquee.
// ══════════════════════════════════════════════ */
// const SponsorSlide = ({
//   titleSponsor,
//   coSponsors,
//   associateSponsors,
//   isTamil,
//   onNavigate,
//   part = "top",
// }: {
//   titleSponsor: Sponsor | null;
//   coSponsors: Sponsor[];
//   associateSponsors: Sponsor[];
//   isTamil: boolean;
//   onNavigate: (s: Sponsor) => void;
//   part?: "top" | "bottom";
// }) => {
//   const limitedCo = coSponsors.slice(0, 4);
//   // ✅ FIX: removed slice(0, 8) — now ALL associate sponsors are shown
//   const allAssoc = associateSponsors;

//   return (
//     <>
//       <style>{`
//         @keyframes fadeSlideUp {
//           from { opacity: 0; transform: translateY(20px) scale(0.97); }
//           to   { opacity: 1; transform: translateY(0) scale(1); }
//         }
//         @keyframes fadeIn {
//           from { opacity: 0; transform: translateY(12px); }
//           to   { opacity: 1; transform: translateY(0); }
//         }
//         @keyframes shimmer {
//           0%   { background-position: -200% center; }
//           100% { background-position: 200% center; }
//         }
//         .sponsor-fade-up {
//           opacity: 0;
//           animation: fadeSlideUp 0.55s cubic-bezier(0.22,1,0.36,1) forwards;
//         }
//         .sponsor-fade-in {
//           opacity: 0;
//           animation: fadeIn 0.45s cubic-bezier(0.22,1,0.36,1) forwards;
//         }
//         @keyframes borderPulse {
//           0%, 100% { box-shadow: 0 0 0 0 rgba(251,191,36,0),   0 4px 24px -6px rgba(251,191,36,0.15); }
//           50%       { box-shadow: 0 0 0 3px rgba(251,191,36,0.18), 0 8px 32px -6px rgba(251,191,36,0.38); }
//         }
//         .title-cta-shimmer {
//           animation: fadeSlideUp 0.55s cubic-bezier(0.22,1,0.36,1) forwards,
//                      borderPulse 3s ease-in-out 0.6s infinite;
//           opacity: 0;
//         }
//         .title-cta-shimmer::after {
//           content: '';
//           position: absolute;
//           inset: 0;
//           border-radius: inherit;
//           background: linear-gradient(
//             105deg,
//             transparent 25%,
//             rgba(255,210,80,0.07) 42%,
//             rgba(255,230,120,0.18) 50%,
//             rgba(255,210,80,0.07) 58%,
//             transparent 75%
//           );
//           background-size: 250% 100%;
//           animation: shimmer 4s linear infinite;
//           pointer-events: none;
//           z-index: 20;
//         }
//         @keyframes assoc-marquee {
//           0%   { transform: translateX(0); }
//           100% { transform: translateX(-50%); }
//         }
//         .assoc-marquee-track {
//           display: flex;
//           width: max-content;
//           animation: assoc-marquee ${allAssoc.length * 1.8}s linear infinite;
//         }
//         .assoc-marquee-track:hover { animation-play-state: paused; }
//       `}</style>

//       {/* ── 1. TITLE SPONSOR ── */}
//       {part === "top" && titleSponsor && (
//         <button
//           type="button"
//           onClick={() => onNavigate(titleSponsor)}
//           className="title-cta-shimmer group mb-4 relative flex w-full items-center gap-0 overflow-hidden rounded-2xl border border-amber-400/50 text-left shadow-lg transition-shadow hover:border-amber-400"
//           style={{ minHeight: "96px", animationDelay: "0ms" }}
//         >
//           {/* Left content area */}
//           <div
//             className="relative z-10 flex flex-1 min-w-0 flex-col justify-center gap-0 px-4 py-4"
//             style={{ background: "linear-gradient(105deg, #1a0a14 60%, #2d1220 100%)" }}
//           >
//             {/* Crown badge */}
//             <div className="mb-2 inline-flex items-center gap-1.5 self-start rounded-full border border-amber-400/60 bg-amber-400 px-2.5 py-0.5 shadow-md">
//               <Crown className="h-2.5 w-2.5 text-[#1a0a14]" />
//               <span className="text-[8px] font-black uppercase tracking-[0.15em] text-[#1a0a14]">
//                 {isTamil ? "தலைமை நிதியளிப்பாளர்" : "Title Sponsor"}
//               </span>
//             </div>
//             {/* Logo + name row */}
//             <div className="flex items-center gap-3">
//               <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-amber-400/30 bg-white p-1.5 shadow-lg shadow-amber-900/30">
//                 <SponsorLogo name={titleSponsor.name} logoUrl={titleSponsor.logoUrl} className="h-full w-full" />
//               </div>
//               <div className="min-w-0">
//                 <p className="truncate text-[17px] font-black leading-tight text-white drop-shadow-sm">
//                   {titleSponsor.name}
//                 </p>
//                 {(titleSponsor.tagline ?? titleSponsor.highlight) && (
//                   <p className="truncate text-[10px] font-medium leading-snug text-amber-300/80 mt-0.5">
//                     {titleSponsor.tagline ?? titleSponsor.highlight}
//                   </p>
//                 )}
//               </div>
//             </div>
//             {/* Explore CTA */}
//             <div className="mt-2.5 inline-flex items-center gap-1 self-start rounded-lg bg-amber-400/15 border border-amber-400/30 px-2.5 py-1 transition-all group-hover:bg-amber-400/25">
//               <span className="text-[9px] font-black uppercase tracking-[0.15em] text-amber-300">
//                 {isTamil ? "ஆராய" : "Explore"}
//               </span>
//               <ChevronRight className="h-3 w-3 text-amber-300 transition-transform group-hover:translate-x-0.5" />
//             </div>
//           </div>

//           {/* Owner photo */}
//           {titleSponsor.owner?.photoUrl && (
//             <div className="relative shrink-0 self-stretch" style={{ width: "100px" }}>
//               <img
//                 src={titleSponsor.owner.photoUrl}
//                 alt={titleSponsor.owner.name}
//                 className="absolute inset-0 h-full w-full object-cover object-top"
//               />
//               <div
//                 className="absolute inset-y-0 left-0 w-6"
//                 style={{ background: "linear-gradient(to right, #1a0a14, transparent)" }}
//               />
//             </div>
//           )}
//         </button>
//       )}

//       {/* ── 2. CO-SPONSORS — 4 columns ── */}
//       {part === "top" && limitedCo.length > 0 && (
//         <div
//           className="sponsor-fade-up mb-4 overflow-hidden rounded-2xl border border-[#E63946]/25 bg-gradient-to-br from-[#1a0a14] via-[#2a0d14] to-[#1a0a14]"
//           style={{ animationDelay: "120ms" }}
//         >
//           {/* Header */}
//           <div className="flex items-center gap-2 px-3 pt-2 pb-1">
//             <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#E63946]">
//               <Star className="h-2 w-2 text-white" />
//             </span>
//             <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#E63946]">
//               {isTamil ? "இணை நிறுவனர்" : "Co-Sponsors"}
//             </span>
//             <div className="h-px flex-1 bg-[#E63946]/20" />
//           </div>
//           {/* Strict 4-column grid */}
//           <div className="grid pb-2 px-2 gap-1.5" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
//             {limitedCo.map((s, i) => (
//               <button
//                 key={`co-${s.name}`}
//                 type="button"
//                 onClick={() => onNavigate(s)}
//                 className="sponsor-fade-in group flex flex-col items-center gap-1 rounded-lg border border-[#E63946]/15 bg-white/5 px-1 py-1.5 transition-all hover:border-[#E63946]/45 hover:bg-[#E63946]/10 min-w-0"
//                 style={{ animationDelay: `${200 + i * 60}ms` }}
//               >
//                 <div className="relative">
//                   <div className="absolute -inset-0.5 rounded-full bg-gradient-to-br from-[#E63946] to-rose-400 opacity-30 blur-[2px]" />
//                   <div className="relative h-8 w-8 overflow-hidden rounded-full border border-white/15 bg-white/5">
//                     {s.owner?.photoUrl ? (
//                       <img src={s.owner.photoUrl} alt={s.owner.name} className="h-full w-full object-cover" style={{ objectPosition: "center 10%" }} />
//                     ) : (
//                       <div className="flex h-full w-full items-center justify-center bg-[#E63946]/20 p-1">
//                         <SponsorLogo name={s.name} logoUrl={s.logoUrl} className="h-full w-full" />
//                       </div>
//                     )}
//                   </div>
//                   <div className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full border-2 border-[#1a0a14] bg-white p-[1.5px] shadow">
//                     <SponsorLogo name={s.name} logoUrl={s.logoUrl} className="h-full w-full" />
//                   </div>
//                 </div>
//                 <span className="w-full truncate text-[7px] font-semibold text-white/60 whitespace-nowrap group-hover:text-white text-center leading-tight mt-0.5">
//                   {s.name}
//                 </span>
//               </button>
//             ))}
//           </div>
//         </div>
//       )}

//       {/* ── 3. ASSOCIATE SPONSORS — bottom marquee ──
//            FIX: uses allAssoc (no slice cap) so every associate sponsor
//            including newly added ones always appears here.
//       ── */}
//       {part === "bottom" && allAssoc.length > 0 && (
//         <div
//           className="sponsor-fade-up mb-5 overflow-hidden rounded-xl border border-white/8 bg-gradient-to-r from-[#18080f] to-[#1e0c14]"
//           style={{ animationDelay: "0ms" }}
//         >
//           <div className="flex items-center gap-2 px-4 pt-2.5 pb-1.5">
//             <Trophy className="h-3 w-3 text-white/30 shrink-0" />
//             <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/40">
//               {isTamil ? "இணை நிதியளிப்பாளர்" : "Associate Sponsors"}
//             </span>
//             <div className="h-px flex-1 bg-white/8" />
//           </div>
//           <div className="relative overflow-hidden pb-2.5">
//             {/* Duplicate the list once for seamless looping */}
//             <div className="assoc-marquee-track gap-2 px-4">
//               {[...allAssoc, ...allAssoc].map((s, idx) => (
//                 <button
//                   key={`assoc-${s.name}-${idx}`}
//                   type="button"
//                   onClick={() => onNavigate(s)}
//                   className="group flex shrink-0 items-center gap-2 rounded-lg border border-white/8 bg-white/4 px-2.5 py-1.5 transition-all hover:border-white/20 hover:bg-white/10"
//                   style={{ width: "110px" }}
//                 >
//                   <div className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-white/10 bg-white p-0.5 shadow">
//                     <SponsorLogo name={s.name} logoUrl={s.logoUrl} className="h-full w-full" />
//                     {s.owner?.photoUrl && (
//                       <div className="absolute -bottom-1 -right-1 h-3.5 w-3.5 overflow-hidden rounded-full border border-[#1a0a14]">
//                         <img src={s.owner.photoUrl} alt={s.owner.name} className="h-full w-full object-cover" style={{ objectPosition: "center 10%" }} />
//                       </div>
//                     )}
//                   </div>
//                   <span className="flex-1 truncate text-[9px] font-medium text-white/50 whitespace-nowrap group-hover:text-white/80 leading-tight">
//                     {s.name}
//                   </span>
//                 </button>
//               ))}
//             </div>
//           </div>
//         </div>
//       )}
//     </>
//   );
// };

// /* ══════════════════════════════════════════════
//    MAIN COMPONENT
// ══════════════════════════════════════════════ */
// const NewsDetailsPopup = ({
//   post,
//   onClose,
//   formatDate,
//   language,
//   autoOpenVideo = false,
// }: NewsDetailsPopupProps) => {
//   const scrollRef = useRef<HTMLDivElement | null>(null);
//   const [videoOpen, setVideoOpen] = useState(false);
//   const navigate = useNavigate();

//   // ✅ FIX: all filters normalised with toLowerCase().trim()
//   //    so any future sponsor with slight capitalisation variation still shows up.
//   const leftSponsors = sponsors
//     .filter((s) => ["title", "co"].includes(s.category?.toLowerCase().trim()))
//     .slice(0, 6);
//   const rightSponsors = sponsors.filter(
//     (s) => s.category?.toLowerCase().trim() === "associate"
//   );
//   const slideTitleSponsor =
//     sponsors.find((s) => s.category?.toLowerCase().trim() === "title") ?? null;
//   const slideCoSponsors = sponsors.filter(
//     (s) => s.category?.toLowerCase().trim() === "co"
//   );
//   // ✅ FIX: no slice — all associate sponsors flow into the slide
//   const slideAssocSponsors = sponsors.filter(
//     (s) => s.category?.toLowerCase().trim() === "associate"
//   );

//   const goToSponsor = (s: Sponsor) => {
//     onClose();
//     navigate(`/${getSponsorSlug(s.name)}`);
//   };

//   useEffect(() => {
//     if (!post) return;
//     window.requestAnimationFrame(() => {
//       scrollRef.current?.scrollTo({ top: 0, behavior: "auto" });
//     });
//     setVideoOpen(autoOpenVideo);
//   }, [post, autoOpenVideo]);

//   useEffect(() => {
//     if (!post) return;
//     const handleKeyDown = (e: KeyboardEvent) => {
//       if (e.key === "Escape") {
//         if (videoOpen) { setVideoOpen(false); return; }
//         onClose();
//       }
//     };
//     document.addEventListener("keydown", handleKeyDown);
//     document.body.style.overflow = "hidden";
//     return () => {
//       document.removeEventListener("keydown", handleKeyDown);
//       document.body.style.overflow = "";
//     };
//   }, [post, onClose, videoOpen]);

//   if (!post) return null;
//   const isTamil = language === "ta";

//   const shareUrl = typeof window !== "undefined" ? window.location.href : "";
//   const shareTitle = post.newsTitle[language] ?? "";

//   const handleNativeShare = async () => {
//     if (navigator.share) {
//       try {
//         await navigator.share({ title: shareTitle, text: shareTitle, url: shareUrl });
//       } catch { /* cancelled */ }
//     } else {
//       try {
//         await navigator.clipboard.writeText(`${shareTitle}\n${shareUrl}`);
//         alert(isTamil ? "இணைப்பு நகலெடுக்கப்பட்டது!" : "Link copied to clipboard!");
//       } catch {
//         alert(shareUrl);
//       }
//     }
//   };

//   const handleWhatsApp = () => {
//     const text = encodeURIComponent(`${shareTitle}\n${shareUrl}`);
//     window.open(`https://wa.me/?text=${text}`, "_blank", "noopener,noreferrer");
//   };

//   const facts = [
//     { label: isTamil ? "இடம்" : "Venue", value: post.venue[language], Icon: MapPin },
//   ];

//   return (
//     <>
//       {/* ── Fixed left sponsor panel (desktop only) ── */}
//       <div className="hidden lg:block">
//         <LeftSponsorPanel sponsorList={leftSponsors} onNavigate={goToSponsor} />
//       </div>

//       {/* ── Fixed right sponsor panel (desktop only) ── */}
//       <div className="hidden lg:block">
//         <RightSponsorPanel sponsorList={rightSponsors} onNavigate={goToSponsor} />
//       </div>

//       {/* ── Main popup shell ── */}
//       <div
//         className="fixed inset-0 z-[9999] bg-[#f7f3ee]"
//         style={{ top: "var(--header-h, 64px)" } as React.CSSProperties}
//         role="dialog"
//         aria-modal="true"
//         aria-labelledby="news-detail-title"
//       >
//         <article className="flex h-full w-full flex-col overflow-hidden bg-[#f7f3ee] text-left">

//           {/* TOP BAR */}
//           <div className="shrink-0 border-b border-black/[0.08] bg-white shadow-sm">
//             <style>{`@media(min-width:1024px){.topbar-row{padding-left:176px!important;padding-right:176px!important;}}`}</style>
//             <div className="topbar-row flex w-full items-center justify-between gap-2 px-3 py-2.5">
//               <button
//                 type="button"
//                 onClick={onClose}
//                 aria-label="Back to news"
//                 className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-black/15 bg-white px-3 py-1.5 text-[12px] font-semibold text-gray-700 transition hover:bg-gray-50 hover:border-black/25"
//               >
//                 <ArrowLeft className="h-3.5 w-3.5" />
//                 {isTamil ? "பின்" : "Back"}
//               </button>
//               <div className="flex items-center gap-2">
//                 <button
//                   type="button"
//                   onClick={handleNativeShare}
//                   className="inline-flex items-center gap-1.5 rounded-lg bg-[#E53E3E] px-3 py-1.5 text-[12px] font-bold text-white transition hover:bg-[#C53030]"
//                 >
//                   <Share2 className="h-3.5 w-3.5" />
//                   {isTamil ? "பகிர்" : "Share"}
//                 </button>
//                 <button
//                   type="button"
//                   onClick={handleWhatsApp}
//                   className="inline-flex items-center gap-1.5 rounded-lg bg-[#25D366] px-3 py-1.5 text-[12px] font-bold text-white transition hover:bg-[#1ebe5d]"
//                 >
//                   <WhatsAppIcon className="h-3.5 w-3.5" />
//                   WhatsApp
//                 </button>
//               </div>
//             </div>
//           </div>

//           {/* SCROLLABLE ARTICLE */}
//           <div
//             ref={scrollRef}
//             className="main-scroll-area min-h-0 flex-1 overflow-y-auto"
//             style={{
//               marginLeft: "var(--sponsor-panel-w, 0px)",
//               marginRight: "var(--sponsor-panel-w, 0px)",
//               scrollbarWidth: "none",
//             } as React.CSSProperties}
//           >
//             <style>{`
//               :root { --header-h: 64px; }
//               @media (min-width: 1024px) { :root { --sponsor-panel-w: 160px; } }
//               .main-scroll-area::-webkit-scrollbar { display: none; }
//             `}</style>

//             <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
//               <div className="rounded-3xl bg-white p-5 sm:p-8 shadow-xl border border-gray-100/80">

//                 {/* Category + Date */}
//                 <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
//                   {post.category?.[language] && (
//                     <span className="rounded-md bg-gradient-to-r from-[#1a0a14] to-[#3d1428] px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-white shadow-sm">
//                       {post.category[language]}
//                     </span>
//                   )}
//                   <span className="ml-auto flex items-center gap-1 text-[11px] font-medium text-gray-400">
//                     <CalendarDays className="h-3 w-3" />
//                     {formatDate(post.publishedAt)}
//                   </span>
//                 </div>

//                 {/* Headline */}
//                 <h2
//                   id="news-detail-title"
//                   className="mb-5 font-black leading-[1.35] text-[clamp(20px,4.5vw,36px)] text-gray-900 tracking-tight"
//                 >
//                   {post.newsTitle[language]}
//                 </h2>

//                 {/* Hero image */}
//                 <div className="mb-5 overflow-hidden rounded-2xl border border-black/[0.06] shadow-md">
//                   <img
//                     src={post.matchStoryImageUrl?.trim() || cricketBanner}
//                     alt={post.matchStoryTitle[language] || "Match story"}
//                     className="block w-full h-auto"
//                     loading="lazy"
//                   />
//                 </div>

//                 {/* Sponsor Slide — Title + Co (top) */}
//                 <SponsorSlide
//                   titleSponsor={slideTitleSponsor}
//                   coSponsors={slideCoSponsors}
//                   associateSponsors={slideAssocSponsors}
//                   isTamil={isTamil}
//                   onNavigate={goToSponsor}
//                   part="top"
//                 />

//                 {/* Video embed */}
//                 {post.mediaEmbedUrl?.trim() && (
//                   <div className="mb-5 overflow-hidden rounded-2xl border border-black/[0.08] shadow-md">
//                     <button
//                       type="button"
//                       onClick={() => setVideoOpen(true)}
//                       aria-label={isTamil ? "வீடியோ திற" : "Play video"}
//                       className="relative block aspect-video w-full overflow-hidden bg-black focus-visible:outline-none"
//                     >
//                       <iframe
//                         className="pointer-events-none h-full w-full"
//                         src={`${post.mediaEmbedUrl}?rel=0&controls=0&modestbranding=1`}
//                         title={post.newsTitle[language]}
//                         allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
//                       />
//                       <span className="absolute inset-0 flex items-center justify-center bg-black/40 transition hover:bg-black/25">
//                         <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-xl ring-4 ring-white/20">
//                           <PlayCircle className="h-8 w-8 text-[#E63946]" />
//                         </span>
//                       </span>
//                     </button>
//                     <div className="flex items-center gap-2 bg-gradient-to-r from-amber-400 to-amber-300 px-4 py-2.5">
//                       <PlayCircle className="h-3.5 w-3.5 text-amber-900" />
//                       <span className="text-[11px] font-black uppercase tracking-[.08em] text-amber-900">
//                         {isTamil ? "வீடியோ பார்க்க" : "Watch Highlights"}
//                       </span>
//                     </div>
//                   </div>
//                 )}

//                 {/* KPI cards */}
//                 <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
//                   {facts.map(({ label, value, Icon }) => (
//                     <div
//                       key={label}
//                       className="flex items-center gap-3 rounded-2xl border border-amber-100 bg-gradient-to-br from-[#FFF8F0] to-amber-50 px-4 py-3.5 shadow-sm"
//                     >
//                       <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 shadow-md">
//                         <Icon className="h-4 w-4 text-white" />
//                       </div>
//                       <div className="min-w-0 flex-1">
//                         <p className="mb-0.5 text-[10px] font-black uppercase tracking-[.1em] text-amber-600/70">
//                           {label}
//                         </p>
//                         <p className="break-words text-[13px] font-bold leading-snug text-gray-900">
//                           {value}
//                         </p>
//                       </div>
//                     </div>
//                   ))}
//                 </div>

//                 {/* Body */}
//                 <p className="whitespace-pre-line text-[16px] md:text-[17px] leading-[1.95] text-gray-700">
//                   {post.newsDescription[language]}
//                 </p>

//                 {/* Sponsor Slide — Associate (bottom marquee) */}
//                 <div className="mt-6">
//                   <SponsorSlide
//                     titleSponsor={slideTitleSponsor}
//                     coSponsors={slideCoSponsors}
//                     associateSponsors={slideAssocSponsors}
//                     isTamil={isTamil}
//                     onNavigate={goToSponsor}
//                     part="bottom"
//                   />
//                 </div>

//               </div>
//             </div>

//           </div>

//         </article>
//       </div>

//       {/* FULLSCREEN VIDEO */}
//       {videoOpen && post && (
//         <div
//           className="fixed inset-0 z-[10001] flex flex-col bg-black"
//           role="dialog"
//           aria-modal="true"
//         >
//           <div className="flex h-12 shrink-0 items-center justify-between border-b border-white/10 px-4">
//             <p className="line-clamp-1 text-sm font-semibold text-white">
//               {post.newsTitle[language]}
//             </p>
//             <button
//               type="button"
//               onClick={() => setVideoOpen(false)}
//               className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white transition hover:bg-white/20"
//             >
//               <X className="h-4 w-4" />
//             </button>
//           </div>
//           <div className="flex min-h-0 flex-1 items-center">
//             <iframe
//               className="h-full w-full"
//               src={`${post.mediaEmbedUrl}?autoplay=1&rel=0`}
//               title={post.newsTitle[language]}
//               allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
//               allowFullScreen
//             />
//           </div>
//         </div>
//       )}
//     </>
//   );
// };

// export default NewsDetailsPopup;






























import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  Clock,
  MapPin,
  PlayCircle,
  Share2,
  X,
  ChevronRight,
  Sparkles,
  Crown,
  Star,
  Trophy,
  Facebook,
  Instagram,
} from "lucide-react";
import type { Language, NewsItem } from "@/lib/newsStorage";
import cricketBanner from "@/assets/images/bg1.png";
import { sponsors, getSponsorSlug, type Sponsor } from "@/data/sponsors";
import SponsorLogo from "./SponsorLogo";
import { useNavigate } from "react-router-dom";

type NewsDetailsPopupProps = {
  post: NewsItem | null;
  onClose: () => void;
  formatDate: (date: string) => string;
  language: Language;
  autoOpenVideo?: boolean;
};

/* ── WhatsApp icon ── */
const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

/* ── Tier badge chip ── */
const TierChip = ({ tier }: { tier: string }) => {
  const t = tier?.toLowerCase() ?? "";
  if (t.includes("title"))
    return (
      <span className="inline-flex items-center gap-0.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-200 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wide text-[#1a0a14]">
        <Crown className="w-2 h-2" /> Title
      </span>
    );
  if (t.includes("co"))
    return (
      <span className="inline-flex items-center gap-0.5 rounded-full bg-gradient-to-r from-[#E63946] to-rose-300 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wide text-white">
        <Star className="w-2 h-2" /> Co
      </span>
    );
  return (
    <span className="inline-flex items-center gap-0.5 rounded-full bg-white/10 border border-white/20 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wide text-amber-200">
      <Trophy className="w-2 h-2" /> Assoc
    </span>
  );
};

/* ══════════════════════════════════════════════
   LEFT SPONSOR PANEL — fixed, left side
══════════════════════════════════════════════ */
const LeftSponsorPanel = ({
  sponsorList,
  onNavigate,
}: {
  sponsorList: Sponsor[];
  onNavigate: (s: Sponsor) => void;
}) => (
  <>
    <style>{`
      @keyframes slideInLeft {
        from { opacity: 0; transform: translateX(-28px); }
        to   { opacity: 1; transform: translateX(0); }
      }
      .sponsor-left-card {
        animation: slideInLeft 0.45s cubic-bezier(0.22,1,0.36,1) both;
      }
      .sponsor-panel-left::-webkit-scrollbar,
      .sponsor-panel-right::-webkit-scrollbar { display: none; }
    `}</style>
    <div
      style={{ top: "80px", left: 0, bottom: 0, width: "160px", zIndex: 10000, scrollbarWidth: "none" } as React.CSSProperties}
      className="sponsor-panel-left fixed flex flex-col gap-2 overflow-y-auto bg-gradient-to-b from-[#1a0a14] via-[#200d18] to-[#0f0509] px-2.5 py-3 border-r border-amber-900/30"
    >
      {/* header */}
      <div className="flex items-center gap-1 px-1 mb-1">
        <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
        <span className="text-[9px] font-black uppercase tracking-[0.18em] text-amber-400">
          Sponsors
        </span>
      </div>

      {sponsorList.map((s, i) => (
        <button
          key={s.name}
          type="button"
          onClick={() => onNavigate(s)}
          className="sponsor-left-card group relative flex flex-col overflow-hidden rounded-xl border border-white/10 bg-white/5 text-left transition-all hover:border-amber-400/50 hover:bg-white/10 hover:shadow-[0_6px_24px_-6px_rgba(230,57,70,0.5)]"
          style={{ animationDelay: `${i * 70}ms` } as React.CSSProperties}
        >
          {/* founder photo */}
          {s.owner?.photoUrl ? (
            <div className="relative overflow-hidden" style={{ height: "72px" }}>
              <img
                src={s.owner.photoUrl}
                alt={s.owner.name}
                className="absolute inset-0 h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                style={{ objectPosition: "center 15%" }}
              />
              <div
                className="absolute inset-x-0 bottom-0"
                style={{ height: "30%", background: "linear-gradient(to top, rgba(26,10,20,0.7) 0%, transparent 100%)" }}
              />
              <div className="absolute top-1.5 left-1.5">
                <TierChip tier={s.tier} />
              </div>
            </div>
          ) : (
            <div className="h-10 bg-gradient-to-br from-[#E63946]/30 to-amber-500/20 flex items-center justify-center">
              <TierChip tier={s.tier} />
            </div>
          )}

          {/* logo + name body */}
          <div className="flex items-center gap-2 px-2.5 py-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white p-1 shadow">
              <SponsorLogo name={s.name} logoUrl={s.logoUrl} className="w-full h-full" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[10px] font-bold text-white leading-tight">
                {s.name}
              </p>
              {s.tagline && (
                <p className="truncate text-[8px] text-amber-200/50 leading-tight mt-0.5">
                  {s.tagline}
                </p>
              )}
            </div>
          </div>

          {/* hover arrow */}
          <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <ChevronRight className="h-3 w-3 text-amber-300" />
          </div>
        </button>
      ))}
    </div>
  </>
);

/* ══════════════════════════════════════════════
   RIGHT SPONSOR PANEL — fixed, right side
══════════════════════════════════════════════ */
const RightSponsorPanel = ({
  sponsorList,
  onNavigate,
}: {
  sponsorList: Sponsor[];
  onNavigate: (s: Sponsor) => void;
}) => (
  <>
    <style>{`
      @keyframes slideInRight {
        from { opacity: 0; transform: translateX(28px); }
        to   { opacity: 1; transform: translateX(0); }
      }
      .sponsor-right-card {
        animation: slideInRight 0.45s cubic-bezier(0.22,1,0.36,1) both;
      }
    `}</style>
    <div
      style={{ top: "80px", right: 0, bottom: 0, width: "160px", zIndex: 10000, scrollbarWidth: "none" } as React.CSSProperties}
      className="sponsor-panel-right fixed flex flex-col gap-2 overflow-y-auto bg-gradient-to-b from-[#1a0a14] via-[#200d18] to-[#0f0509] px-2.5 py-3 border-l border-amber-900/30"
    >
      {/* header */}
      <div className="flex items-center justify-end gap-1 px-1 mb-1">
        <span className="text-[9px] font-black uppercase tracking-[0.18em] text-amber-400">
          Sponsors
        </span>
        <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
      </div>

      {sponsorList.map((s, i) => (
        <button
          key={s.name}
          type="button"
          onClick={() => onNavigate(s)}
          className="sponsor-right-card group relative flex items-center gap-2 overflow-hidden rounded-xl border border-white/10 bg-white/5 p-2.5 text-left transition-all hover:border-[#E63946]/50 hover:bg-white/10 hover:shadow-[0_6px_24px_-6px_rgba(230,57,70,0.45)]"
          style={{ animationDelay: `${i * 70}ms` } as React.CSSProperties}
        >
          {/* circular founder avatar */}
          <div className="relative shrink-0">
            <div className="absolute -inset-0.5 rounded-full bg-gradient-to-br from-[#E63946] to-amber-400 opacity-50 blur-[2px]" />
            <div className="relative h-9 w-9 overflow-hidden rounded-full border border-white/20 bg-white/5">
              {s.owner?.photoUrl ? (
                <img
                  src={s.owner.photoUrl}
                  alt={s.owner?.name}
                  className="h-full w-full object-cover"
                  style={{ objectPosition: "center 10%" }}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-sm font-bold text-white/40">
                  {s.owner?.name?.[0]}
                </div>
              )}
            </div>
            {/* logo dot */}
            <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-[#1a0a14] bg-white p-0.5 shadow">
              <SponsorLogo name={s.name} logoUrl={s.logoUrl} className="w-full h-full" />
            </div>
          </div>

          {/* text */}
          <div className="min-w-0 flex-1">
            <p className="truncate text-[10px] font-bold text-white">{s.name}</p>
            <p className="truncate text-[8px] text-white/40 mt-0.5">
              {s.company?.location}
            </p>
            <TierChip tier={s.tier} />
          </div>

          <ChevronRight className="h-3 w-3 shrink-0 text-white/20 transition-all group-hover:translate-x-0.5 group-hover:text-amber-300" />
        </button>
      ))}
    </div>
  </>
);


/* ══════════════════════════════════════════════
   SPONSOR SLIDE — Title → Co → Associate
   FIX: limitedAssoc now shows ALL associate sponsors (no hard cap)
        so newly added sponsors always appear in the marquee.
══════════════════════════════════════════════ */
const SponsorSlide = ({
  titleSponsor,
  coSponsors,
  associateSponsors,
  isTamil,
  onNavigate,
  part = "top",
}: {
  titleSponsor: Sponsor | null;
  coSponsors: Sponsor[];
  associateSponsors: Sponsor[];
  isTamil: boolean;
  onNavigate: (s: Sponsor) => void;
  part?: "top" | "bottom";
}) => {
  const limitedCo = coSponsors.slice(0, 4);
  // ✅ FIX: removed slice(0, 8) — now ALL associate sponsors are shown
  const allAssoc = associateSponsors;

  return (
    <>
      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .sponsor-fade-up {
          opacity: 0;
          animation: fadeSlideUp 0.55s cubic-bezier(0.22,1,0.36,1) forwards;
        }
        .sponsor-fade-in {
          opacity: 0;
          animation: fadeIn 0.45s cubic-bezier(0.22,1,0.36,1) forwards;
        }
        @keyframes borderPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(251,191,36,0),   0 4px 24px -6px rgba(251,191,36,0.15); }
          50%       { box-shadow: 0 0 0 3px rgba(251,191,36,0.18), 0 8px 32px -6px rgba(251,191,36,0.38); }
        }
        .title-cta-shimmer {
          animation: fadeSlideUp 0.55s cubic-bezier(0.22,1,0.36,1) forwards,
                     borderPulse 3s ease-in-out 0.6s infinite;
          opacity: 0;
        }
        .title-cta-shimmer::after {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: inherit;
          background: linear-gradient(
            105deg,
            transparent 25%,
            rgba(255,210,80,0.07) 42%,
            rgba(255,230,120,0.18) 50%,
            rgba(255,210,80,0.07) 58%,
            transparent 75%
          );
          background-size: 250% 100%;
          animation: shimmer 4s linear infinite;
          pointer-events: none;
          z-index: 20;
        }
        @keyframes assoc-marquee {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .assoc-marquee-track {
          display: flex;
          width: max-content;
          animation: assoc-marquee ${allAssoc.length * 1.8}s linear infinite;
        }
        .assoc-marquee-track:hover { animation-play-state: paused; }
      `}</style>

      {/* ── 1. TITLE SPONSOR ── */}
      {part === "top" && titleSponsor && (
        <button
          type="button"
          onClick={() => onNavigate(titleSponsor)}
          className="title-cta-shimmer group mb-4 relative flex w-full items-center gap-0 overflow-hidden rounded-2xl border border-amber-400/50 text-left shadow-lg transition-shadow hover:border-amber-400"
          style={{ minHeight: "96px", animationDelay: "0ms" }}
        >
          {/* Left content area */}
          <div
            className="relative z-10 flex flex-1 min-w-0 flex-col justify-center gap-0 px-4 py-4"
            style={{ background: "linear-gradient(105deg, #1a0a14 60%, #2d1220 100%)" }}
          >
            {/* Crown badge */}
            <div className="mb-2 inline-flex items-center gap-1.5 self-start rounded-full border border-amber-400/60 bg-amber-400 px-2.5 py-0.5 shadow-md">
              <Crown className="h-2.5 w-2.5 text-[#1a0a14]" />
              <span className="text-[8px] font-black uppercase tracking-[0.15em] text-[#1a0a14]">
                {isTamil ? "தலைமை நிதியளிப்பாளர்" : "Title Sponsor"}
              </span>
            </div>
            {/* Logo + name row */}
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-amber-400/30 bg-white p-1.5 shadow-lg shadow-amber-900/30">
                <SponsorLogo name={titleSponsor.name} logoUrl={titleSponsor.logoUrl} className="h-full w-full" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-[17px] font-black leading-tight text-white drop-shadow-sm">
                  {titleSponsor.name}
                </p>
                {(titleSponsor.tagline ?? titleSponsor.highlight) && (
                  <p className="truncate text-[10px] font-medium leading-snug text-amber-300/80 mt-0.5">
                    {titleSponsor.tagline ?? titleSponsor.highlight}
                  </p>
                )}
              </div>
            </div>
            {/* Explore CTA */}
            <div className="mt-2.5 inline-flex items-center gap-1 self-start rounded-lg bg-amber-400/15 border border-amber-400/30 px-2.5 py-1 transition-all group-hover:bg-amber-400/25">
              <span className="text-[9px] font-black uppercase tracking-[0.15em] text-amber-300">
                {isTamil ? "ஆராய" : "Explore"}
              </span>
              <ChevronRight className="h-3 w-3 text-amber-300 transition-transform group-hover:translate-x-0.5" />
            </div>
          </div>

          {/* Owner photo */}
          {titleSponsor.owner?.photoUrl && (
            <div className="relative shrink-0 self-stretch" style={{ width: "100px" }}>
              <img
                src={titleSponsor.owner.photoUrl}
                alt={titleSponsor.owner.name}
                className="absolute inset-0 h-full w-full object-cover object-top"
              />
              <div
                className="absolute inset-y-0 left-0 w-6"
                style={{ background: "linear-gradient(to right, #1a0a14, transparent)" }}
              />
            </div>
          )}
        </button>
      )}

      {/* ── 2. CO-SPONSORS — 4 columns ── */}
      {part === "top" && limitedCo.length > 0 && (
        <div
          className="sponsor-fade-up mb-4 overflow-hidden rounded-2xl border border-[#E63946]/25 bg-gradient-to-br from-[#1a0a14] via-[#2a0d14] to-[#1a0a14]"
          style={{ animationDelay: "120ms" }}
        >
          {/* Header */}
          <div className="flex items-center gap-2 px-3 pt-2 pb-1">
            <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#E63946]">
              <Star className="h-2 w-2 text-white" />
            </span>
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#E63946]">
              {isTamil ? "இணை நிறுவனர்" : "Co-Sponsors"}
            </span>
            <div className="h-px flex-1 bg-[#E63946]/20" />
          </div>
          {/* Strict 4-column grid */}
          <div className="grid pb-2 px-2 gap-1.5" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
            {limitedCo.map((s, i) => (
              <button
                key={`co-${s.name}`}
                type="button"
                onClick={() => onNavigate(s)}
                className="sponsor-fade-in group flex flex-col items-center gap-1 rounded-lg border border-[#E63946]/15 bg-white/5 px-1 py-1.5 transition-all hover:border-[#E63946]/45 hover:bg-[#E63946]/10 min-w-0"
                style={{ animationDelay: `${200 + i * 60}ms` }}
              >
                <div className="relative">
                  <div className="absolute -inset-0.5 rounded-full bg-gradient-to-br from-[#E63946] to-rose-400 opacity-30 blur-[2px]" />
                  <div className="relative h-8 w-8 overflow-hidden rounded-full border border-white/15 bg-white/5">
                    {s.owner?.photoUrl ? (
                      <img src={s.owner.photoUrl} alt={s.owner.name} className="h-full w-full object-cover" style={{ objectPosition: "center 10%" }} />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-[#E63946]/20 p-1">
                        <SponsorLogo name={s.name} logoUrl={s.logoUrl} className="h-full w-full" />
                      </div>
                    )}
                  </div>
                  <div className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full border-2 border-[#1a0a14] bg-white p-[1.5px] shadow">
                    <SponsorLogo name={s.name} logoUrl={s.logoUrl} className="h-full w-full" />
                  </div>
                </div>
                <span className="w-full truncate text-[7px] font-semibold text-white/60 whitespace-nowrap group-hover:text-white text-center leading-tight mt-0.5">
                  {s.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── 3. ASSOCIATE SPONSORS — bottom marquee ──
           FIX: uses allAssoc (no slice cap) so every associate sponsor
           including newly added ones always appears here.
      ── */}
      {part === "bottom" && allAssoc.length > 0 && (
        <div
          className="sponsor-fade-up mb-5 overflow-hidden rounded-xl border border-white/8 bg-gradient-to-r from-[#18080f] to-[#1e0c14]"
          style={{ animationDelay: "0ms" }}
        >
          <div className="flex items-center gap-2 px-4 pt-2.5 pb-1.5">
            <Trophy className="h-3 w-3 text-white/30 shrink-0" />
            <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/40">
              {isTamil ? "இணை நிதியளிப்பாளர்" : "Associate Sponsors"}
            </span>
            <div className="h-px flex-1 bg-white/8" />
          </div>
          <div className="relative overflow-hidden pb-2.5">
            {/* Duplicate the list once for seamless looping */}
            <div className="assoc-marquee-track gap-2 px-4">
              {[...allAssoc, ...allAssoc].map((s, idx) => (
                <button
                  key={`assoc-${s.name}-${idx}`}
                  type="button"
                  onClick={() => onNavigate(s)}
                  className="group flex shrink-0 items-center gap-2 rounded-lg border border-white/8 bg-white/4 px-2.5 py-1.5 transition-all hover:border-white/20 hover:bg-white/10"
                  style={{ width: "110px" }}
                >
                  <div className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-white/10 bg-white p-0.5 shadow">
                    <SponsorLogo name={s.name} logoUrl={s.logoUrl} className="h-full w-full" />
                    {s.owner?.photoUrl && (
                      <div className="absolute -bottom-1 -right-1 h-3.5 w-3.5 overflow-hidden rounded-full border border-[#1a0a14]">
                        <img src={s.owner.photoUrl} alt={s.owner.name} className="h-full w-full object-cover" style={{ objectPosition: "center 10%" }} />
                      </div>
                    )}
                  </div>
                  <span className="flex-1 truncate text-[9px] font-medium text-white/50 whitespace-nowrap group-hover:text-white/80 leading-tight">
                    {s.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

/* ══════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════ */
const NewsDetailsPopup = ({
  post,
  onClose,
  formatDate,
  language,
  autoOpenVideo = false,
}: NewsDetailsPopupProps) => {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [videoOpen, setVideoOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(null), 3000);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
  };

  // ✅ FIX: all filters normalised with toLowerCase().trim()
  //    so any future sponsor with slight capitalisation variation still shows up.
  const leftSponsors = sponsors
    .filter((s) => ["title", "co"].includes(s.category?.toLowerCase().trim()))
    .slice(0, 6);
  const rightSponsors = sponsors.filter(
    (s) => s.category?.toLowerCase().trim() === "associate"
  );
  const slideTitleSponsor =
    sponsors.find((s) => s.category?.toLowerCase().trim() === "title") ?? null;
  const slideCoSponsors = sponsors.filter(
    (s) => s.category?.toLowerCase().trim() === "co"
  );
  // ✅ FIX: no slice — all associate sponsors flow into the slide
  const slideAssocSponsors = sponsors.filter(
    (s) => s.category?.toLowerCase().trim() === "associate"
  );

  const goToSponsor = (s: Sponsor) => {
    onClose();
    navigate(`/${getSponsorSlug(s.name)}`);
  };

  useEffect(() => {
    if (!post) return;
    window.requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: 0, behavior: "auto" });
    });
    setVideoOpen(autoOpenVideo);
  }, [post, autoOpenVideo]);

  useEffect(() => {
    if (!post) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (videoOpen) { setVideoOpen(false); return; }
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [post, onClose, videoOpen]);

  if (!post) return null;
  const isTamil = language === "ta";

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";
  const shareTitle = post.newsTitle[language] ?? "";
  const shareText = `${shareTitle}\n${shareUrl}`;

  const copyToClipboard = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareText);
        return true;
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = shareText;
        textArea.style.position = "fixed";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const successful = document.execCommand("copy");
        document.body.removeChild(textArea);
        return successful;
      }
    } catch (err) {
      console.error("Failed to copy text: ", err);
      return false;
    }
  };

  const handleNativeShare = async () => {
    await copyToClipboard();
    if (navigator.share) {
      try {
        await navigator.share({ title: shareTitle, text: shareTitle, url: shareUrl });
      } catch { /* cancelled */ }
    } else {
      showToast(isTamil ? "இணைப்பு மற்றும் செய்தி நகலெடுக்கப்பட்டது!" : "Link & content copied to clipboard!");
    }
  };

  const handleWhatsApp = () => {
    const text = encodeURIComponent(shareText);
    window.open(`https://wa.me/?text=${text}`, "_blank", "noopener,noreferrer");
  };

  const handleFacebookShare = () => {
    copyToClipboard();
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareTitle)}`;
    window.open(url, "_blank", "noopener,noreferrer");
    showToast(isTamil ? "செய்தி நகலெடுக்கப்பட்டது! பேஸ்புக்கில் ஒட்டவும்." : "Content copied! Ready to paste on Facebook.");
  };

  const handleInstagramShare = () => {
    copyToClipboard();
    showToast(isTamil ? "செய்தி நகலெடுக்கப்பட்டது! இன்ஸ்டாகிராமிற்கு செல்கிறது..." : "Content copied! Opening Instagram...");
    window.open("https://www.instagram.com/", "_blank", "noopener,noreferrer");
  };

  const facts = [
    { label: isTamil ? "இடம்" : "Venue", value: post.venue[language], Icon: MapPin },
  ];

  return (
    <>
      {/* ── Fixed left sponsor panel (desktop only) ── */}
      <div className="hidden lg:block">
        <LeftSponsorPanel sponsorList={leftSponsors} onNavigate={goToSponsor} />
      </div>

      {/* ── Fixed right sponsor panel (desktop only) ── */}
      <div className="hidden lg:block">
        <RightSponsorPanel sponsorList={rightSponsors} onNavigate={goToSponsor} />
      </div>

      {/* ── Main popup shell ── */}
      <div
        className="fixed inset-x-0 bottom-0 top-16 lg:top-20 z-[9999] bg-[#f7f3ee]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="news-detail-title"
      >
        <article className="flex h-full w-full flex-col overflow-hidden bg-[#f7f3ee] text-left">

          {/* TOP BAR */}
          <div className="shrink-0 border-b border-black/[0.08] bg-white shadow-sm">
            <style>{`@media(min-width:1024px){.topbar-row{padding-left:176px!important;padding-right:176px!important;}}`}</style>
            <div className="topbar-row flex w-full items-center justify-between gap-2 px-3 py-2.5">
              <button
                type="button"
                onClick={onClose}
                aria-label="Back to news"
                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-black/15 bg-white px-3 py-1.5 text-[12px] font-semibold text-gray-700 transition hover:bg-gray-50 hover:border-black/25"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                {isTamil ? "பின்" : "Back"}
              </button>
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                {/* Facebook Button */}
                <button
                  type="button"
                  onClick={handleFacebookShare}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#1877F2] px-2.5 py-1.5 text-[11px] sm:text-[12px] font-bold text-white transition-all duration-300 hover:bg-[#166FE5] hover:scale-105 active:scale-95 shadow-sm hover:shadow"
                  title="Share on Facebook"
                >
                  <Facebook className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Facebook</span>
                </button>
                
                {/* Instagram Button */}
                <button
                  type="button"
                  onClick={handleInstagramShare}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] px-2.5 py-1.5 text-[11px] sm:text-[12px] font-bold text-white transition-all duration-300 hover:opacity-90 hover:scale-105 active:scale-95 shadow-sm hover:shadow"
                  title="Share on Instagram"
                >
                  <Instagram className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Instagram</span>
                </button>

                {/* WhatsApp Button */}
                <button
                  type="button"
                  onClick={handleWhatsApp}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#25D366] px-2.5 py-1.5 text-[11px] sm:text-[12px] font-bold text-white transition-all duration-300 hover:bg-[#20ba5a] hover:scale-105 active:scale-95 shadow-sm hover:shadow"
                  title="Share on WhatsApp"
                >
                  <WhatsAppIcon className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">WhatsApp</span>
                </button>

                {/* Native Share Button */}
                <button
                  type="button"
                  onClick={handleNativeShare}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#E53E3E] px-2.5 py-1.5 text-[11px] sm:text-[12px] font-bold text-white transition-all duration-300 hover:bg-[#C53030] hover:scale-105 active:scale-95 shadow-sm hover:shadow"
                  title="Share / Copy Link"
                >
                  <Share2 className="h-3.5 w-3.5" />
                  <span>{isTamil ? "பகிர்" : "Share"}</span>
                </button>
              </div>
            </div>
          </div>

          {/* SCROLLABLE ARTICLE */}
          <div
            ref={scrollRef}
            className="main-scroll-area min-h-0 flex-1 overflow-y-auto"
            style={{
              marginLeft: "var(--sponsor-panel-w, 0px)",
              marginRight: "var(--sponsor-panel-w, 0px)",
              scrollbarWidth: "none",
            } as React.CSSProperties}
          >
            <style>{`
              @media (min-width: 1024px) { :root { --sponsor-panel-w: 160px; } }
              .main-scroll-area::-webkit-scrollbar { display: none; }
            `}</style>

            <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
              <div className="rounded-3xl bg-white p-5 sm:p-8 shadow-xl border border-gray-100/80">

                {/* Category + Date */}
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  {post.category?.[language] && (
                    <span className="rounded-md bg-gradient-to-r from-[#1a0a14] to-[#3d1428] px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-white shadow-sm">
                      {post.category[language]}
                    </span>
                  )}
                  <span className="ml-auto flex items-center gap-1 text-[11px] font-medium text-gray-400">
                    <CalendarDays className="h-3 w-3" />
                    {formatDate(post.publishedAt)}
                  </span>
                </div>

                {/* Headline */}
                <h2
                  id="news-detail-title"
                  className="mb-5 font-black leading-[1.35] text-[clamp(20px,4.5vw,36px)] text-gray-900 tracking-tight"
                >
                  {post.newsTitle[language]}
                </h2>

                {/* Hero image */}
                <div className="mb-5 overflow-hidden rounded-2xl border border-black/[0.06] shadow-md">
                  <img
                    src={post.matchStoryImageUrl?.trim() || cricketBanner}
                    alt={post.matchStoryTitle[language] || "Match story"}
                    className="block w-full h-auto"
                    loading="lazy"
                  />
                </div>

                {/* Sponsor Slide — Title + Co (top) */}
                <SponsorSlide
                  titleSponsor={slideTitleSponsor}
                  coSponsors={slideCoSponsors}
                  associateSponsors={slideAssocSponsors}
                  isTamil={isTamil}
                  onNavigate={goToSponsor}
                  part="top"
                />

                {/* Video embed */}
                {post.mediaEmbedUrl?.trim() && (
                  <div className="mb-5 overflow-hidden rounded-2xl border border-black/[0.08] shadow-md">
                    <button
                      type="button"
                      onClick={() => setVideoOpen(true)}
                      aria-label={isTamil ? "வீடியோ திற" : "Play video"}
                      className="relative block aspect-video w-full overflow-hidden bg-black focus-visible:outline-none"
                    >
                      <iframe
                        className="pointer-events-none h-full w-full"
                        src={`${post.mediaEmbedUrl}?rel=0&controls=0&modestbranding=1`}
                        title={post.newsTitle[language]}
                        allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      />
                      <span className="absolute inset-0 flex items-center justify-center bg-black/40 transition hover:bg-black/25">
                        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-xl ring-4 ring-white/20">
                          <PlayCircle className="h-8 w-8 text-[#E63946]" />
                        </span>
                      </span>
                    </button>
                    <div className="flex items-center gap-2 bg-gradient-to-r from-amber-400 to-amber-300 px-4 py-2.5">
                      <PlayCircle className="h-3.5 w-3.5 text-amber-900" />
                      <span className="text-[11px] font-black uppercase tracking-[.08em] text-amber-900">
                        {isTamil ? "வீடியோ பார்க்க" : "Watch Highlights"}
                      </span>
                    </div>
                  </div>
                )}

                {/* KPI cards */}
                <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {facts.map(({ label, value, Icon }) => (
                    <div
                      key={label}
                      className="flex items-center gap-3 rounded-2xl border border-amber-100 bg-gradient-to-br from-[#FFF8F0] to-amber-50 px-4 py-3.5 shadow-sm"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 shadow-md">
                        <Icon className="h-4 w-4 text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="mb-0.5 text-[10px] font-black uppercase tracking-[.1em] text-amber-600/70">
                          {label}
                        </p>
                        <p className="break-words text-[13px] font-bold leading-snug text-gray-900">
                          {value}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Body */}
                <p className="whitespace-pre-line text-[16px] md:text-[17px] leading-[1.95] text-gray-700">
                  {post.newsDescription[language]}
                </p>

                {/* Sponsor Slide — Associate (bottom marquee) */}
                <div className="mt-6">
                  <SponsorSlide
                    titleSponsor={slideTitleSponsor}
                    coSponsors={slideCoSponsors}
                    associateSponsors={slideAssocSponsors}
                    isTamil={isTamil}
                    onNavigate={goToSponsor}
                    part="bottom"
                  />
                </div>

              </div>
            </div>

          </div>

        </article>
      </div>

      {/* FULLSCREEN VIDEO */}
      {videoOpen && post && (
        <div
          className="fixed inset-0 z-[10001] flex flex-col bg-black"
          role="dialog"
          aria-modal="true"
        >
          <div className="flex h-12 shrink-0 items-center justify-between border-b border-white/10 px-4">
            <p className="line-clamp-1 text-sm font-semibold text-white">
              {post.newsTitle[language]}
            </p>
            <button
              type="button"
              onClick={() => setVideoOpen(false)}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white transition hover:bg-white/20"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="flex min-h-0 flex-1 items-center">
            <iframe
              className="h-full w-full"
              src={`${post.mediaEmbedUrl}?autoplay=1&rel=0`}
              title={post.newsTitle[language]}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <>
          <style>{`
            @keyframes slideUpFade {
              from { opacity: 0; transform: translate(-50%, 20px); }
              to   { opacity: 1; transform: translate(-50%, 0); }
            }
            .toast-animate {
              animation: slideUpFade 0.35s cubic-bezier(0.22, 1, 0.36, 1) forwards;
            }
          `}</style>
          <div className="fixed bottom-5 left-1/2 z-[10002] flex items-center gap-2 rounded-xl bg-gray-900/95 px-4 py-3 text-sm font-semibold text-white shadow-2xl backdrop-blur-sm toast-animate">
            <Sparkles className="h-4 w-4 text-amber-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        </>
      )}
    </>
  );
};

export default NewsDetailsPopup;