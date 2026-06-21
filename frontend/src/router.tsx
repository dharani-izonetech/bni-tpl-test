import { createBrowserRouter } from "react-router-dom";
import MainLayout from "./components/MainLayout";
import AdminLayout from "./components/AdminLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import ErrorBoundary from "./components/ErrorBoundary";

// ── BNI Pages ─────────────────────────────────────────────────────────────────
import Index from "./pages/Index";
import LiveScoresPage from "./pages/LiveScoresPage";
import RegisterPage from "./pages/RegisterPage";
import GroupPage from "./pages/GroupPage";
import GroupMatchesPage from "./pages/GroupMatchesPage";
import PointsTablePage from "./pages/PointsTablePage";
import MatchesPage from "./pages/MatchesPage";
import NewsPage from "./pages/NewsPage";
import SponsorPage from "./pages/SponsorPage";
import RevealMatchPage from "./pages/RevealMatchPage";
import TeamAllocationSpinner from "./pages/TeamAllocationSpinner";
import NotFound from "./pages/NotFound";

// ── Admin Pages ───────────────────────────────────────────────────────────────
import AdminLoginPage from "./pages/admin/AdminLoginPage";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import AdminPlayersPage from "./pages/admin/AdminPlayersPage";
import AdminNewsPage from "./pages/admin/AdminNewsPage";
import AdminRevealMatchPage from "./pages/admin/AdminRevealMatchPage";
import AdminLiveScoresPage from "./pages/admin/AdminLiveScoresPage";
import AdminSpinnerPage from "./pages/admin/AdminSpinnerPage";

// ── Tournament ceremony ───────────────────────────────────────────────────────
import TournamentRevealPage from "./pages/tournament/TournamentRevealPage";
import TournamentGroupsPage from "./pages/tournament/TournamentGroupsPage";
import TournamentMatchesPage from "./pages/tournament/TournamentMatchesPage";

// ── CricPro Scoring Pages ─────────────────────────────────────────────────────
import TournamentsPage from "./pages/scoring/TournamentsPage";
import TournamentDetailPage from "./pages/scoring/TournamentDetailPage";
import StatsPage from "./pages/scoring/StatsPage";
import ProfilePage from "./pages/scoring/ProfilePage";
import LiveScoringPage from "./pages/scoring/LiveScoringPage";
import MatchDetailPage from "./pages/scoring/MatchDetailPage";
import LiveScoreMatchDetailsPage from "./pages/LiveScoreMatchDetailsPage";
import MatchSetupWizard from "./pages/scoring/MatchSetupWizard";
import CreateTeamPage from "./pages/scoring/CreateTeamPage";
import CreateTournamentPage from "./pages/scoring/CreateTournamentPage";
import ScoringAdminLayout from "./components/ScoringAdminLayout";
import ScoringDashboardPage from "./pages/scoring-admin/DashboardPage";
import SAMatchesPage from "./pages/scoring-admin/MatchesPage";
import ScoreEditorPage from "./pages/scoring-admin/ScoreEditorPage";
import SAPlayersPage from "./pages/scoring-admin/PlayersPage";
import SATournamentsPage from "./pages/scoring-admin/TournamentsPage";
import SAStatsPage from "./pages/scoring-admin/StatsPage";
import PlayerLoginPage from "./pages/scoring/PlayerLoginPage";
import PlayerDashboardPage from "./pages/scoring/PlayerDashboardPage";
import AdminGroupsPage from "./pages/admin/AdminGroupsPage";
import AdminSquadPlayersPage from "./pages/admin/AdminSquadPlayersPage";
import LeagueStageAdminPage from "./pages/admin/tournament/LeagueStageAdminPage";
import Super12ManagementPage from "./pages/admin/tournament/Super12ManagementPage";
import KnockoutManagementPage from "./pages/admin/tournament/KnockoutManagementPage";
import ScheduleManagementPage from "./pages/admin/tournament/ScheduleManagementPage";
import AuditLogsPage from "./pages/admin/tournament/AuditLogsPage";

