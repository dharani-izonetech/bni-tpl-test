/**
 * MainLayout — shared shell for ALL non-admin pages (BNI + CricPro).
 * Renders the BNI Navbar at the top and Footer at the bottom.
 * CricPro pages get a dark content area; BNI pages keep their own bg.
 */
import { Outlet, useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";

const CRICPRO_PATHS = ["/tournaments", "/stats", "/match/", "/scoring/"];

export default function MainLayout() {
  const { pathname } = useLocation();
  const isCricPro = CRICPRO_PATHS.some(p => pathname.startsWith(p));

  return (
    <div className={`min-h-screen flex flex-col ${isCricPro ? "bg-gray-50" : "bg-background"}`}>
      <Navbar />
      <main className="flex-1 pt-16">
        {isCricPro ? (
          <div className="mx-auto max-w-7xl px-4 py-6">
            <Outlet />
          </div>
        ) : (
          <Outlet />
        )}
      </main>
      <Footer />
    </div>
  );
}
