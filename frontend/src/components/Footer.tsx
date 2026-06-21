// import brandImage from "@/assets/images/3.png";

// const Footer = () => {
//   return (
//     <footer className="border-t border-border bg-[linear-gradient(180deg,rgba(var(--surface-dim-rgb),0.55),rgba(var(--background-rgb),0.92))] px-4 py-10 shadow-[0_-8px_24px_rgba(var(--dark-surface-rgb),0.08)] md:py-12">
//       <div className="container mx-auto text-center">
//         <div className="flex items-center justify-center gap-2 mb-4">
//           <img src={brandImage} alt="Brand logo" className="object-contain w-auto h-12 md:h-16" />
//         </div>
//         <p className="max-w-md mx-auto text-xs text-muted-foreground sm:text-sm">
//           <span className="block">Building Business Beyond Boundaries</span>
//           <span className="block">© BNI TRICHY PREMIER LEAGUE 2026. All Rights Reserved.</span>
//           <span className="block"> Designed and Developed by iZone Technologies.</span>
//         </p>
//       </div>
//     </footer>
//   );
// };

// export default Footer;



import brandImage from "@/assets/images/3.png";

const Footer = () => {
  return (
    <footer className="relative border-t border-border bg-[linear-gradient(180deg,rgba(var(--surface-dim-rgb),0.55),rgba(var(--background-rgb),0.92))] shadow-[0_-8px_24px_rgba(var(--dark-surface-rgb),0.08)]">
      {/* Accent line */}
      <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-primary/60 to-transparent" />

      <div className="container mx-auto px-4 py-8 md:py-10">
        <div className="flex flex-col items-center text-center">
          {/* Logo */}
          <img
            src={brandImage}
            alt="BNI TPL Cricket Logo"
            className="h-12 w-auto object-contain md:h-16"
          />

          {/* Title */}
          <h3 className="mt-3 text-base font-semibold uppercase tracking-[0.15em] text-foreground sm:text-lg">
            BNI Trichy Premier League
          </h3>

          {/* Decorative divider with center dot */}
          <div className="mt-2 flex items-center gap-2">
            <span className="h-px w-10 bg-border sm:w-16" />
            <span className="h-1.5 w-1.5 rounded-full bg-primary/70" />
            <span className="h-px w-10 bg-border sm:w-16" />
          </div>

          {/* Tagline */}
          <p className="mt-2 text-xs italic text-muted-foreground sm:text-sm">
            Building Business Beyond Boundaries
          </p>
        </div>

        {/* Full divider */}
        <div className="my-5 h-px w-full bg-border/60" />

        {/* Bottom bar */}
        <div className="flex flex-col items-center gap-1 text-center text-xs text-muted-foreground">
          <p>
            &copy; 2026{" "}
            <span className="font-medium text-foreground/80">
              BNI TPL Cricket Tournament
            </span>
            . All Rights Reserved.
          </p>
          <p>
            Designed &amp; Developed by{" "}
            <span className="font-medium text-foreground/80">
              iZone Technologies
            </span>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;