// import {
//   ArrowLeft,
//   Globe,
//   Mail,
//   MapPin,
//   Phone,
//   Sparkles,
//   CheckCircle2,
//   Building2,
//   Tag,
//   ExternalLink,
//   Quote,
//   Award,
// } from "lucide-react";
// import { useNavigate } from "react-router-dom";
// import SponsorLogo from "./SponsorLogo";
// import type { Sponsor } from "@/data/sponsors";

// type Props = { sponsor: Sponsor };

// const SponsorPortfolio = ({ sponsor }: Props) => {
//   const navigate = useNavigate();

//   return (
//     <div className="min-h-screen bg-gradient-to-b from-[#0b0612] via-[#120819] to-[#0b0612] text-white">
//       {/* HERO */}
//       <div className="relative overflow-hidden border-b border-white/5">
//         <div className="absolute inset-0 pointer-events-none">
//           <div className="absolute -top-40 left-1/3 h-[28rem] w-[28rem] rounded-full bg-[#E63946]/25 blur-3xl" />
//           <div className="absolute -bottom-20 right-0 h-[24rem] w-[24rem] rounded-full bg-amber-500/15 blur-3xl" />
//           <div
//             className="absolute inset-0 opacity-[0.04]"
//             style={{
//               backgroundImage:
//                 "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
//               backgroundSize: "32px 32px",
//             }}
//           />
//         </div>

//         <div className="relative px-6 py-12 mx-auto max-w-7xl md:py-16">
//           <button
//             onClick={() => navigate(-1)}
//             className="inline-flex items-center gap-2 px-4 py-2 mb-8 text-sm transition-colors border rounded-full border-white/10 bg-white/5 text-white/80 backdrop-blur hover:bg-white/10"
//           >
//             <ArrowLeft className="w-4 h-4" /> Back to sponsors
//           </button>

//           <div className="grid gap-10 md:grid-cols-[1.4fr_1fr] md:items-center">
//             <div>
//               <div className="flex flex-wrap items-center gap-2 mb-5">
//                 <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-200 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-[#1a0a14]">
//                   <Award className="w-3 h-3" /> {sponsor.tier}
//                 </span>
//               </div>

//               {/* logo plate */}
//               {sponsor.logoUrl && (
//                 <div className="inline-flex items-center h-24 p-3 mb-6 bg-white border shadow-2xl rounded-2xl border-white/10">
//                   <SponsorLogo
//                     name={sponsor.name}
//                     logoUrl={sponsor.logoUrl}
//                     className="h-full"
//                   />
//                 </div>
//               )}

//               <h1 className="text-4xl font-black leading-[1.05] tracking-tight md:text-6xl">
//                 <span className="text-transparent bg-gradient-to-r from-white via-amber-100 to-white bg-clip-text">
//                   {sponsor.name}
//                 </span>
//               </h1>

//               {sponsor.tagline && (
//                 <p className="flex items-start gap-2 mt-4 text-base italic text-amber-200/85 md:text-lg">
//                   <Quote className="flex-shrink-0 w-4 h-4 mt-1 text-amber-300/70" />
//                   {sponsor.tagline}
//                 </p>
//               )}

//               <div className="flex flex-wrap items-center mt-5 text-sm gap-x-4 gap-y-2 text-white/70">
//                 <span className="inline-flex items-center gap-1.5">
//                   <Building2 className="w-4 h-4 text-amber-300/80" />
//                   {sponsor.company.industry}
//                 </span>
//                 <span className="text-white/20">•</span>
//                 <span className="inline-flex items-center gap-1.5">
//                   <MapPin className="w-4 h-4 text-amber-300/80" />
//                   {sponsor.company.location}
//                 </span>
//                 {sponsor.company.foundedYear && (
//                   <>
//                     <span className="text-white/20">•</span>
//                     <span>Est. {sponsor.company.foundedYear}</span>
//                   </>
//                 )}
//               </div>
//             </div>

