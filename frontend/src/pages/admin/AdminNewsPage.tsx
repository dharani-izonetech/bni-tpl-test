import { FormEvent, useRef, useMemo, useState } from "react";
import {
  Edit3, Trash2, Save, X, Newspaper, PlusCircle,
  Eye, MapPin, Loader2, Upload, Image as ImageIcon,
} from "lucide-react";
import { useNews } from "@/hooks/useNews";
import { emptyNewsForm, type NewsFormValues, type NewsItem } from "@/lib/newsStorage";
import { apiFetch } from "@/lib/api";

const cloneForm = (v: NewsFormValues): NewsFormValues => JSON.parse(JSON.stringify(v));

/** Convert any YouTube URL variant to the embed format required by the iframe. */
function toYoutubeEmbed(url: string): string {
  if (!url.trim()) return url;
  if (url.includes("youtube.com/embed/")) return url;
  const shortMatch = url.match(/youtu\.be\/([^?&/]+)/);
  if (shortMatch) return `https://www.youtube.com/embed/${shortMatch[1]}`;
  const watchMatch = url.match(/[?&]v=([^&]+)/);
  if (watchMatch) return `https://www.youtube.com/embed/${watchMatch[1]}`;
  return url;
}

// ── Bilingual field helper ─────────────────────────────────────────────────

type LangTab = "en" | "ta";

const LANG_LABELS: Record<LangTab, string> = { en: "English", ta: "தமிழ்" };

function LangTabs({ active, onChange }: { active: LangTab; onChange: (l: LangTab) => void }) {
  return (
    <div style={{ display: "inline-flex", borderRadius: 6, border: "1px solid var(--surface-dim)", overflow: "hidden", marginBottom: 16 }}>
      {(["en", "ta"] as LangTab[]).map(l => (
        <button
          key={l}
          type="button"
          onClick={() => onChange(l)}
          style={{
            padding: "4px 14px",
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            border: "none",
            background: active === l ? "var(--primary)" : "transparent",
            color: active === l ? "#fff" : "var(--text-secondary)",
            transition: "background 0.15s",
          }}
        >
          {LANG_LABELS[l]}
        </button>
      ))}
    </div>
  );
}

// ── Component ──────────────────────────────────────────────────────────────

