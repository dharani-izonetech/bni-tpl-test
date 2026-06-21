/**
 * ScoringAdminLayout — dedicated sidebar layout for the CricPro Scoring Admin.
 * Completely separate from BNI AdminLayout.
 * Access: admin, organizer, scorer roles.
 */
import { useState } from "react";
import { NavLink, Outlet, useNavigate, Link } from "react-router-dom";
import {
  LayoutDashboard, Trophy, Swords, Users, BarChart2,
  LogOut, Menu, X, ChevronRight, Activity,
} from "lucide-react";
import { logoutAdmin } from "@/lib/adminAuth";

const SIDEBAR_LINKS = [
  { to: "/scoring-admin/dashboard",   label: "Dashboard",     icon: LayoutDashboard },
  { to: "/scoring-admin/matches",     label: "Matches",       icon: Swords          },
  { to: "/scoring-admin/scores",      label: "Score Editor",  icon: Activity        },
  { to: "/scoring-admin/players",     label: "Players",       icon: Users           },
  { to: "/scoring-admin/tournaments", label: "Tournaments",   icon: Trophy          },
  { to: "/scoring-admin/stats",       label: "Statistics",    icon: BarChart2       },
];

export default function ScoringAdminLayout() {
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    setLoggingOut(true);
    try { await logoutAdmin(); } finally {
      setLoggingOut(false);
      navigate("/admin/login", { replace: true });
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 text-slate-900 overflow-hidden">
      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 z-20 bg-black/40 md:hidden" onClick={() => setOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-30 w-64 flex flex-col bg-white border-r border-slate-200 shadow-sm
        transform transition-transform duration-200
        ${open ? "translate-x-0" : "-translate-x-full"}
        md:relative md:translate-x-0
      `}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-200">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-600 text-lg font-black">🏏</div>
          <div>
            <div className="font-bold text-slate-900 text-sm">CricPro Admin</div>
            <div className="text-xs text-slate-400">Scoring Dashboard</div>
          </div>
          <button className="ml-auto md:hidden text-slate-400 hover:text-slate-700" onClick={() => setOpen(false)}>
            <X size={18} />
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {SIDEBAR_LINKS.map(link => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-primary-50 text-primary-700 border border-primary-200"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`
                }
              >
                <Icon size={17} />
                {link.label}
                <ChevronRight size={14} className="ml-auto opacity-30" />
              </NavLink>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-3 py-4 border-t border-slate-200 space-y-1">
          <Link to="/admin/dashboard" className="flex items-center gap-3 rounded-xl px-3 py-2 text-xs text-primary-600 hover:text-primary-800 hover:bg-primary-50 font-medium transition-colors">
            ← BNI Admin Dashboard
          </Link>
          <Link to="/" className="flex items-center gap-3 rounded-xl px-3 py-2 text-xs text-slate-400 hover:text-slate-600 transition-colors">
            ← Back to Cricket Site
          </Link>
          <button
            onClick={() => void handleLogout()}
            disabled={loggingOut}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <LogOut size={17} />
            {loggingOut ? "Logging out…" : "Logout"}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center gap-4 border-b border-slate-200 bg-white px-4 py-3 shadow-sm">
          <button className="md:hidden text-slate-400 hover:text-slate-700" onClick={() => setOpen(true)}>
            <Menu size={20} />
          </button>
          <span className="text-sm font-semibold text-slate-700">CricPro Scoring Admin</span>
          <div className="ml-auto flex items-center gap-2">
            <span className="rounded-full bg-primary-50 border border-primary-200 px-2.5 py-0.5 text-xs font-medium text-primary-700 capitalize">
              {localStorage.getItem("bni_role") ?? "admin"}
            </span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6 bg-gray-50">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