//             {/* hero founder card */}
//             {sponsor.owner.photoUrl && (
//               <div className="relative w-full max-w-sm mx-auto">
//                 <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-amber-400/30 via-[#E63946]/30 to-amber-400/20 blur-2xl" />
//                 <div className="relative overflow-hidden rounded-3xl border border-amber-300/30 bg-gradient-to-br from-white/[0.06] to-white/[0.02] p-2 shadow-2xl">
//                   <div className="relative aspect-[4/5] overflow-hidden rounded-2xl">
//                     <img
//                       src={sponsor.owner.photoUrl}
//                       alt={sponsor.owner.name}
//                       className="absolute inset-0 object-cover w-full h-full"
//                     />
//                     <div className="absolute inset-0 bg-gradient-to-t from-[#1a0a14] via-[#1a0a14]/30 to-transparent" />
//                     <div className="absolute bottom-0 left-0 right-0 p-5">
//                       <div className="text-[10px] uppercase tracking-[0.25em] text-amber-300">
//                         {sponsor.owner.role}
//                       </div>
//                       <div className="mt-1 text-2xl font-bold">
//                         {sponsor.owner.name}
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             )}
//           </div>
//         </div>
//       </div>

//       {/* BODY */}
//       <div className="px-6 mx-auto max-w-7xl py-14">
//         <div className="grid gap-8 lg:grid-cols-[1.6fr_1fr]">
//           {/* MAIN */}
//           <div className="space-y-6">
//             <Card title="About">
//               <p className="text-sm leading-relaxed text-white/75 md:text-lg">
//                 {sponsor.description}
//               </p>
//             </Card>

//             {sponsor.benefits?.length > 0 && (
//               <Card title="Key Benefits">
//                 <ul className="grid gap-2.5 sm:grid-cols-2">
//                   {sponsor.benefits.map((b) => (
//                     <Bullet key={b}>{b}</Bullet>
//                   ))}
//                 </ul>
//               </Card>
//             )}

//             {sponsor.services && sponsor.services.length > 0 && (
//               <Card title="Services">
//                 <ul className="grid gap-2.5 sm:grid-cols-2 text-lg">
//                   {sponsor.services.map((s) => (
//                     <Bullet key={s}>{s}</Bullet>
//                   ))}
//                 </ul>
//               </Card>
//             )}

//             {sponsor.offers && sponsor.offers.length > 0 && (
//               <Card title="Offers">
//                 <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
//                   {sponsor.offers.map((o) => (
//                     <div
//                       key={o.label}
//                       className="p-4 border rounded-xl border-amber-300/20 bg-gradient-to-br from-amber-300/10 to-transparent"
//                     >
//                       <div className="text-[10px] uppercase tracking-[0.2em] text-amber-300/80">
//                         {o.label}
//                       </div>
//                       <div className="mt-1 text-lg font-bold text-white">
//                         {o.value}
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               </Card>
//             )}

//             {sponsor.whyChoose && sponsor.whyChoose.length > 0 && (
//               <Card title="Why Choose Us">
//                 <ul className="grid gap-2.5 sm:grid-cols-2">
//                   {sponsor.whyChoose.map((w) => (
//                     <Bullet key={w}>{w}</Bullet>
//                   ))}
//                 </ul>
//               </Card>
//             )}

//             {sponsor.visibility && sponsor.visibility.length > 0 && (
//               <Card title="Sponsorship Visibility">
//                 <ul className="grid gap-2.5 sm:grid-cols-2">
//                   {sponsor.visibility.map((v) => (
//                     <Bullet key={v}>{v}</Bullet>
//                   ))}
//                 </ul>
//               </Card>
//             )}
//           </div>

//           {/* SIDE */}
//           <aside className="space-y-6">
//             {/* MODERN FOUNDER CARD */}
//             <div className="group relative overflow-hidden rounded-3xl border border-amber-300/20 bg-gradient-to-br from-[#1a0a14] via-[#2a0f1f] to-[#1a0a14] p-6 shadow-[0_20px_60px_-20px_rgba(230,57,70,0.5)]">
//               <div className="absolute w-48 h-48 rounded-full pointer-events-none -top-20 -right-20 bg-amber-400/20 blur-3xl" />
//               <div className="pointer-events-none absolute -bottom-20 -left-20 h-48 w-48 rounded-full bg-[#E63946]/20 blur-3xl" />

//               <div className="relative flex items-center justify-between">
//                 <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] text-amber-200">
//                   <Sparkles className="w-3 h-3" /> Founder
//                 </span>
//                 <Quote className="w-5 h-5 text-amber-300/40" />
//               </div>