export const router = createBrowserRouter([
  // ── All non-admin pages share MainLayout (Navbar + Footer) ──────────────────
  {
    element: <MainLayout />,
    errorElement: (
      <ErrorBoundary>
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-lg text-red-600">
            Page failed to load. Please try again.
          </p>
        </div>
      </ErrorBoundary>
    ),
    children: [
      // BNI public pages
      { path: "/", element: <Index /> },
      { path: "/live-scores", element: <LiveScoresPage /> },
      {
        path: "/live-scores/match/:matchId",
        element: <LiveScoreMatchDetailsPage />,
      },
      { path: "/register", element: <RegisterPage /> },
      { path: "/group", element: <GroupPage /> },
      { path: "/group/:id", element: <GroupMatchesPage /> },
      { path: "/points-table", element: <PointsTablePage /> },
      { path: "/matches", element: <MatchesPage /> },
      { path: "/news", element: <NewsPage /> },
      { path: "/:sponsorSlug", element: <SponsorPage /> },
      { path: "/reveal-match", element: <TeamAllocationSpinner /> },

      // Tournament ceremony (protected)
      {
        path: "/tournament/reveal",
        element: (
          <ProtectedRoute>
            <TournamentRevealPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "/tournament/groups",
        element: (
          <ProtectedRoute>
            <TournamentGroupsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "/tournament/matches",
        element: (
          <ProtectedRoute>
            <TournamentMatchesPage />
          </ProtectedRoute>
        ),
      },

      // CricPro public pages
      { path: "/tournaments", element: <TournamentsPage /> },
      { path: "/tournaments/:tournamentId", element: <TournamentDetailPage /> },
      { path: "/stats", element: <StatsPage /> },
      { path: "/match/:matchId", element: <MatchDetailPage /> },
      { path: "/matches/:matchId", element: <MatchDetailPage /> },

      // CricPro protected pages
      {
        path: "/tournaments/create",
        element: (
          <ProtectedRoute>
            <CreateTournamentPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "/scoring/teams/create",
        element: (
          <ProtectedRoute>
            <CreateTeamPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "/scoring/matches/create",
        element: (
          <ProtectedRoute>
            <MatchSetupWizard />
          </ProtectedRoute>
        ),
      },
      {
        path: "/scoring/matches/:matchId/live",
        element: (
          <ProtectedRoute>
            <LiveScoringPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "/matches/:matchId/live",
        element: (
          <ProtectedRoute>
            <LiveScoringPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "/scoring/profile",
        element: (
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        ),
      },
      {
        path: "/scoring/admin",
        element: (
          <ProtectedRoute>
            <ScoringDashboardPage />
          </ProtectedRoute>
        ),
      },

      { path: "*", element: <NotFound /> },
    ],
  },

  // ── CricPro Scoring Admin (dedicated sidebar layout) ─────────────────────────
  {
    path: "/scoring-admin",
    element: (
      <ProtectedRoute>
        <ScoringAdminLayout />
      </ProtectedRoute>
    ),
    errorElement: (
      <ErrorBoundary>
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-lg text-red-600">Scoring admin failed to load.</p>
        </div>
      </ErrorBoundary>
    ),
    children: [
      { index: true, element: <ScoringDashboardPage /> },
      { path: "dashboard", element: <ScoringDashboardPage /> },
      { path: "matches", element: <SAMatchesPage /> },
      { path: "scores", element: <ScoreEditorPage /> },
      { path: "players", element: <SAPlayersPage /> },
      { path: "tournaments", element: <SATournamentsPage /> },
      { path: "stats", element: <SAStatsPage /> },
    ],
  },

  // ── Admin (no Navbar — its own layout) ──────────────────────────────────────
  { path: "/admin/login", element: <AdminLoginPage /> },
  {
    path: "/admin",
    element: (
      <ProtectedRoute>
        <AdminLayout />
      </ProtectedRoute>
    ),
    errorElement: (
      <ErrorBoundary>
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-lg text-red-600">Admin panel failed to load.</p>
        </div>
      </ErrorBoundary>
    ),
    children: [
      { path: "dashboard", element: <AdminDashboardPage /> },
      { path: "players", element: <AdminPlayersPage /> },
      { path: "news", element: <AdminNewsPage /> },
      { path: "reveal-match", element: <TeamAllocationSpinner /> },
      { path: "live-scores", element: <AdminLiveScoresPage /> },
      { path: "squad",       element: <AdminSquadPlayersPage /> },
      { path: "spinner", element: <AdminSpinnerPage /> },
      { path: "groups", element: <AdminGroupsPage /> },
      { path: "league", element: <LeagueStageAdminPage /> },
      { path: "super12", element: <Super12ManagementPage /> },
      { path: "knockout", element: <KnockoutManagementPage /> },
      { path: "schedule", element: <ScheduleManagementPage /> },
      { path: "audit", element: <AuditLogsPage /> },
    ],
  },

  // ── Player portal (standalone — no Navbar) ──────────────────────────────────
  { path: "/player/login", element: <PlayerLoginPage /> },
  { path: "/player/dashboard", element: <PlayerDashboardPage /> },
]);
