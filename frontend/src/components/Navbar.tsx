import { useState } from "react";
import { Menu, X } from "lucide-react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import brandImage from "../assets/images/3.png";

const BNI_NAV_ITEMS = ["Home", "Live Video", "Matches", "Group", "Teams", "Points Table", "Sponsors", "News & Blogs"];
// const CRICPRO_NAV_ITEMS = [
//   { label: "Tournaments", to: "/tournaments" },
//   { label: "Stats",       to: "/stats" },
//   { label: "My Stats",    to: "/player/login" },
// ];

// Roles that can see the Scoring Admin link
const SCORER_ROLES = ["admin", "organizer", "scorer"];

const LIVE_VIDEO_ROUTE    = "/live-scores";
const REGISTER_ROUTE      = "/register";
const POINTS_TABLE_ROUTE  = "/points-table";
const MATCHES_ROUTE       = "/matches";
const GROUP_ROUTE         = "/group";
const NEWS_ROUTE          = "/news";
const REVEAL_MATCH_ROUTE  = "/reveal-match";

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Detect if we're on a CricPro page
  const isCricPro = ["/tournaments", "/stats", "/match/", "/scoring/"].some(p =>
    location.pathname.startsWith(p)
  );

  // Show scoring admin link for privileged roles
  const storedRole = localStorage.getItem("bni_role") ?? localStorage.getItem("role") ?? ""
  const isScorer = SCORER_ROLES.includes(storedRole)

  const scrollTo = (id: string) => {
    if (id === "home") {
      if (location.pathname !== "/") navigate("/");
      else window.scrollTo({ top: 0, behavior: "smooth" });
      setOpen(false);
      return;
    }
    if (location.pathname !== "/") {
      navigate("/", { state: { scrollTarget: id } });
    } else {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    }
    setOpen(false);
  };

  const handleNav = (item: string) => {
    switch (item) {
      case "Points Table":  navigate(POINTS_TABLE_ROUTE);  break;
      case "Matches":       navigate(MATCHES_ROUTE);       break;
      case "Group":         navigate(GROUP_ROUTE);         break;
      case "Live Video":    navigate(LIVE_VIDEO_ROUTE);    break;
      case "News & Blogs":  navigate(NEWS_ROUTE);          break;
      case "Reveal Match":  navigate(REVEAL_MATCH_ROUTE);  break;
      case "Bracket":       navigate("/bracket");          break;
      default: scrollTo(item.toLowerCase().replace(/\s+/g, "-"));
    }
    setOpen(false);
  };

  const openRegister = () => { navigate(REGISTER_ROUTE); setOpen(false); };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-[linear-gradient(180deg,rgba(var(--surface-dim-rgb),0.96),rgba(var(--background-rgb),0.94))] shadow-[0_8px_24px_rgba(var(--dark-surface-rgb),0.2)] backdrop-blur-md">
      <div className="container flex items-center justify-between h-16 px-4 mx-auto lg:h-20">

        {/* Logo */}
        <div className="flex items-center gap-3">
          <img
            src={brandImage}
            alt="BNI Cricket"
            className="object-contain w-auto h-14 lg:h-20 md:h-15"
          />
          {/* CricPro badge when on scoring pages */}
          {isCricPro && (
            <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-primary/10 border border-primary/20 px-2.5 py-0.5 text-xs font-bold text-primary">
              🏏 CricPro
            </span>
          )}
        </div>

        {/* Desktop nav */}
        <div className="items-center hidden gap-1 md:flex">
          {/* BNI links */}
          {BNI_NAV_ITEMS.map(item => (
            <button
              key={item}
              onClick={() => handleNav(item)}
              className="rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors"
            >
              {item}
            </button>
          ))}

          {/* Divider */}
          <span className="w-px h-5 mx-1 bg-border" />

          {/* CricPro links */}
          {/* {CRICPRO_NAV_ITEMS.map(item => (
            <Link
              key={item.to}
              to={item.to}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                location.pathname.startsWith(item.to)
                  ? "bg-primary/10 text-primary font-semibold"
                  : "text-muted-foreground hover:text-primary hover:bg-primary/5"
              }`}
            >
              {item.label}
            </Link>
          ))} */}
          {isScorer && (
            <Link
              to="/scoring-admin"
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                location.pathname === "/scoring-admin"
                  ? "bg-primary/10 text-primary font-semibold"
                  : "text-muted-foreground hover:text-primary hover:bg-primary/5"
              }`}
            >
              ⚙️ Score Admin
            </Link>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden text-foreground"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen(!open)}
        >
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden max-h-[calc(100vh-4rem)] overflow-y-auto bg-card border-b border-border px-4 pb-4 space-y-1">
          <p className="pt-3 pb-1 text-xs font-semibold tracking-wider uppercase text-muted-foreground/60">BNI Cricket</p>
          {BNI_NAV_ITEMS.map(item => (
            <button
              key={item}
              onClick={() => handleNav(item)}
              className="block w-full px-3 py-2 text-sm font-medium text-left transition-colors rounded-md text-muted-foreground hover:text-primary hover:bg-primary/5"
            >
              {item}
            </button>
          ))}
          <p className="pt-3 pb-1 text-xs font-semibold tracking-wider uppercase text-muted-foreground/60">CricPro</p>
          {/* {CRICPRO_NAV_ITEMS.map(item => (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setOpen(false)}
              className={`block rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                location.pathname.startsWith(item.to)
                  ? "bg-primary/10 text-primary font-semibold"
                  : "text-muted-foreground hover:text-primary hover:bg-primary/5"
              }`}
            >
              {item.label}
            </Link>
          ))} */}
          {isScorer && (
            <Link
              to="/scoring-admin"
              onClick={() => setOpen(false)}
              className={`block rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                location.pathname === "/scoring-admin"
                  ? "bg-primary/10 text-primary font-semibold"
                  : "text-muted-foreground hover:text-primary hover:bg-primary/5"
              }`}
            >
              ⚙️ Score Admin
            </Link>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;

