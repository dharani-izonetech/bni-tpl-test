import { ChangeEvent, DragEvent, useRef, useState } from "react";
import { Camera, CheckCircle2, ChevronDown, Loader2 } from "lucide-react";
import { createUser } from "../services/api";
import { getTeamShortFromTeamName, saveRegisteredPlayer } from "@/lib/registeredPlayersStorage";
import "./RegisterPage.css";

// ── Constants ──────────────────────────────────────────────────────────────
const TEAMS = [
  "BNI Azpire",
  "BNI Benchmark",
  "BNI Champions",
  "BNI Dynamic",
  "BNI Emperor",
  "BNI Fortune",
  "BNI Gladiators",
  "BNI Harmony",
  "BNI Icons",
  "BNI Jaaguar",
  "BNI Kings",
  "BNI Legends",
  "BNI Millionaire",
  "BNI Nest",
  "BNI Prince",
  "BNI Spark",
  "BNI Royals",
  "BNI Warriors",
  "BNI Oscar",
  "BNI Tycoon",
] as const;

const ROLES = ["Batsman", "Bowler", "All Rounder", "Wicket Keeper", "Player"] as const;
const MEMBERSHIP_YEARS = ["1","2","3","4","5","6","7","8","9","10"] as const;
const SIZES = ["S", "M", "L", "XL", "XXL"] as const;
const PHONE_RE = /^\d{10}$/;
const ACCEPTED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_FILE_BYTES = 5 * 1024 * 1024;
const TARGET_KB = 300; // compress to ~300 KB

// ── Image compressor ───────────────────────────────────────────────────────
async function compressImage(file: File): Promise<File> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement("canvas");
      // Scale down if wider than 1200px
      const MAX_DIM = 1200;
      let { width, height } = img;
      if (width > MAX_DIM || height > MAX_DIM) {
        const ratio = Math.min(MAX_DIM / width, MAX_DIM / height);
        width  = Math.round(width  * ratio);
        height = Math.round(height * ratio);
      }
      canvas.width  = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, width, height);

      // Binary-search for quality that hits ~TARGET_KB
      let lo = 0.1, hi = 0.92, quality = 0.75;
      const tryQuality = (q: number) =>
        new Promise<Blob | null>(res => canvas.toBlob(res, "image/jpeg", q));

      (async () => {
        for (let i = 0; i < 6; i++) {
          const blob = await tryQuality(quality);
          if (!blob) break;
          const kb = blob.size / 1024;
          if (kb <= TARGET_KB + 20) { hi = quality; }
          else                       { lo = quality; }
          quality = (lo + hi) / 2;
        }
        const finalBlob = await tryQuality(hi);
        if (!finalBlob) { resolve(file); return; }
        resolve(new File([finalBlob], file.name.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg" }));
      })();
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
    img.src = url;
  });
}

// ── Form types ─────────────────────────────────────────────────────────────
type FormState = {
  team: string;
  name: string;
  phone: string;
  jerseyName: string;
  jerseyNumber: string;
  jerseySize: string;
  lowerSize: string;
  business: string;
  category: string;
  role: string;
  membershipYears: string;
  photo: File | null;
};

type FormErrors = Partial<Record<keyof FormState, string>>;

const BLANK: FormState = {
  team: "", name: "", phone: "",
  jerseyName: "", jerseyNumber: "",
  jerseySize: "", lowerSize: "",
  business: "", category: "",
  role: "", membershipYears: "",
  photo: null,
};

function validate(f: FormState): FormErrors {
  const e: FormErrors = {};
  if (!f.team)              e.team         = "Please select a team.";
  if (!f.name.trim())       e.name         = "Player name is required.";
  if (!f.phone.trim())      e.phone        = "Phone number is required.";
  else if (!PHONE_RE.test(f.phone)) e.phone = "Enter exactly 10 digits.";
  if (!f.jerseyName.trim()) e.jerseyName   = "Jersey name is required.";
  if (!f.jerseyNumber.trim()) e.jerseyNumber = "Jersey number is required.";
  if (!f.jerseySize)        e.jerseySize   = "Select jersey size.";
  if (!f.lowerSize)         e.lowerSize    = "Select lower size.";
  return e;
}

