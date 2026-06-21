/**
 * AdminLiveScoresPage — Live Video management.
 *
 * Lists all matches from the scoring engine.
 * Admin can attach a YouTube URL or upload a video file to any match.
 * The attached video appears in the public Live Video page VideoPlayer.
 */
import { useEffect, useState } from "react";
import {
  Loader2, Link as LinkIcon, Video, CheckCircle,
  AlertCircle, Trash2, Activity, RefreshCw,
} from "lucide-react";
import { apiFetch } from "@/lib/api";

// ── Types ──────────────────────────────────────────────────────────────────

type ScoringMatch = {
  id: string;
  status: string;
  team1?: { id: string; name: string; short?: string } | null;
  team2?: { id: string; name: string; short?: string } | null;
  venue?: string | null;
  overs?: number;
};

type MediaItem = {
  id: string;
  media_type: "video_file" | "video_link" | "image";
  public_url?: string;
  embed_url?: string;
  filename: string;
};

type LiveScoreEntry = {
  id: string;
  match_id?: string | null;
  video?: MediaItem | null;
};

// ── Helpers ────────────────────────────────────────────────────────────────

function normStatus(s: string): "LIVE" | "COMPLETED" | "UPCOMING" {
  const u = s.toUpperCase();
  if (u === "LIVE") return "LIVE";
  if (u === "COMPLETED") return "COMPLETED";
  return "UPCOMING";
}

function normalizeYouTubeUrl(input: string): string {
  const t = input.trim();
  if (t.includes("youtube.com/embed/")) return t;
  const s = t.match(/youtu\.be\/([A-Za-z0-9_-]{11})/);
  if (s) return `https://www.youtube.com/embed/${s[1]}`;
  const w = t.match(/[?&]v=([A-Za-z0-9_-]{11})/);
  if (w) return `https://www.youtube.com/embed/${w[1]}`;
  const l = t.match(/youtube\.com\/live\/([A-Za-z0-9_-]{11})/);
  if (l) return `https://www.youtube.com/embed/${l[1]}`;
  return t;
}

function statusColor(s: string) {
  const n = normStatus(s);
  return n === "LIVE" ? "#e53935" : n === "COMPLETED" ? "#388e3c" : "#f57c00";
}

// ── Sub-components ─────────────────────────────────────────────────────────

function StatusPill({ status }: { status: string }) {
  const norm = normStatus(status);
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "2px 10px", borderRadius: 20, fontSize: 10,
      fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase",
      background: statusColor(status), color: "#fff",
    }}>
      {norm === "LIVE" && (
        <span style={{
          width: 5, height: 5, borderRadius: "50%", background: "#fff",
          animation: "lpulse 1.4s ease-in-out infinite",
        }} />
      )}
      {norm}
    </span>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