//               <div className="relative flex flex-col items-center mt-5 text-center">
//                 <div className="relative">
//                   <div className="absolute -inset-2 rounded-full bg-gradient-to-br from-amber-300 via-[#E63946] to-amber-400 opacity-80 blur-md" />
//                   <div className="relative h-28 w-28 overflow-hidden rounded-full border-[3px] border-amber-300/60 bg-white/5 shadow-2xl">
//                     {sponsor.owner.photoUrl ? (
//                       <img
//                         src={sponsor.owner.photoUrl}
//                         alt={sponsor.owner.name}
//                         className="object-cover object-top w-full h-full"
//                       />
//                     ) : (
//                       <div className="flex items-center justify-center w-full h-full text-3xl font-bold text-white/70">
//                         {sponsor.owner.name[0]}
//                       </div>
//                     )}
//                   </div>
//                 </div>

//                 <h4 className="mt-4 text-xl font-bold text-white">
//                   {sponsor.owner.name}
//                 </h4>
//                 <div className="mt-0.5 text-[15px] uppercase tracking-[0.2em] text-amber-300/90">
//                   {sponsor.owner.role}
//                 </div>
//                 <p className="mt-3 text-lg leading-relaxed text-white/65">
//                   {sponsor.owner.bio}
//                 </p>
//               </div>
//             </div>

//             {/* COMPANY */}
//             <Card title="Company">
//               {sponsor.company.logoUrl && (
//                 <div className="inline-flex items-center h-16 p-2 mb-3 bg-white border rounded-xl border-white/10">
//                   <SponsorLogo
//                     name={sponsor.name}
//                     logoUrl={sponsor.company.logoUrl}
//                     className="h-full"
//                   />
//                 </div>
//               )}
//               <p className="text-lg text-white/70">{sponsor.company.summary}</p>
//             </Card>

//             {/* CONTACT */}
//             {sponsor.contact && (
//               <Card title="Contact">
//                 <div className="space-y-3 text-lg">
//                   {sponsor.contact.address && (
//                     <Row icon={MapPin}>{sponsor.contact.address}</Row>
//                   )}
//                   {sponsor.contact.phones?.map((p) => (
//                     <Row icon={Phone} key={p}>
//                       <a
//                         href={`tel:${p.replace(/\s/g, "")}`}
//                         className="hover:text-amber-300"
//                       >
//                         {p}
//                       </a>
//                     </Row>
//                   ))}
//                   {sponsor.contact.email && (
//                     <Row icon={Mail}>
//                       <a
//                         href={`mailto:${sponsor.contact.email}`}
//                         className="hover:text-amber-300"
//                       >
//                         {sponsor.contact.email}
//                       </a>
//                     </Row>
//                   )}
//                   {sponsor.contact.website && (
//                     <Row icon={Globe}>
//                       <a
//                         href={sponsor.contact.website}
//                         target="_blank"
//                         rel="noreferrer"
//                         className="inline-flex items-center gap-1 hover:text-amber-300"
//                       >
//                         Visit website <ExternalLink className="w-3 h-3" />
//                       </a>
//                     </Row>
//                   )}
//                   {sponsor.contact.socials &&
//                     sponsor.contact.socials.length > 0 && (
//                       <div className="flex flex-wrap gap-2 pt-1">
//                         {sponsor.contact.socials.map((s) => (
//                           <a
//                             key={s.label}
//                             href={s.url}
//                             target="_blank"
//                             rel="noreferrer"
//                             className="px-3 py-1 text-xs border rounded-full border-white/10 bg-white/5 text-white/80 hover:border-amber-300/40 hover:bg-amber-300/10 hover:text-amber-200"
//                           >
//                             {s.label}
//                           </a>
//                         ))}
//                       </div>
//                     )}
//                 </div>
//               </Card>
//             )}

//             {sponsor.focusAreas?.length || sponsor.relatedTopics?.length ? (
//               <Card title="Focus Areas">
//                 <div className="flex flex-wrap gap-2">
//                   {(sponsor.focusAreas ?? sponsor.relatedTopics).map((t) => (
//                     <span
//                       key={t}
//                       className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-lg text-white/75"
//                     >
//                       <Tag className="w-3 h-3 text-amber-300/70" /> {t}
//                     </span>
//                   ))}
//                 </div>
//               </Card>
//             ) : null}
//           </aside>
//         </div>
//       </div>
//     </div>
//   );
// };