const AdminNewsPage = () => {
  const { newsItems, loading, error, addItem, editItem, removeItem } = useNews(true);

  const [form, setForm]           = useState<NewsFormValues>(() => cloneForm(emptyNewsForm));
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage]     = useState("");
  const [busy, setBusy]           = useState(false);
  const [lang, setLang]           = useState<LangTab>("en");   // active language tab

  const [imgUploading, setImgUploading] = useState(false);
  const [imgPreview, setImgPreview]     = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const stats = useMemo(() => ({
    total:  newsItems.length,
    views:  newsItems.reduce((s, i) => s + i.audience, 0),
    videos: newsItems.filter(i => i.mediaEmbedUrl.trim()).length,
  }), [newsItems]);

  // ── Field updaters ──────────────────────────────────────────────────────

  /** Update a LocalizedText field for the currently active language tab */
  const updateLocalized = (field: keyof NewsFormValues, value: string) => {
    setForm(prev => ({
      ...prev,
      [field]: { ...(prev[field] as { en: string; ta: string }), [lang]: value },
    }));
  };

  const resetForm = () => {
    setForm(cloneForm(emptyNewsForm));
    setEditingId(null);
    setMessage("");
    setImgPreview("");
  };

  const handleVideoUrlBlur = () => {
    setForm(prev => ({ ...prev, mediaEmbedUrl: toYoutubeEmbed(prev.mediaEmbedUrl) }));
  };

  // ── Image upload ────────────────────────────────────────────────────────

  const handleImageFile = async (file: File) => {
    if (!file.type.startsWith("image/")) { setMessage("Only image files are allowed."); return; }
    if (file.size > 10 * 1024 * 1024)   { setMessage("Image must be under 10 MB.");    return; }
    setImgUploading(true);
    setMessage("Uploading image...");
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("prefix", "news-story");
      const res = await apiFetch<{ data: { public_url: string } }>("/media/upload/image", {
        method: "POST",
        body: formData,
      });
      const url = res.data.public_url;
      setForm(prev => ({ ...prev, matchStoryImageUrl: url }));
      setImgPreview(url);
      setMessage("Image uploaded.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Image upload failed.");
    } finally {
      setImgUploading(false);
    }
  };

  // ── Submit ──────────────────────────────────────────────────────────────

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (editingId) { await editItem(editingId, form); setMessage("News updated."); }
      else           { await addItem(form);              setMessage("News added.");   }
      setForm(cloneForm(emptyNewsForm));
      setEditingId(null);
      setImgPreview("");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed to save news.");
    } finally {
      setBusy(false);
    }
  };

  const startEdit = (item: NewsItem) => {
    setForm({
      category: item.category,
      newsTitle:             { ...item.newsTitle },
      newsDescription:       { ...item.newsDescription },
      venue:                 { ...item.venue },
      matchTime:             { ...item.matchTime },
      status:                { ...item.status },
      audience:              item.audience,
      mediaEmbedUrl:         item.mediaEmbedUrl,
      matchStoryTitle:       { ...item.matchStoryTitle },
      matchStoryDescription: { ...item.matchStoryDescription },
      matchStoryImageUrl:    item.matchStoryImageUrl ?? "",
    });


    
    setImgPreview(item.matchStoryImageUrl ?? "");
    setEditingId(item.id);
    setMessage("Editing...");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const confirmRemove = async (item: NewsItem) => {
    if (!window.confirm(`Delete "${item.newsTitle.en}"?`)) return;
    try {
      await removeItem(item.id);
      if (editingId === item.id) resetForm();
      setMessage("Deleted.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Delete failed.");
    }
  };

  const msgColor =
    ["News added.", "News updated.", "Image uploaded.", "Deleted."].includes(message) ? "green"
    : message === "Editing..." ? "var(--primary)"
    : message ? "var(--ipl-red)"
    : undefined;

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div>
      <div style={{ marginBottom: 8 }}>
        <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--primary)" }}>Content</span>
      </div>
      <h1 style={{ fontFamily: "'Oswald',sans-serif", fontSize: 32, fontWeight: 700, color: "var(--text-main)", textTransform: "uppercase", letterSpacing: "0.02em", marginBottom: 28 }}>
        News Management
      </h1>

      {/* Stats */}
      <div className="admin-stats-grid" style={{ marginBottom: 24 }}>
        {[
          { label: "Total News",  value: stats.total,  icon: Newspaper  },
          { label: "Total Views", value: stats.views,  icon: Eye        },
          { label: "Video Posts", value: stats.videos, icon: PlusCircle },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="admin-stat-card">
              <div className="admin-stat-icon"><Icon size={20} /></div>
              <span className="admin-stat-label">{s.label}</span>
              <span className="admin-stat-value">{s.value}</span>
            </div>
          );
        })}
      </div>

      <div style={{ display: "grid", gap: 24, gridTemplateColumns: "1fr 380px" }}>

        {/* ── Form ── */}
        <form className="admin-form-card" onSubmit={e => { void handleSubmit(e); }}>
          <div style={{ marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 className="admin-table-title">{editingId ? "Edit News" : "Create News"}</h2>
            {editingId && <button type="button" className="admin-btn-secondary" onClick={resetForm}><X size={14} /> Cancel</button>}
          </div>

          {/* Language tab switcher */}
          <div style={{ marginBottom: 4 }}>
            <p style={{ fontSize: 11, color: "var(--text-secondary)", marginBottom: 6 }}>
              Fill in content for both languages. Switch tabs to enter each.
            </p>
            <LangTabs active={lang} onChange={setLang} />
          </div>

          <div className="admin-form-grid">

            {/* Title */}
            <div className="admin-form-field">
              <label className="admin-form-label">
                Title <span style={{ color: "var(--text-secondary)", fontWeight: 400 }}>({LANG_LABELS[lang]})</span>
              </label>
              <input
                className="admin-form-input"
                value={form.newsTitle[lang]}
                onChange={e => updateLocalized("newsTitle", e.target.value)}
                placeholder={lang === "ta" ? "தலைப்பு" : "News headline"}
                required={lang === "en"}
              />
            </div>

            {/* Description */}
            <div className="admin-form-field">
              <label className="admin-form-label">
                Description <span style={{ color: "var(--text-secondary)", fontWeight: 400 }}>({LANG_LABELS[lang]})</span>
              </label>
              <textarea
                className="admin-form-input admin-form-textarea"
                value={form.newsDescription[lang]}
                onChange={e => updateLocalized("newsDescription", e.target.value)}
                placeholder={lang === "ta" ? "விவரம்" : "Short description of the news"}
                required={lang === "en"}
              />
            </div>

            {/* Venue + Time */}
            <div className="admin-form-grid-2">
              <div className="admin-form-field">
                <label className="admin-form-label">
                  Venue <span style={{ color: "var(--text-secondary)", fontWeight: 400 }}>({LANG_LABELS[lang]})</span>
                </label>
                <input
                  className="admin-form-input"
                  value={form.venue[lang]}
                  onChange={e => updateLocalized("venue", e.target.value)}
                  placeholder={lang === "ta" ? "இடம்" : "Stadium / ground"}
                />
              </div>
              {/* <div className="admin-form-field">
                <label className="admin-form-label">
                  Time <span style={{ color: "var(--text-secondary)", fontWeight: 400 }}>({LANG_LABELS[lang]})</span>
                </label>
                <input
                  className="admin-form-input"
                  value={form.matchTime[lang]}
                  onChange={e => updateLocalized("matchTime", e.target.value)}
                  placeholder={lang === "ta" ? "நேரம்" : "e.g. 6:00 PM"}
                />
              </div> */}
            </div>

            {/* Status + Audience */}
            <div className="admin-form-grid-2">
              {/* <div className="admin-form-field">
                <label className="admin-form-label">
                  Status <span style={{ color: "var(--text-secondary)", fontWeight: 400 }}>({LANG_LABELS[lang]})</span>
                </label>
                <input
                  className="admin-form-input"
                  value={form.status[lang]}
                  onChange={e => updateLocalized("status", e.target.value)}
                  placeholder={lang === "ta" ? "நிலை" : "e.g. Video story available"}
                />
              </div> */}
              {/* <div className="admin-form-field">
                <label className="admin-form-label">Audience Count</label>
                <input
                  className="admin-form-input"
                  type="number"
                  min={0}
                  value={form.audience}
                  onChange={e => setForm(prev => ({ ...prev, audience: Number(e.target.value) }))}
                />
              </div> */}
            </div>

            {/* YouTube URL — language-independent */}
            <div className="admin-form-field">
              <label className="admin-form-label">YouTube / Video Embed URL</label>
              <input
                className="admin-form-input"
                value={form.mediaEmbedUrl}
                onChange={e => setForm(prev => ({ ...prev, mediaEmbedUrl: e.target.value }))}
                onBlur={handleVideoUrlBlur}
                placeholder="Paste any YouTube URL — auto-converted to embed format"
              />
              <p style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 4 }}>
                Paste a watch URL, short link, or embed URL — converted automatically.
              </p>
              {form.mediaEmbedUrl?.includes("youtube.com/embed/") && (
                <p style={{ fontSize: 11, color: "green", marginTop: 2, fontWeight: 600 }}>✓ Embed URL ready</p>
              )}
            </div>

            {/* Match Story Title */}
            <div className="admin-form-field">
              <label className="admin-form-label">
                Match Story Title <span style={{ color: "var(--text-secondary)", fontWeight: 400 }}>({LANG_LABELS[lang]})</span>
              </label>
              <input
                className="admin-form-input"
                value={form.matchStoryTitle[lang]}
                onChange={e => updateLocalized("matchStoryTitle", e.target.value)}
                placeholder={lang === "ta" ? "போட்டி கதை தலைப்பு" : "Match story headline"}
              />
            </div>

            {/* Match Story Image — language-independent */}
            <div className="admin-form-field">
              <label className="admin-form-label">Match Story Image</label>

              {imgPreview ? (
                <div style={{ position: "relative", marginBottom: 10 }}>
                  <img
                    src={imgPreview}
                    alt="Match story preview"
                    style={{ width: "100%", maxHeight: 200, objectFit: "cover", borderRadius: 8, border: "1px solid var(--surface-dim)" }}
                  />
                  <button
                    type="button"
                    onClick={() => { setImgPreview(""); setForm(prev => ({ ...prev, matchStoryImageUrl: "" })); }}
                    style={{ position: "absolute", top: 6, right: 6, background: "rgba(0,0,0,0.6)", color: "#fff", border: "none", borderRadius: "50%", width: 26, height: 26, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                    aria-label="Remove image"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div
                  role="button"
                  tabIndex={0}
                  style={{ border: "2px dashed var(--surface-dim)", borderRadius: 8, padding: "24px 16px", textAlign: "center", cursor: "pointer", background: "var(--surface-bg, #fafafa)" }}
                  onClick={() => fileInputRef.current?.click()}
                  onKeyDown={e => e.key === "Enter" && fileInputRef.current?.click()}
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) void handleImageFile(f); }}
                >
                  {imgUploading ? (
                    <><Loader2 size={22} className="spin" style={{ margin: "0 auto 8px" }} /><p style={{ fontSize: 13 }}>Uploading…</p></>
                  ) : (
                    <>
                      <ImageIcon size={28} style={{ margin: "0 auto 8px", color: "var(--primary)" }} />
                      <p style={{ fontSize: 13, fontWeight: 600 }}>Click to upload or drag & drop</p>
                      <p style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 4 }}>JPEG, PNG, WebP — max 2 MB</p>
                    </>
                  )}
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                style={{ display: "none" }}
                onChange={e => { const f = e.target.files?.[0]; if (f) void handleImageFile(f); e.target.value = ""; }}
              />

              <div style={{ marginTop: 10, display: "flex", gap: 8, alignItems: "center" }}>
                <Upload size={14} style={{ color: "var(--text-secondary)", flexShrink: 0 }} />
                <input
                  className="admin-form-input"
                  style={{ flex: 1 }}
                  placeholder="Or paste an image URL"
                  value={form.matchStoryImageUrl.startsWith("data:") ? "" : form.matchStoryImageUrl}
                  onChange={e => { const url = e.target.value; setForm(prev => ({ ...prev, matchStoryImageUrl: url })); setImgPreview(url); }}
                />
              </div>
              <p style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 4 }}>
                Leave blank to use the default cricket banner image.
              </p>
            </div>

            {/* Match Story Description */}
            <div className="admin-form-field">
              <label className="admin-form-label">
                Match Story Description <span style={{ color: "var(--text-secondary)", fontWeight: 400 }}>({LANG_LABELS[lang]})</span>
              </label>
              <textarea
                className="admin-form-input admin-form-textarea"
                value={form.matchStoryDescription[lang]}
                onChange={e => updateLocalized("matchStoryDescription", e.target.value)}
                placeholder={lang === "ta" ? "போட்டி விவரம்" : "Full match story text"}
              />
            </div>

          </div>{/* end admin-form-grid */}

          <div className="admin-form-actions">
            <button type="submit" className="admin-btn-primary" disabled={busy || imgUploading}>
              {busy
                ? <><Loader2 size={15} className="spin" /> Saving…</>
                : <><Save size={15} /> {editingId ? "Update" : "Add News"}</>}
            </button>
            <button type="button" className="admin-btn-secondary" onClick={resetForm}>
              <Trash2 size={15} /> Clear
            </button>
            {message && (
              <span style={{ fontSize: 13, fontWeight: 600, color: msgColor }}>{message}</span>
            )}
          </div>
        </form>

        {/* ── News list ── */}
        <div className="admin-form-card" style={{ alignSelf: "start", maxHeight: "80vh", overflowY: "auto" }}>
          <h2 className="admin-table-title" style={{ marginBottom: 16 }}>
            Published ({newsItems.length})
            {loading && <Loader2 size={14} className="spin" style={{ display: "inline", marginLeft: 6 }} />}
          </h2>
          {error && <p style={{ color: "var(--ipl-red)", fontSize: 13 }}>{error}</p>}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {newsItems.map(item => (
              <div key={item.id} style={{ border: "1px solid var(--surface-dim)", borderRadius: 12, padding: 16 }}>
                <h3 style={{ fontFamily: "'Oswald',sans-serif", fontSize: 16, fontWeight: 600, color: "var(--text-main)", marginBottom: 2 }}>
                  {item.newsTitle.en}
                </h3>
                {item.newsTitle.ta && (
                  <p style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 6 }}>{item.newsTitle.ta}</p>
                )}
                <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5, marginBottom: 8, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                  {item.newsDescription.en}
                </p>
                <div style={{ display: "flex", gap: 8, fontSize: 11, color: "var(--text-secondary)", marginBottom: 12 }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}><MapPin size={12} /> {item.venue.en}</span>
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Eye size={12} /> {item.audience}</span>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="admin-btn-icon" onClick={() => startEdit(item)} title="Edit"><Edit3 size={14} /></button>
                  <button className="admin-btn-icon danger" onClick={() => void confirmRemove(item)} title="Delete"><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminNewsPage;