// ── Component ──────────────────────────────────────────────────────────────
const RegisterPage = () => {
  const [form,    setForm]    = useState<FormState>(BLANK);
  const [errors,  setErrors]  = useState<FormErrors>({});
  const [preview, setPreview] = useState<string | null>(null);
  const [compressedSize, setCompressedSize] = useState<number | null>(null);
  const [busy,    setBusy]    = useState(false);
  const [done,    setDone]    = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const set = <K extends keyof FormState>(key: K, val: FormState[K]) => {
    setForm(p => ({ ...p, [key]: val }));
    setErrors(p => { const n = { ...p }; delete n[key]; return n; });
  };

  const handlePhoto = async (file: File) => {
    if (!ACCEPTED_MIME.has(file.type)) {
      setErrors(p => ({ ...p, photo: "Only JPG, PNG or WEBP allowed." }));
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setErrors(p => ({ ...p, photo: "Max file size is 5 MB." }));
      return;
    }
    // Compress
    const compressed = await compressImage(file);
    setCompressedSize(Math.round(compressed.size / 1024));
    set("photo", compressed);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(URL.createObjectURL(compressed));
  };

  const onFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) void handlePhoto(f);
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
    const f = e.dataTransfer.files?.[0];
    if (f) void handlePhoto(f);
  };

  const submit = async () => {
    const errs = validate(form);
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setBusy(true);
    try {
      const teamShort = getTeamShortFromTeamName(form.team);
      if (!teamShort) throw new Error("Invalid team selected.");

      const payload = new FormData();
      payload.append("name",            form.name.trim());
      payload.append("business",        form.business.trim() || form.jerseyName.trim());
      payload.append("category",        form.category.trim() || "Player");
      payload.append("phone_no",        `+91${form.phone}`);
      payload.append("team_name",       form.team);
      payload.append("role",            form.role || "Player");
      payload.append("jersey_number",   form.jerseyNumber.trim());
      payload.append("jersey_size",     form.jerseySize);
      payload.append("track_pant_size", form.lowerSize);
      if (form.membershipYears) payload.append("membership_years", form.membershipYears);
      if (form.photo) payload.append("photo", form.photo);

      await createUser(payload);

      // Update local cache
      saveRegisteredPlayer({
        name:           form.name.trim(),
        teamName:       form.team,
        teamShort,
        role:           form.role || "Player",
        business:       form.business.trim() || form.jerseyName.trim(),
        category:       form.category.trim() || "Player",
        phone:          `+91${form.phone}`,
        photoDataUrl:   preview ?? "",
        membershipYears: form.membershipYears ? Number(form.membershipYears) : undefined,
        jerseyNumber:   form.jerseyNumber.trim(),
        jerseySize:     form.jerseySize,
        trackPantSize:  form.lowerSize,
      });

      setDone(true);
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Registration failed.");
    } finally {
      setBusy(false);
    }
  };

  // ── Success screen ──────────────────────────────────────────────────────
  if (done) {
    return (
      <div className="rp-wrap">
        <div className="rp-card fade-up success-card">
          <div className="success-icon"><CheckCircle2 size={52} /></div>
          <h2 className="rp-title">Registered!</h2>
          <p className="success-sub">
            {form.name} has been added to the {form.team} squad.
          </p>
          <div className="success-btns">
            <button className="ghost-btn" onClick={() => {
              if (preview) URL.revokeObjectURL(preview);
              setForm(BLANK); setErrors({}); setPreview(null);
              setCompressedSize(null); setDone(false);
            }}>
              Register Another Player
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Form ────────────────────────────────────────────────────────────────
  return (
    <div className="rp-wrap">
      <div className="rp-card fade-up">
        <h1 className="rp-title">Player Registration</h1>

        {/* Team */}
        <div className="field">
          <label className="field-label">TEAM / CHAPTER NAME <span className="req">*</span></label>
          <div className="select-wrap">
            <select
              className={`input select-input${errors.team ? " error" : ""}`}
              value={form.team}
              onChange={e => set("team", e.target.value)}
            >
              <option value="">— Select Team —</option>
              {TEAMS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <ChevronDown size={16} className="select-arrow" />
          </div>
          {errors.team && <p className="err-msg">{errors.team}</p>}
        </div>

        {/* Player name */}
        <div className="field">
          <label className="field-label">PLAYER NAME <span className="req">*</span></label>
          <input
            className={`input${errors.name ? " error" : ""}`}
            placeholder="Enter full name"
            value={form.name}
            onChange={e => set("name", e.target.value)}
          />
          {errors.name && <p className="err-msg">{errors.name}</p>}
        </div>

        {/* Phone */}
        <div className="field">
          <label className="field-label">PHONE NUMBER <span className="req">*</span></label>
          <div className="phone-wrap">
            <span className="phone-prefix">+91</span>
            <input
              className={`input phone-input${errors.phone ? " error" : ""}`}
              placeholder="10-digit mobile number"
              value={form.phone}
              onChange={e => set("phone", e.target.value.replace(/\D/g, "").slice(0, 10))}
              maxLength={10}
              type="tel"
              inputMode="numeric"
            />
          </div>
          {errors.phone && <p className="err-msg">{errors.phone}</p>}
        </div>

        {/* Jersey name + number */}
        <div className="field-grid2">
          <div className="field">
            <label className="field-label">JERSEY NAME <span className="req">*</span></label>
            <input
              className={`input${errors.jerseyName ? " error" : ""}`}
              placeholder="Name on jersey"
              value={form.jerseyName}
              onChange={e => set("jerseyName", e.target.value)}
            />
            {errors.jerseyName && <p className="err-msg">{errors.jerseyName}</p>}
          </div>
          <div className="field">
            <label className="field-label">JERSEY NUMBER <span className="req">*</span></label>
            <input
              className={`input${errors.jerseyNumber ? " error" : ""}`}
              placeholder="e.g. 7"
              value={form.jerseyNumber}
              onChange={e => set("jerseyNumber", e.target.value.replace(/\D/g, "").slice(0, 3))}
              maxLength={3}
              inputMode="numeric"
            />
            {errors.jerseyNumber && <p className="err-msg">{errors.jerseyNumber}</p>}
          </div>
        </div>

        {/* Jersey size + lower size */}
        <div className="field-grid2">
          <div className="field">
            <label className="field-label">JERSEY SIZE <span className="req">*</span></label>
            <div className="select-wrap">
              <select
                className={`input select-input${errors.jerseySize ? " error" : ""}`}
                value={form.jerseySize}
                onChange={e => set("jerseySize", e.target.value)}
              >
                <option value="">— Select Size —</option>
                {SIZES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <ChevronDown size={16} className="select-arrow" />
            </div>
            {errors.jerseySize && <p className="err-msg">{errors.jerseySize}</p>}
          </div>
          <div className="field">
            <label className="field-label">LOWER SIZE <span className="req">*</span></label>
            <div className="select-wrap">
              <select
                className={`input select-input${errors.lowerSize ? " error" : ""}`}
                value={form.lowerSize}
                onChange={e => set("lowerSize", e.target.value)}
              >
                <option value="">— Select Size —</option>
                {SIZES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <ChevronDown size={16} className="select-arrow" />
            </div>
            {errors.lowerSize && <p className="err-msg">{errors.lowerSize}</p>}
          </div>
        </div>

        {/* Role + Membership (optional) */}
        <div className="field-grid2">
          <div className="field">
            <label className="field-label">ROLE</label>
            <div className="select-wrap">
              <select
                className="input select-input"
                value={form.role}
                onChange={e => set("role", e.target.value)}
              >
                <option value="">— Select Role —</option>
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              <ChevronDown size={16} className="select-arrow" />
            </div>
          </div>
          <div className="field">
            <label className="field-label">BNI MEMBERSHIP YEARS</label>
            <div className="select-wrap">
              <select
                className="input select-input"
                value={form.membershipYears}
                onChange={e => set("membershipYears", e.target.value)}
              >
                <option value="">— Select Years —</option>
                {MEMBERSHIP_YEARS.map(y => (
                  <option key={y} value={y}>{y} {Number(y) === 1 ? "year" : "years"}</option>
                ))}
              </select>
              <ChevronDown size={16} className="select-arrow" />
            </div>
          </div>
        </div>

        {/* Business + Category (optional) */}
        <div className="field-grid2">
          <div className="field">
            <label className="field-label">BUSINESS</label>
            <input
              className="input"
              placeholder="Your business name"
              value={form.business}
              onChange={e => set("business", e.target.value)}
            />
          </div>
          <div className="field">
            <label className="field-label">CATEGORY</label>
            <input
              className="input"
              placeholder="Business category"
              value={form.category}
              onChange={e => set("category", e.target.value)}
            />
          </div>
        </div>

        {/* Photo upload */}
        <div className="field">
          <label className="field-label">
            PLAYER PHOTO{" "}
            <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0, color: "#888", fontSize: 11 }}>
              (OPTIONAL — JPEG / PNG / WEBP, MAX 5 MB)
            </span>
          </label>
          <div
            className={`photo-zone${dragActive ? " drag" : ""}${errors.photo ? " error" : ""}`}
            onClick={() => fileRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={onDrop}
          >
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={onFileInput}
              hidden
            />
            {preview ? (
              <>
                <img src={preview} alt="preview" className="photo-zone-preview" />
                <p className="photo-zone-hint" style={{ marginTop: 6 }}>
                  ✓ Compressed to {compressedSize} KB — click to change
                </p>
              </>
            ) : (
              <>
                <Camera size={32} className="photo-zone-icon" />
                <p className="photo-zone-label">Click to upload photo</p>
                <p className="photo-zone-hint">Auto-compressed to ~300 KB for fast upload</p>
              </>
            )}
          </div>
          {errors.photo && <p className="err-msg">{errors.photo}</p>}
        </div>

        {/* Submit */}
        <button
          className={`reg-btn${busy ? " busy" : ""}`}
          onClick={() => void submit()}
          disabled={busy}
        >
          {busy
            ? <><Loader2 size={18} className="spin" /> REGISTERING…</>
            : "REGISTER NOW"
          }
        </button>
      </div>
    </div>
  );
};

export default RegisterPage;
