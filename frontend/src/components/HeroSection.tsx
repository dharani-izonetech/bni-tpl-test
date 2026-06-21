// HEROSECTION
import batsmanImage from "@/assets/images/1c.png";
import ballImage from "@/assets/images/2c.png";
import heroBgTexture from "@/assets/images/bg1.png";
import valueDesign from "@/assets/images/5c.png";
import sozoLogo from "@/assets/sponsors/sozo-logo-bg.png";
import {
  Users,
  TrendingUp,
  Star,
  Handshake,
  Trophy,
  TrophyIcon,
  MapPin,
} from "lucide-react";
import { CalendarDays, Tv } from "lucide-react";
import { useNavigate } from "react-router-dom";
const HeroSection = () => {
  const navigate = useNavigate();
  return (
    <>
      {/* ===================================================== */}
      {/* DESKTOP HERO SECTION */}
      {/* Visible only from md screens and above */}
      {/* ===================================================== */}
      <section
        className="relative hidden min-h-[92vh] overflow-hidden bg-center bg-no-repeat bg-cover md:flex"
        style={{
          backgroundImage: `url(${heroBgTexture})`,
          backgroundSize: "cover",
          backgroundPosition: "center center",
        }}
      >
        {/* ===================================================== */}
        {/* BACKGROUND OVERLAY */}
        {/* ===================================================== */}
        <div
          className="
    absolute
    inset-0
    z-0
    bg-[#EEEAE4]/15
    backdrop-blur-[1px]
    
    
  "
        />
        {/* SOZO SOLAR ZOLUTIONS LOGO */}
        <div className="absolute z-20 flex flex-col items-center -translate-x-1/2 pointer-events-none top-4 left-1/2">
          <img
            src={sozoLogo}
            alt="SOZO Solar Zolutions"
            className="w-[140px] h-auto object-contain"
          />
          <div className="flex items-center gap-2">
            <div className="h-[2px] w-20 bg-gradient-to-r from-transparent via-[#CFA150] to-[#CFA150]" />
            <p
              className="
        text-[14px]
        font-bold
        tracking-[2px]
        text-[#064C8F]
        uppercase
        whitespace-nowrap
      "
            >
              PRESENTS
            </p>
            <div className="h-[2px] w-20 bg-gradient-to-l from-transparent via-[#CFA150] to-[#CFA150]" />
          </div>
        </div>
        {/* REGISTER BUTTON */}
        <a
          href="https://register.bnitpl2026.in/"
          target="_blank"
          rel="noopener noreferrer"
          className="
    absolute
    top-6
    right-6
    z-40
    flex
    items-center
    justify-center
    px-6
    py-3
    rounded-xl
    font-bold
    tracking-wide
    text-white
    bg-[#B31217]
    hover:bg-[#8F0E12]
    shadow-lg
    transition-all
    duration-300
    hover:scale-105
  "
        >
          Register Now
        </a>
        {/* ===================================================== */}
        {/* BALL IMAGE - TOP RIGHT */}
        {/* ===================================================== */}
        <img
          src={ballImage}
          alt="Cricket Ball"
          className="
      absolute
      top-24
      right-6
      w-[230px]
      z-20
      object-contain
      rotate-[-6deg] animate-fade-up"
          style={{ animationDelay: "1100ms" }}
        />
        {/* ===================================================== */}
        {/* BATSMAN IMAGE - LEFT SIDE */}
        {/* ===================================================== */}
        <img
          src={batsmanImage}
          alt="Batsman"
          className="
      absolute
      left-[68px]
      bottom-[132px]
      w-[300px]
      z-10
      object-contain animate-fade-up"
          style={{ animationDelay: "1000ms" }}
        />
        {/* ===================================================== */}
        {/* MAIN CONTENT */}
        {/* ===================================================== */}
        <div className="relative bottom-0 z-30 flex flex-col items-center justify-center w-full px-10 text-center pt-28">
          {/* ===================================================== */}
          {/* MAIN TITLE */}
          {/* ===================================================== */}
          <div
            className="leading-[0.9] ml-20 text-left animate-fade-up ease-in-out"
            style={{ animationDelay: "900ms" }}
          >
            {/* TOP TITLE */}
            <h1
              className="
          text-[130px]
          font-black
          uppercase
          tracking-[10px]
          text-[#D91F1F]
          luxury-fill-text 
        "
            >
              BNI - TPL 2026
            </h1>
            {/* ===================================================== */}
            {/* SUB TITLE */}
            {/* ===================================================== */}
            <h2
              className="
          mt-6
          text-[79px]
          font-black
          uppercase
          tracking-[5px]
          text-[#4E4B48]
        "
            >
              TRICHY PREMIER LEAGUE
            </h2>
          </div>
          {/* ===================================================== */}
          {/* TAGLINE */}
          {/* ===================================================== */}
          <div
            className="flex items-center justify-center gap-4 mt-5 ml-16 animate-fade-up"
            style={{ animationDelay: "1200ms" }}
          >
            {/* Left Line */}
            <div className="w-20 h-[2px] bg-[#CFA150]" />
            {/* Left Dot */}
            <div className="w-2 h-2 rounded-full bg-[#CFA150]" />
            {/* Text */}
            <p
              className="
          text-[16px]
          font-bold
          tracking-[7px]
          text-[#2E2723]
          font-inter 
        "
            >
              Building Business Beyond Boundaries
            </p>
            {/* Right Dot */}
            <div className="w-2 h-2 rounded-full bg-[#CFA150]" />
            {/* Right Line */}
            <div className="w-20 h-[2px] bg-[#CFA150]" />
          </div>
          {/* ===================================================== */}
          {/* BNI VALUES SECTION */}
          {/* ===================================================== */}
          <div
            className="flex flex-col items-center mt-2 ml-8 animate-fade-up"
            style={{ animationDelay: "1300ms" }}
          >
            {/* Top Ornament */}
            <img
              src={valueDesign}
              alt="Design"
              className="w-[220px] object-contain mb-2 opacity-90 mt-4"
            />
            {/* Values Row */}
            <div className="flex items-center justify-center ml-8">
              {/* Item 1 */}
              <div className="flex items-center gap-4 px-8">
                <div className="flex items-center justify-center w-14 h-14 rounded-full border-2 border-[#CFA150]">
                  <Users className="w-7 h-7 text-[#0F4A34]" />
                </div>
                <div className="text-left">
                  <p className="text-[18px] font-bold text-[#0F4A34] leading-none">
                    BUILDING
                  </p>
                  <p className="text-[18px] font-bold text-[#2E2723]">
                    CONNECTIONS
                  </p>
                </div>
              </div>
              {/* Divider */}
              <div className="w-px h-16 bg-[#CFA150]" />
              {/* Item 2 */}
              <div className="flex items-center gap-4 px-8">
                <div className="flex items-center justify-center w-14 h-14 rounded-full border-2 border-[#CFA150]">
                  <TrendingUp className="w-7 h-7 text-[#CFA150]" />
                </div>
                <div className="text-left">
                  <p className="text-[18px] font-bold text-[#0F4A34] leading-none">
                    GROWING
                  </p>
                  <p className="text-[18px] font-bold text-[#2E2723]">
                    TOGETHER
                  </p>
                </div>
              </div>
              {/* Divider */}
              <div className="w-px h-16 bg-[#CFA150]" />
              {/* Item 3 */}
              <div className="flex items-center gap-4 px-8">
                <div className="flex items-center justify-center w-14 h-14 rounded-full border-2 border-[#CFA150]">
                  <Star className="w-7 h-7 text-[#CFA150]" />
                </div>
                <div className="text-left">
                  <p className="text-[18px] font-bold text-[#0F4A34] leading-none">
                    CREATING
                  </p>
                  <p className="text-[18px] font-bold text-[#2E2723]">
                    SUCCESS
                  </p>
                </div>
              </div>
              {/* Divider */}
              <div className="w-px h-16 bg-[#CFA150]" />
              {/* Item 4 */}
              <div className="flex items-center gap-4 px-8">
                <div className="flex items-center justify-center w-14 h-14 rounded-full border-2 border-[#CFA150]">
                  <Handshake className="w-7 h-7 text-[#0F4A34]" />
                </div>
                <div className="leading-tight text-left">
                  <p className="text-[18px] font-bold text-[#0F4A34]">
                    ONE TEAM.
                  </p>
                  <p className="text-[18px] font-bold text-[#2E2723]">
                    ONE DREAM.
                  </p>
                  <p className="text-[18px] font-bold text-[#2E2723]">
                    LIMITLESS IMPACT.
                  </p>
                </div>
              </div>
            </div>
            {/* Bottom Ornament */}
            <img
              src={valueDesign}
              alt="Design"
              className="w-[220px] object-contain mt-1 opacity-90"
            />
          </div>
          {/* ===================================================== */}
          {/* VENUE & DATE INFO */}
          {/* ===================================================== */}
          <div className="flex items-center justify-center gap-20 mt-2 mb-2 ml-3">
            {/* Venue */}
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-[#f03e2e]" />

              <div className="flex items-center gap-2">
                <span className="text-md font-bold uppercase tracking-[1px] text-[#0F4A34]">
                  Venue:
                </span>

                <span className="text-base font-semibold text-[#2E2723]">
                  KTS Ground, Trichy
                </span>
              </div>
            </div>

            {/* Divider
            <div className="w-px h-6 bg-[#CFA150]/50" /> */}

            {/* Date */}
            <div className="flex items-center gap-3">
              <CalendarDays className="w-5 h-5 text-[#f03e2e]" />

              <div className="flex items-center gap-2">
                <span className="text-md font-bold uppercase tracking-[1px] text-[#0F4A34]">
                  Dates:
                </span>

                <span className="text-base font-semibold text-[#2E2723]">
                  25-28 June 2026
                </span>
              </div>
            </div>
          </div>
          {/* ===================================================== */}
          {/* BUTTONS */}
          {/* ===================================================== */}
          <div className="flex items-center gap-5 translate-y-4">
            {/* Live Video Button */}
            <button
              onClick={() => navigate("/live-scores")}
              className="flex items-center justify-center gap-2 px-10 py-4 text-md rounded-xl gold-button font-heading animate-float-gentle"
            >
              <Tv className="w-6 h-6" />
              Live Video
            </button>
            {/* Schedule Button */}
            <button
              onClick={() => navigate("/matches")}
              className="flex items-center justify-center gap-2 px-10 py-4 border-2 text-md rounded-xl gold-outline-button font-heading"
            >
              <TrophyIcon className="w-6 h-6" />
              Live Scores
            </button>
            {/* ===================================================== */}
            {/* TEAM LOGO CAROUSEL */}
            {/* ===================================================== */}
          </div>
        </div>
      </section>
      {/* ===================================================== */}
      {/* MOBILE HERO SECTION */}
      {/* Visible only below md screens */}
      {/* ===================================================== */}
      <section className="relative flex md:hidden min-h-[90svh] overflow-hidden">
        <img
          src={heroBgTexture}
          alt=""
          className="
    absolute
    top-0
    left-0
    w-full
    h-[101%]
    object-cover 
  "
        />
        {/* LOGO + PRESENTS */}
        <div className="absolute z-20 flex flex-col items-center -translate-x-1/2 pointer-events-none top-[2%] left-1/2 w-full px-4">
          <img
            src={sozoLogo}
            alt="SOZO Solar Zolutions"
            className="object-contain h-auto"
            style={{ width: "clamp(150px, 48vw, 220px)" }}
          />
          <div className="flex items-center gap-1">
            <div className="h-[1.5px] w-[clamp(40px,14vw,64px)] bg-gradient-to-r from-transparent via-[#CFA150] to-[#CFA150]" />
            <p
              className="font-bold tracking-[3px] text-[#064C8F] uppercase whitespace-nowrap"
              style={{ fontSize: "clamp(9px, 3vw, 12px)" }}
            >
              PRESENTS
            </p>
            <div className="h-[1.5px] -ml-1 w-[clamp(40px,14vw,64px)] bg-gradient-to-l from-transparent via-[#CFA150] to-[#CFA150]" />
          </div>
        </div>

        {/* BALL */}
        <img
          src={ballImage}
          alt="Cricket Ball"
          className="absolute z-20 object-contain rotate-[-18deg] right-[2%] top-[16%]"
          style={{ width: "clamp(90px, 30vw, 140px)" }}
        />

        {/* BATSMAN */}
        <img
          src={batsmanImage}
          alt="Batsman"
          className="absolute z-10 h-auto object-contain left-[5%] top-[18%]"
          style={{ width: "clamp(140px, 46vw, 215px)" }}
        />

        {/* CONTENT */}
        <div className="relative z-10 flex flex-col items-center w-full px-4 pt-[26vh] ">
          <div className="flex justify-end w-full pr-4">
            <div className="leading-[0.95] text-left">
              <h1
                className="mb-1 -ml-1 font-extrabold tracking-tight uppercase luxury-fill-text"
                style={{ fontSize: "clamp(68px, 26vw, 110px)" }}
              >
                BNI
              </h1>
              <h1
                className="font-bold tracking-tight text-[#B41A1E] uppercase"
                style={{ fontSize: "clamp(42px, 16vw, 66px)" }}
              >
                TPL
              </h1>
              <h1
                className="-mt-1.5 font-bold tracking-tight text-[#CFA150] uppercase"
                style={{ fontSize: "clamp(40px, 15.5vw, 64px)" }}
              >
                2026
              </h1>
            </div>
          </div>

          <div className="mt-[clamp(16px,5vw,28px)] flex flex-col items-center w-full">
            <h2
              className="font-extrabold uppercase text-[#4B4B4B] text-center leading-tight"
              style={{ fontSize: "clamp(19px, 6.8vw, 30px)" }}
            >
              TRICHY PREMIER LEAGUE
            </h2>
            <div className="flex items-center justify-center gap-2 mt-1">
              <div className="w-[clamp(28px,9vw,40px)] h-[1.5px] bg-[#C79A3B]" />
              <div className="w-2 h-2 rounded-full bg-[#C79A3B]" />
              <p
                className="font-semibold tracking-wide text-[#4B3A1D] uppercase whitespace-nowrap"
                style={{ fontSize: "clamp(7px, 2.6vw, 10px)" }}
              >
                Building Business Beyond Boundaries
              </p>
              <div className="w-2 h-2 rounded-full bg-[#C79A3B]" />
              <div className="w-[clamp(28px,9vw,40px)] h-[1.5px] bg-[#C79A3B]" />
            </div>
            {/* ===================================================== */}
            {/* VENUE & DATE INFO */}
            {/* ===================================================== */}
            <div className="grid mt-5 mb-2 ml-3 grid-col-1">
              {/* Venue */}
              <div className="flex items-center gap-2.5">
                <MapPin className="w-5 h-5 text-[#f03e2e]" />

                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold uppercase tracking-[0px] text-[#0F4A34]">
                    Venue:
                  </span>

                  <span className="text-xs font-semibold text-[#2E2723]">
                    KTS Ground, Trichy
                  </span>
                </div>
              </div>

              {/* Divider
            <div className="w-px h-6 bg-[#CFA150]/50" /> */}

              {/* Date */}
              <div className="flex items-center gap-3">
                <CalendarDays className="w-5 h-5 text-[#f03e2e]" />

                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold uppercase tracking-[0px] text-[#0F4A34]">
                    Dates:
                  </span>

                  <span className="text-xs font-semibold text-[#2E2723]">
                    25-28 June 2026
                  </span>
                </div>
              </div>
            </div>
            <div className="flex flex-col w-full max-w-xs gap-3 mt-2">
              <a
                href="https://register.bnitpl2026.in/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center w-full gap-2 px-6 py-3 text-base rounded-lg bg-[#B31217] text-white font-heading font-semibold shadow-lg"
              >
                Register Now
              </a>
              <div className="grid w-full grid-cols-2 gap-3">
                <button
                  onClick={() => navigate("/live-scores")}
                  className="flex items-center justify-center w-full min-w-0 gap-2 px-4 py-3 text-sm rounded-lg gold-button font-heading"
                >
                  <Tv className="w-5 h-5 shrink-0" />
                  <span className="truncate">Live Video</span>
                </button>
                <button
                  onClick={() => navigate("/matches")}
                  className="flex items-center justify-center w-full min-w-0 gap-2 px-4 py-3 text-sm border-2 rounded-lg gold-outline-button font-heading"
                >
                  <Trophy className="w-5 h-5 shrink-0" />
                  <span className="truncate">Live Scores</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};
export default HeroSection;
