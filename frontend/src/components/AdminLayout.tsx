import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { LayoutDashboard, Users, Newspaper, Swords, Activity, LogOut, Menu, X, Loader2, Disc3, BarChart2, Trophy, Calendar, ClipboardList, Shield, ListOrdered, Layers } from "lucide-react";
import { logoutAdmin } from "@/lib/adminAuth";
import "./admin.css";

const sidebarLinks = [
  { to: "/admin/dashboard",    label: "Dashboard",      icon: LayoutDashboard },
  { to: "/admin/players",      label: "Players",        icon: Users           },
  { to: "/admin/news",         label: "News",           icon: Newspaper       },
  { to: "/admin/live-scores",  label: "Live Video",     icon: Activity        },
  { to: "/admin/squad",        label: "Squad Players",  icon: Users           },
  { to: "/admin/spinner",      label: "Reveal Spinner", icon: Disc3           },
  // { to: "/admin/reveal-match", label: "Match Schedule", icon: Swords          },
  { to: "/scoring-admin",      label: "Scoring Admin",  icon: BarChart2       },
  { to: "/admin/groups",       label: "Groups",         icon: Layers          },
  { to: "/admin/league",       label: "League Stage",   icon: ListOrdered     },
  { to: "/admin/super12",      label: "Super 12",       icon: Trophy          },
  { to: "/admin/knockout",     label: "Knockout Stages",icon: Shield          },
  { to: "/admin/schedule",     label: "Schedule",       icon: Calendar        },
  { to: "/admin/audit",        label: "Audit Logs",     icon: ClipboardList   },
];

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loggingOut,  setLoggingOut]  = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logoutAdmin();
    } finally {
      setLoggingOut(false);
      navigate("/admin/login", { replace: true });
    }
  };

  return (
    <div className="admin-layout">
      {/* Mobile overlay */}
      <div className={`admin-overlay${sidebarOpen ? " visible" : ""}`} onClick={() => setSidebarOpen(false)} />

      {/* Sidebar */}
      <aside className={`admin-sidebar${sidebarOpen ? " open" : ""}`}>
        <div className="admin-sidebar-header">
          <div className="admin-sidebar-title">Admin Panel</div>
          <div className="admin-sidebar-sub">BNI Trichy Cricket</div>
        </div>

        <nav className="admin-sidebar-nav">
          {sidebarLinks.map(link => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) => `admin-nav-item${isActive ? " active" : ""}`}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon size={18} />
                {link.label}
              </NavLink>
            );
          })}
        </nav>

        <div className="admin-sidebar-footer">
          <button className="admin-logout-btn" onClick={() => void handleLogout()} disabled={loggingOut}>
            {loggingOut ? <><Loader2 size={16} className="spin" /> Logging out…</> : <><LogOut size={18} /> Logout</>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="admin-main">
        <header className="admin-topbar">
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button className="admin-mobile-toggle" onClick={() => setSidebarOpen(!sidebarOpen)} aria-label="Toggle sidebar">
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <span className="admin-topbar-title">Administration</span>
          </div>
          <div className="admin-topbar-right">
            <div className="admin-user-badge">
              <div className="admin-user-avatar">A</div>
              Admin
            </div>
          </div>
        </header>

        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