// const Card = ({
//   title,
//   children,
// }: {
//   title: string;
//   children: React.ReactNode;
// }) => (
//   <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur">
//     <h3 className="mb-4 text-sm font-bold uppercase tracking-[0.18em] text-amber-200/90">
//       {title}
//     </h3>
//     {children}
//   </section>
// );

// const Bullet = ({ children }: { children: React.ReactNode }) => (
//   <li className="flex items-start gap-2 text-lg text-white/75">
//     <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-300" />
//     <span>{children}</span>
//   </li>
// );

// const Row = ({
//   icon: Icon,
//   children,
// }: {
//   icon: React.ElementType;
//   children: React.ReactNode;
// }) => (
//   <div className="flex items-start gap-3 text-sm text-white/75">
//     <Icon className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-300/80" />
//     <div className="flex-1 min-w-0 break-words">{children}</div>
//   </div>
// );

// export default SponsorPortfolio;
































import {
  ArrowLeft,
  Globe,
  Mail,
  MapPin,
  Phone,
  Sparkles,
  CheckCircle2,
  Building2,
  Tag,
  ExternalLink,
  Quote,
  Award,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import SponsorLogo from "./SponsorLogo";
import type { Sponsor } from "@/data/sponsors";

type Props = { sponsor: Sponsor };

const SponsorPortfolio = ({ sponsor }: Props) => {
  const navigate = useNavigate();

  const goBack = () => {
    navigate("/", { state: { sponsorCategory: sponsor.category } });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0b0612] via-[#120819] to-[#0b0612] text-white">
      {/* HERO */}
      <div className="relative overflow-hidden border-b border-white/5">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-40 left-1/3 h-[28rem] w-[28rem] rounded-full bg-[#E63946]/25 blur-3xl" />
          <div className="absolute -bottom-20 right-0 h-[24rem] w-[24rem] rounded-full bg-amber-500/15 blur-3xl" />
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
              backgroundSize: "32px 32px",
            }}
          />
        </div>

        <div className="relative px-6 py-12 mx-auto max-w-7xl md:py-16">
          <button
            onClick={goBack}
            className="inline-flex items-center gap-2 px-4 py-2 mb-8 text-sm transition-colors border rounded-full border-white/10 bg-white/5 text-white/80 backdrop-blur hover:bg-white/10"
          >
            <ArrowLeft className="w-4 h-4" /> Back to sponsors
          </button>

          <div className="grid gap-10 md:grid-cols-[1.4fr_1fr] md:items-center">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-5">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-200 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-[#1a0a14]">
                  <Award className="w-3 h-3" /> {sponsor.tier}
                </span>
              </div>

              {/* logo plate */}
              {sponsor.logoUrl && (
                <div className="inline-flex items-center h-24 p-3 mb-6 bg-white border shadow-2xl rounded-2xl border-white/10">
                  <SponsorLogo
                    name={sponsor.name}
                    logoUrl={sponsor.logoUrl}
                    className="h-full"
                  />
                </div>
              )}

              <h1 className="text-4xl font-black leading-[1.05] tracking-tight md:text-6xl">
                <span className="text-transparent bg-gradient-to-r from-white via-amber-100 to-white bg-clip-text">
                  {sponsor.name}
                </span>
              </h1>

              {sponsor.tagline && (
                <p className="flex items-start gap-2 mt-4 text-base italic text-amber-200/85 md:text-lg">
                  <Quote className="flex-shrink-0 w-4 h-4 mt-1 text-amber-300/70" />
                  {sponsor.tagline}
                </p>
              )}

              <div className="flex flex-wrap items-center mt-5 text-sm gap-x-4 gap-y-2 text-white/70">
                <span className="inline-flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-amber-300/80" />
                  {sponsor.company.industry}
                </span>
                <span className="text-white/20">•</span>
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-amber-300/80" />
                  {sponsor.company.location}
                </span>
                {sponsor.company.foundedYear && (
                  <>
                    <span className="text-white/20">•</span>
                    <span>Est. {sponsor.company.foundedYear}</span>
                  </>
                )}
              </div>
            </div>

            {/* hero founder card */}
            {sponsor.owner.photoUrl && (
              <div className="relative w-full max-w-sm mx-auto">
                <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-amber-400/30 via-[#E63946]/30 to-amber-400/20 blur-2xl" />
                <div className="relative overflow-hidden rounded-3xl border border-amber-300/30 bg-gradient-to-br from-white/[0.06] to-white/[0.02] p-2 shadow-2xl">
                  <div className="relative aspect-[4/5] overflow-hidden rounded-2xl">
                    <img
                      src={sponsor.owner.photoUrl}
                      alt={sponsor.owner.name}
                      className="absolute inset-0 object-cover w-full h-full"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#1a0a14] via-[#1a0a14]/30 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-5">
                      <div className="text-[10px] uppercase tracking-[0.25em] text-amber-300">
                        {sponsor.owner.role}
                      </div>
                      <div className="mt-1 text-2xl font-bold">
                        {sponsor.owner.name}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* BODY */}
      <div className="px-6 mx-auto max-w-7xl py-14">
        <div className="grid gap-8 lg:grid-cols-[1.6fr_1fr]">
          {/* MAIN */}
          <div className="space-y-6">
            <Card title="About">
              <p className="text-sm leading-relaxed text-white/75 md:text-lg">
                {sponsor.description}
              </p>
            </Card>

            {sponsor.benefits?.length > 0 && (
              <Card title="Key Benefits">
                <ul className="grid gap-2.5 sm:grid-cols-2">
                  {sponsor.benefits.map((b) => (
                    <Bullet key={b}>{b}</Bullet>
                  ))}
                </ul>
              </Card>
            )}

            {sponsor.services && sponsor.services.length > 0 && (
              <Card title="Services">
                <ul className="grid gap-2.5 sm:grid-cols-2 text-lg">
                  {sponsor.services.map((s) => (
                    <Bullet key={s}>{s}</Bullet>
                  ))}
                </ul>
              </Card>
            )}

            {sponsor.offers && sponsor.offers.length > 0 && (
              <Card title="Offers">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {sponsor.offers.map((o) => (
                    <div
                      key={o.label}
                      className="p-4 border rounded-xl border-amber-300/20 bg-gradient-to-br from-amber-300/10 to-transparent"
                    >
                      <div className="text-[10px] uppercase tracking-[0.2em] text-amber-300/80">
                        {o.label}
                      </div>
                      <div className="mt-1 text-lg font-bold text-white">
                        {o.value}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {sponsor.whyChoose && sponsor.whyChoose.length > 0 && (
              <Card title="Why Choose Us">
                <ul className="grid gap-2.5 sm:grid-cols-2">
                  {sponsor.whyChoose.map((w) => (
                    <Bullet key={w}>{w}</Bullet>
                  ))}
                </ul>
              </Card>
            )}

            {sponsor.visibility && sponsor.visibility.length > 0 && (
              <Card title="Sponsorship Visibility">
                <ul className="grid gap-2.5 sm:grid-cols-2">
                  {sponsor.visibility.map((v) => (
                    <Bullet key={v}>{v}</Bullet>
                  ))}
                </ul>
              </Card>
            )}
          </div>

          {/* SIDE */}
          <aside className="space-y-6">
            {/* MODERN FOUNDER CARD */}
            <div className="group relative overflow-hidden rounded-3xl border border-amber-300/20 bg-gradient-to-br from-[#1a0a14] via-[#2a0f1f] to-[#1a0a14] p-6 shadow-[0_20px_60px_-20px_rgba(230,57,70,0.5)]">
              <div className="absolute w-48 h-48 rounded-full pointer-events-none -top-20 -right-20 bg-amber-400/20 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-20 -left-20 h-48 w-48 rounded-full bg-[#E63946]/20 blur-3xl" />

              <div className="relative flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] text-amber-200">
                  <Sparkles className="w-3 h-3" /> Founder
                </span>
                <Quote className="w-5 h-5 text-amber-300/40" />
              </div>

              <div className="relative flex flex-col items-center mt-5 text-center">
                <div className="relative">
                  <div className="absolute -inset-2 rounded-full bg-gradient-to-br from-amber-300 via-[#E63946] to-amber-400 opacity-80 blur-md" />
                  <div className="relative h-28 w-28 overflow-hidden rounded-full border-[3px] border-amber-300/60 bg-white/5 shadow-2xl">
                    {sponsor.owner.photoUrl ? (
                      <img
                        src={sponsor.owner.photoUrl}
                        alt={sponsor.owner.name}
                        className="object-cover object-top w-full h-full"
                      />
                    ) : (
                      <div className="flex items-center justify-center w-full h-full text-3xl font-bold text-white/70">
                        {sponsor.owner.name[0]}
                      </div>
                    )}
                  </div>
                </div>

                <h4 className="mt-4 text-xl font-bold text-white">
                  {sponsor.owner.name}
                </h4>
                <div className="mt-0.5 text-[15px] uppercase tracking-[0.2em] text-amber-300/90">
                  {sponsor.owner.role}
                </div>
                <p className="mt-3 text-lg leading-relaxed text-white/65">
                  {sponsor.owner.bio}
                </p>
              </div>
            </div>

            {/* COMPANY */}
            <Card title="Company">
              {sponsor.company.logoUrl && (
                <div className="inline-flex items-center h-16 p-2 mb-3 bg-white border rounded-xl border-white/10">
                  <SponsorLogo
                    name={sponsor.name}
                    logoUrl={sponsor.company.logoUrl}
                    className="h-full"
                  />
                </div>
              )}
              <p className="text-lg text-white/70">{sponsor.company.summary}</p>
            </Card>

            {/* CONTACT */}
            {sponsor.contact && (
              <Card title="Contact">
                <div className="space-y-3 text-lg">
                  {sponsor.contact.address && (
                    <Row icon={MapPin}>{sponsor.contact.address}</Row>
                  )}
                  {sponsor.contact.phones?.map((p) => (
                    <Row icon={Phone} key={p}>
                      <a
                        href={`tel:${p.replace(/\s/g, "")}`}
                        className="hover:text-amber-300"
                      >
                        {p}
                      </a>
                    </Row>
                  ))}
                  {sponsor.contact.email && (
                    <Row icon={Mail}>
                      <a
                        href={`mailto:${sponsor.contact.email}`}
                        className="hover:text-amber-300"
                      >
                        {sponsor.contact.email}
                      </a>
                    </Row>
                  )}
                  {sponsor.contact.website && (
                    <Row icon={Globe}>
                      <a
                        href={sponsor.contact.website}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 hover:text-amber-300"
                      >
                        Visit website <ExternalLink className="w-3 h-3" />
                      </a>
                    </Row>
                  )}
                  {sponsor.contact.socials &&
                    sponsor.contact.socials.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {sponsor.contact.socials.map((s) => (
                          <a
                            key={s.label}
                            href={s.url}
                            target="_blank"
                            rel="noreferrer"
                            className="px-3 py-1 text-xs border rounded-full border-white/10 bg-white/5 text-white/80 hover:border-amber-300/40 hover:bg-amber-300/10 hover:text-amber-200"
                          >
                            {s.label}
                          </a>
                        ))}
                      </div>
                    )}
                </div>
              </Card>
            )}

            {sponsor.focusAreas?.length || sponsor.relatedTopics?.length ? (
              <Card title="Focus Areas">
                <div className="flex flex-wrap gap-2">
                  {(sponsor.focusAreas ?? sponsor.relatedTopics).map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-lg text-white/75"
                    >
                      <Tag className="w-3 h-3 text-amber-300/70" /> {t}
                    </span>
                  ))}
                </div>
              </Card>
            ) : null}
          </aside>
        </div>
      </div>
    </div>
  );
};

const Card = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur">
    <h3 className="mb-4 text-sm font-bold uppercase tracking-[0.18em] text-amber-200/90">
      {title}
    </h3>
    {children}
  </section>
);

const Bullet = ({ children }: { children: React.ReactNode }) => (
  <li className="flex items-start gap-2 text-lg text-white/75">
    <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-300" />
    <span>{children}</span>
  </li>
);

const Row = ({
  icon: Icon,
  children,
}: {
  icon: React.ElementType;
  children: React.ReactNode;
}) => (
  <div className="flex items-start gap-3 text-sm text-white/75">
    <Icon className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-300/80" />
    <div className="flex-1 min-w-0 break-words">{children}</div>
  </div>
);

export default SponsorPortfolio;