const AdminLiveScoresPage = () => {
  const [matches,    setMatches]    = useState<ScoringMatch[]>([]);
  const [videoMap,   setVideoMap]   = useState<Record<string, LiveScoreEntry>>({}); // match_id → LiveScoreEntry
  const [loading,    setLoading]    = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // Which match is being edited
  const [editId,     setEditId]     = useState<string | null>(null);
  const [tab,        setTab]        = useState<"url" | "file">("url");

  // URL tab
  const [urlInput,   setUrlInput]   = useState("");
  const [savingUrl,  setSavingUrl]  = useState(false);
  const [urlMsg,     setUrlMsg]     = useState<{ ok: boolean; text: string } | null>(null);

  // File tab
  const [videoFile,  setVideoFile]  = useState<File | null>(null);
  const [uploading,  setUploading]  = useState(false);
  const [fileMsg,    setFileMsg]    = useState<{ ok: boolean; text: string } | null>(null);

  // ── Load ───────────────────────────────────────────────────────────────

  const load = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const BASE = (import.meta.env.VITE_API_BASE_URL ?? "").trim();

      // Fetch all status buckets in parallel
      const [liveRes, completedRes, upcomingRes, scheduledRes] = await Promise.all([
        fetch(`${BASE}/scoring/matches/live`),
        fetch(`${BASE}/scoring/matches?status=COMPLETED&page_size=100`),
        fetch(`${BASE}/scoring/matches?status=UPCOMING&page_size=100`),
        fetch(`${BASE}/scoring/matches?status=scheduled&page_size=100`),
      ]);

      const liveData:      ScoringMatch[] = liveRes.ok      ? await liveRes.json()      : [];
      const completedData: ScoringMatch[] = completedRes.ok ? await completedRes.json() : [];
      const upcomingData:  ScoringMatch[] = upcomingRes.ok  ? await upcomingRes.json()  : [];
      const scheduledData: ScoringMatch[] = scheduledRes.ok ? await scheduledRes.json() : [];

      // Merge all, dedup by id — preserve order: live → upcoming → scheduled → completed
      const seen = new Set<string>();
      const all: ScoringMatch[] = [];
      for (const m of [...liveData, ...upcomingData, ...scheduledData, ...completedData]) {
        if (!seen.has(m.id)) { seen.add(m.id); all.push(m); }
      }
      setMatches(all);

      // BNI live score entries (video attachments)
      const bniRes = await apiFetch<{ data: LiveScoreEntry[] }>("/live-scores/all");
      const bni = bniRes.data ?? [];
      const map: Record<string, LiveScoreEntry> = {};
      for (const entry of bni) {
        if (entry.match_id) map[entry.match_id] = entry;
      }
      setVideoMap(map);
      setLastRefresh(new Date());
    } catch { /* ignore */ }
    finally { if (!silent) setLoading(false); }
  };

  // Initial load + auto-refresh every 15 s
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    void load();
    const t = setInterval(() => void load(true), 15_000);
    return () => clearInterval(t);
  }, []); // intentionally empty — load is stable (no captured state dependencies)

  // ── Attach YouTube URL ─────────────────────────────────────────────────

  const saveUrl = async (matchId: string) => {
    const url = urlInput.trim();
    if (!url) { setUrlMsg({ ok: false, text: "Please enter a YouTube URL." }); return; }
    setSavingUrl(true); setUrlMsg(null);
    try {
      const embedUrl = normalizeYouTubeUrl(url);

      // 1. Save media link
      const mediaRes = await apiFetch<{ data: MediaItem }>("/media/links/video", {
        method: "POST",
        body: JSON.stringify({ title: "Live Video Stream", embed_url: embedUrl }),
      });

      // 2. Create or update the BNI live score entry for this match
      const existing = videoMap[matchId];
      const match = matches.find(m => m.id === matchId);
      if (existing) {
        await apiFetch(`/live-scores/${existing.id}`, {
          method: "PUT",
          body: JSON.stringify({ video_id: mediaRes.data.id, is_active: true }),
        });
      } else {
        await apiFetch("/live-scores", {
          method: "POST",
          body: JSON.stringify({
            match_id: matchId,
            team1_name: match?.team1?.name ?? "Team 1",
            team1_short: match?.team1?.short ?? "T1",
            team2_name: match?.team2?.name ?? "Team 2",
            team2_short: match?.team2?.short ?? "T2",
            status: normStatus(match?.status ?? "LIVE"),
            venue: match?.venue ?? null,
            video_id: mediaRes.data.id,
            is_active: true,
          }),
        });
      }

      setUrlInput("");
      setUrlMsg({ ok: true, text: "YouTube URL saved. Video is now live on the public page." });
      setEditId(null);
      await load();
    } catch (e) {
      setUrlMsg({ ok: false, text: e instanceof Error ? e.message : "Failed to save URL." });
    } finally { setSavingUrl(false); }
  };

  // ── Upload video file ──────────────────────────────────────────────────

  const uploadFile = async (matchId: string) => {
    if (!videoFile) { setFileMsg({ ok: false, text: "Please select a video file." }); return; }
    setUploading(true); setFileMsg(null);
    try {
      const formData = new FormData();
      formData.append("file", videoFile);
      const mediaRes = await apiFetch<{ data: MediaItem }>("/media/upload/video", {
        method: "POST",
        body: formData,
      });

      const existing = videoMap[matchId];
      const match = matches.find(m => m.id === matchId);
      if (existing) {
        await apiFetch(`/live-scores/${existing.id}`, {
          method: "PUT",
          body: JSON.stringify({ video_id: mediaRes.data.id, is_active: true }),
        });
      } else {
        await apiFetch("/live-scores", {
          method: "POST",
          body: JSON.stringify({
            match_id: matchId,
            team1_name: match?.team1?.name ?? "Team 1",
            team1_short: match?.team1?.short ?? "T1",
            team2_name: match?.team2?.name ?? "Team 2",
            team2_short: match?.team2?.short ?? "T2",
            status: normStatus(match?.status ?? "LIVE"),
            venue: match?.venue ?? null,
            video_id: mediaRes.data.id,
            is_active: true,
          }),
        });
      }

      setVideoFile(null);
      const fi = document.getElementById("vf-input") as HTMLInputElement | null;
      if (fi) fi.value = "";
      setFileMsg({ ok: true, text: "Video uploaded. It is now live on the public page." });
      setEditId(null);
      await load();
    } catch (e) {
      setFileMsg({ ok: false, text: e instanceof Error ? e.message : "Upload failed." });
    } finally { setUploading(false); }
  };

  // ── Remove video ───────────────────────────────────────────────────────

  const removeVideo = async (matchId: string) => {
    const entry = videoMap[matchId];
    if (!entry) return;
    if (!window.confirm("Remove video from this match?")) return;
    try {
      await apiFetch(`/live-scores/${entry.id}`, {
        method: "PUT",
        body: JSON.stringify({ video_id: null }),
      });
      await load();
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "Failed.");
    }
  };

  // ── Open attach panel ──────────────────────────────────────────────────

  const openEdit = (matchId: string) => {
    setEditId(editId === matchId ? null : matchId);
    setUrlInput(""); setUrlMsg(null);
    setVideoFile(null); setFileMsg(null);
    setTab("url");
  };

  // ── Render ─────────────────────────────────────────────────────────────

  const live      = matches.filter(m => normStatus(m.status) === "LIVE");
  const upcoming  = matches.filter(m => normStatus(m.status) === "UPCOMING");
  const completed = matches.filter(m => normStatus(m.status) === "COMPLETED");

  const renderSection = (title: string, dot: string, items: ScoringMatch[]) => {
    return (
      <div style={{ marginBottom: 32 }}>
        {/* Section header */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: dot, flexShrink: 0 }} />
          <h2 style={{ fontFamily: "'Oswald',sans-serif", fontSize: 18, fontWeight: 700, color: "var(--text-main)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
            {title}
          </h2>
          <span style={{ fontSize: 12, color: "var(--text-secondary)", marginLeft: 4 }}>
            ({items.length})
          </span>
        </div>

        {items.length === 0 ? (
          <div style={{
            padding: "16px 20px", borderRadius: 10,
            border: "1px dashed var(--surface-dim)",
            color: "var(--text-secondary)", fontSize: 13, textAlign: "center",
          }}>
            No {title.toLowerCase()} matches right now.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {items.map(match => {
            const attached = videoMap[match.id];
            const video    = attached?.video;
            const isOpen   = editId === match.id;
            const label    = `${match.team1?.short ?? "T1"} vs ${match.team2?.short ?? "T2"}`;
            const fullName = `${match.team1?.name ?? "Team 1"} vs ${match.team2?.name ?? "Team 2"}`;

            return (
              <div key={match.id} style={{
                borderRadius: 12,
                border: `1.5px solid ${isOpen ? "var(--primary)" : "var(--surface-dim)"}`,
                background: "var(--surface)",
                overflow: "hidden",
                transition: "border-color 0.15s",
              }}>
                {/* Match row */}
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "14px 18px", gap: 12, flexWrap: "wrap",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <StatusPill status={match.status} />
                    <div>
                      <p style={{ fontFamily: "'Oswald',sans-serif", fontSize: 16, fontWeight: 700, color: "var(--text-main)", textTransform: "uppercase", letterSpacing: "0.03em" }}>
                        {label}
                      </p>
                      <p style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 1 }}>{fullName}</p>
                      {match.venue && <p style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 1 }}>📍 {match.venue}</p>}
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {video ? (
                      <span style={{ fontSize: 12, color: "#388e3c", fontWeight: 600 }}>
                        {video.media_type === "video_link" ? "🔗 URL attached" : "📹 File attached"}
                      </span>
                    ) : (
                      <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>No video</span>
                    )}
                    {video && (
                      <button
                        onClick={() => void removeVideo(match.id)}
                        className="admin-btn-icon danger"
                        title="Remove video"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                    <button
                      className="admin-btn-primary"
                      onClick={() => openEdit(match.id)}
                      style={{ fontSize: 12, padding: "5px 14px" }}
                    >
                      {isOpen ? "Close" : video ? "Change Video" : "Attach Video"}
                    </button>
                  </div>
                </div>

                {/* Attach panel */}
                {isOpen && (
                  <div style={{
                    padding: "18px 20px",
                    borderTop: "1px solid var(--surface-dim)",
                    background: "rgba(var(--primary-light-rgb),0.04)",
                  }}>
                    {/* Tabs */}
                    <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                      {(["url", "file"] as const).map(t => (
                        <button key={t} onClick={() => setTab(t)} style={{
                          padding: "6px 16px", borderRadius: 8, border: "1.5px solid", fontSize: 12, fontWeight: 600, cursor: "pointer",
                          borderColor: tab === t ? "var(--primary)" : "var(--surface-dim)",
                          background: tab === t ? "rgba(var(--primary-light-rgb),0.12)" : "transparent",
                          color: tab === t ? "var(--primary)" : "var(--text-secondary)",
                        }}>
                          {t === "url"
                            ? <><LinkIcon size={12} style={{ display: "inline", marginRight: 5, verticalAlign: "middle" }} />YouTube URL</>
                            : <><Video size={12} style={{ display: "inline", marginRight: 5, verticalAlign: "middle" }} />Upload File</>}
                        </button>
                      ))}
                    </div>

                    {/* URL panel */}
                    {tab === "url" && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 540 }}>
                        <input
                          className="admin-form-input"
                          value={urlInput}
                          onChange={e => setUrlInput(e.target.value)}
                          placeholder="https://youtube.com/watch?v=... or https://youtu.be/..."
                          onKeyDown={e => { if (e.key === "Enter") void saveUrl(match.id); }}
                        />
                        <p style={{ fontSize: 11, color: "var(--text-secondary)" }}>
                          Supports youtube.com/watch, youtu.be, youtube.com/live, and direct embed URLs.
                        </p>
                        <button
                          className="admin-btn-primary"
                          onClick={() => void saveUrl(match.id)}
                          disabled={savingUrl || !urlInput.trim()}
                          style={{ alignSelf: "flex-start", minWidth: 130 }}
                        >
                          {savingUrl
                            ? <><Loader2 size={13} className="spin" style={{ marginRight: 5 }} />Saving…</>
                            : "Save & Go Live"}
                        </button>
                        {urlMsg && (
                          <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13, color: urlMsg.ok ? "#388e3c" : "var(--ipl-red)" }}>
                            {urlMsg.ok ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
                            {urlMsg.text}
                          </div>
                        )}
                      </div>
                    )}

                    {/* File panel */}
                    {tab === "file" && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 540 }}>
                        <input
                          id="vf-input"
                          type="file"
                          accept="video/mp4,video/webm,video/avi,video/mov,video/mkv"
                          onChange={e => setVideoFile(e.target.files?.[0] ?? null)}
                          style={{ fontSize: 13, color: "var(--text-main)" }}
                        />
                        <p style={{ fontSize: 11, color: "var(--text-secondary)" }}>
                          MP4, WebM, AVI, MOV, MKV · Max 100 MB
                        </p>
                        <button
                          className="admin-btn-primary"
                          onClick={() => void uploadFile(match.id)}
                          disabled={uploading || !videoFile}
                          style={{ alignSelf: "flex-start", minWidth: 130 }}
                        >
                          {uploading
                            ? <><Loader2 size={13} className="spin" style={{ marginRight: 5 }} />Uploading…</>
                            : "Upload & Go Live"}
                        </button>
                        {fileMsg && (
                          <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13, color: fileMsg.ok ? "#388e3c" : "var(--ipl-red)" }}>
                            {fileMsg.ok ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
                            {fileMsg.text}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      <style>{`
        @keyframes lpulse {
          0%,100% { opacity:1; transform:scale(1); }
          50%      { opacity:0.4; transform:scale(0.8); }
        }
      `}</style>

      <div style={{ marginBottom: 8 }}>
        <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--primary)" }}>
          Management
        </span>
      </div>
      <h1 style={{ fontFamily: "'Oswald',sans-serif", fontSize: 32, fontWeight: 700, color: "var(--text-main)", textTransform: "uppercase", letterSpacing: "0.02em", marginBottom: 28 }}>
        Live Video
      </h1>

      {/* Description + refresh bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 10 }}>
        <p style={{ fontSize: 13, color: "var(--text-secondary)", maxWidth: 560 }}>
          Attach a YouTube URL or upload a video file to any match. The video appears on the public Live Video page instantly. Auto-refreshes every 15 s.
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {lastRefresh && (
            <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>
              Updated {lastRefresh.toLocaleTimeString()}
            </span>
          )}
          <button
            className="admin-btn-secondary"
            onClick={() => void load()}
            disabled={loading}
            style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}
          >
            {loading ? <Loader2 size={13} className="spin" /> : <RefreshCw size={13} />}
            Refresh
          </button>
        </div>
      </div>

      {loading && matches.length === 0 ? (
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "40px 0" }}>
          <Loader2 size={20} className="spin" />
          <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>Loading matches…</span>
        </div>
      ) : (
        <>
          {/* Always render all three sections — empty state shown inside each */}
          {renderSection("Live Now",  "#e53935", live)}
          {renderSection("Upcoming",  "#f57c00", upcoming)}
          {renderSection("Completed", "#388e3c", completed)}

          {matches.length === 0 && (
            <div className="admin-empty-state">
              <div className="admin-empty-icon"><Activity size={28} /></div>
              <p className="admin-empty-title">No matches found</p>
              <p className="admin-empty-desc">Create matches in the Scoring Admin first.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminLiveScoresPage;
