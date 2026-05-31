"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api";
import { getUser } from "@/lib/auth";
import {
  Upload, Camera, Film, ChevronDown, ChevronUp,
  Eye, EyeOff, Lock, Globe, Users, Shield, Link2,
  Wand2, Loader2, CheckCircle2, AlertCircle, ArrowLeft,
  Music, Mic, Dumbbell, Clapperboard, Info, X,
} from "lucide-react";
import { ReelRecorder } from "@/components/artstage/reels/ReelRecorder";
import { CaptionEditor, Caption } from "@/components/artstage/reels/CaptionEditor";
import { MultiClipEditor, Clip } from "@/components/artstage/reels/MultiClipEditor";
import Link from "next/link";

/* ─── types ─── */
interface DisciplineField {
  key: string;
  label: string;
  placeholder?: string;
  type?: "text" | "select";
  options?: string[];
}

const REEL_TYPES = [
  { value: "reel", label: "Short Reel", icon: Film, limit: "≤ 90s", desc: "Bite-sized performance clip" },
  { value: "monologue", label: "Monologue", icon: Clapperboard, limit: "≤ 10m", desc: "Dramatic or comedic scene work" },
  { value: "song", label: "Song / Musical", icon: Music, limit: "≤ 10m", desc: "Vocal or instrumental performance" },
  { value: "dance", label: "Dance", icon: Dumbbell, limit: "≤ 10m", desc: "Choreography or freestyle" },
  { value: "comedy", label: "Comedy", icon: Clapperboard, limit: "≤ 10m", desc: "Stand-up, sketch or improv" },
  { value: "cover", label: "Cover", icon: Music, limit: "≤ 10m", desc: "Song or scene cover" },
  { value: "voice_demo", label: "Voice Demo", icon: Mic, limit: "≤ 30m", desc: "Commercial, character or narration" },
];

const DISCIPLINE_FIELDS: Record<string, DisciplineField[]> = {
  monologue: [
    { key: "language", label: "Language", placeholder: "English" },
    { key: "accent", label: "Accent / Dialect", placeholder: "e.g. RP, Southern American" },
    { key: "role_context", label: "Role / Character", placeholder: "e.g. Hamlet, Act II" },
    { key: "scene_partners", label: "Scene Partners", placeholder: "Names of other actors" },
    { key: "source_material", label: "Source Material", placeholder: "Play / Film / Original" },
  ],
  song: [
    { key: "song_title", label: "Song Title", placeholder: "e.g. Defying Gravity" },
    { key: "key", label: "Key", placeholder: "e.g. Bb Major" },
    { key: "tempo", label: "Tempo (BPM)", placeholder: "e.g. 120" },
    { key: "language", label: "Language", placeholder: "English" },
    { key: "source_material", label: "Show / Album", placeholder: "Wicked, original cast" },
  ],
  dance: [
    { key: "choreographer", label: "Choreographer", placeholder: "Name or 'Self'" },
    { key: "music", label: "Music Track", placeholder: "Artist — Song" },
    { key: "style", label: "Style", placeholder: "e.g. Contemporary, Hip-Hop, Ballet" },
    { key: "source_material", label: "Production / Context", placeholder: "e.g. SYTYCD Season 12" },
  ],
  voice_demo: [
    { key: "language", label: "Language", placeholder: "English" },
    { key: "accent", label: "Accent", placeholder: "e.g. General American" },
    { key: "role_context", label: "Demo Type", placeholder: "e.g. Commercial, Character, Audiobook" },
  ],
  reel: [
    { key: "role_context", label: "Context / Notes", placeholder: "Brief description of this clip" },
  ],
  comedy: [
    { key: "role_context", label: "Format", placeholder: "Stand-up, Sketch, Improv…" },
    { key: "source_material", label: "Venue / Show", placeholder: "e.g. The Comedy Store" },
  ],
  cover: [
    { key: "song_title", label: "Original Song", placeholder: "Artist — Song title" },
    { key: "language", label: "Language", placeholder: "English" },
  ],
};

const VISIBILITY_OPTIONS = [
  { value: "public", label: "Public", icon: Globe, desc: "Visible to everyone" },
  { value: "platform_only", label: "Platform Only", icon: Users, desc: "Visible to StageLink members" },
  { value: "industry_only", label: "Industry Only", icon: Shield, desc: "Visible to verified hirers & scouts" },
  { value: "scout_only", label: "Scout Only (with expiry)", icon: Eye, desc: "Expires on set date" },
  { value: "link_only", label: "Link Only", icon: Link2, desc: "Only accessible via direct link" },
  { value: "private", label: "Private", icon: Lock, desc: "Only visible to you" },
];

/* ─── helper ─── */
function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[var(--as-surface)]/5 p-5 flex flex-col gap-4">
      <h3 className="text-sm font-bold text-white/80 uppercase tracking-widest">{title}</h3>
      {children}
    </div>
  );
}

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-white/60 flex items-center gap-1">
        {label}
        {hint && (
          <span className="group relative cursor-help">
            <Info className="w-3 h-3 opacity-40" />
            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 w-48 bg-black/90 text-white/80 text-[10px] rounded-lg px-2.5 py-1.5 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10 text-center shadow-xl">
              {hint}
            </span>
          </span>
        )}
      </label>
      {children}
    </div>
  );
}

const inputCls =
  "w-full px-3.5 py-2.5 rounded-xl border border-white/15 bg-[var(--as-surface)]/5 text-white text-sm outline-none focus:border-[#a9000f] focus:bg-[var(--as-surface)]/8 transition-all placeholder:text-white/25";

/* ─── page ─── */
export default function ReelUploadPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* auth guard */
  useEffect(() => {
    if (!getUser()) router.replace("/login");
  }, [router]);

  /* source mode: record | upload | multi */
  const [sourceMode, setSourceMode] = useState<"upload" | "record" | "multi">("upload");

  /* core reel state */
  const [reelType, setReelType] = useState("reel");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [visibility, setVisibility] = useState("public");
  const [scoutExpiresAt, setScoutExpiresAt] = useState("");
  const [downloadAllowed, setDownloadAllowed] = useState(false);
  const [watermarkEnabled, setWatermarkEnabled] = useState(true);
  const [disciplineMeta, setDisciplineMeta] = useState<Record<string, string>>({});
  const [productionCredits, setProductionCredits] = useState("");

  /* video */
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [duration, setDuration] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  /* multi-clip */
  const [clips, setClips] = useState<Clip[]>([]);
  const [clipTotalDuration, setClipTotalDuration] = useState(0);

  /* captions */
  const [captions, setCaptions] = useState<Caption[]>([]);
  const [autoTranscribing, setAutoTranscribing] = useState(false);
  const [transcription, setTranscription] = useState("");

  /* UI state */
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const selectedType = REEL_TYPES.find((t) => t.value === reelType)!;
  const disciplineFields = DISCIPLINE_FIELDS[reelType] || [];

  /* ── file handling ── */
  const handleFileChange = useCallback((file: File) => {
    if (!file.type.startsWith("video/")) { setError("Please select a video file."); return; }
    setError(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    const url = URL.createObjectURL(file);
    setVideoFile(file);
    setPreviewUrl(url);

    const v = document.createElement("video");
    v.preload = "metadata";
    v.onloadedmetadata = () => { setDuration(Math.floor(v.duration)); URL.revokeObjectURL(v.src); };
    v.src = url;
  }, [previewUrl]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFileChange(file);
  };

  /* ── recorder callback ── */
  const handleRecordingComplete = useCallback((blob: Blob, dur: number) => {
    const url = URL.createObjectURL(blob);
    const file = new File([blob], `recorded_${Date.now()}.webm`, { type: "video/webm" });
    setVideoFile(file);
    setPreviewUrl(url);
    setDuration(Math.floor(dur));
  }, []);

  /* ── auto-transcription stub ── */
  const triggerAutoTranscribe = async () => {
    setAutoTranscribing(true);
    await new Promise((r) => setTimeout(r, 2000)); // Simulated delay
    const demoTranscript = "Auto-transcription requires a speech-to-text integration (e.g. Whisper API). This is a placeholder.";
    setTranscription(demoTranscript);
    // Generate placeholder captions
    const words = demoTranscript.split(" ");
    const perWord = duration > 0 ? duration / words.length : 0.5;
    const caps: Caption[] = [];
    let t = 0;
    for (let i = 0; i < words.length; i += 6) {
      const chunk = words.slice(i, i + 6).join(" ");
      caps.push({ start: parseFloat(t.toFixed(1)), end: parseFloat((t + perWord * 6).toFixed(1)), text: chunk });
      t += perWord * 6;
    }
    setCaptions(caps);
    setAutoTranscribing(false);
  };

  /* ── submit ── */
  const handleSubmit = async () => {
    if (!title.trim()) { setError("Please enter a title."); return; }
    if (!videoUrl.trim() && !videoFile && clips.length === 0) {
      setError("Please provide a video — record, upload, or add clips."); return;
    }
    setSubmitting(true);
    setError(null);

    try {
      const effectiveDuration = sourceMode === "multi" ? clipTotalDuration : duration;

      let finalUrl = videoUrl.trim();
      if (!finalUrl && videoFile) {
        const formData = new FormData();
        formData.append("file", videoFile, videoFile.name);
        const upRes = await apiClient.postForm<{ url: string }>("/upload/", formData);
        finalUrl = upRes.url;
      }
      if (!finalUrl) { setError("No video source — record, upload, or paste a URL."); setSubmitting(false); return; }

      await apiClient.post("/reels/", {
        title: title.trim(),
        type: reelType,
        description: description.trim(),
        video_url: finalUrl,
        thumbnail_url: "",
        duration: effectiveDuration,
        visibility,
        scout_expires_at: visibility === "scout_only" ? scoutExpiresAt || null : null,
        has_captions: captions.length > 0,
        download_allowed: downloadAllowed,
        watermark_enabled: watermarkEnabled,
        transcription,
        captions,
        audio_waveform: [],
        metadata: {
          ...disciplineMeta,
          year,
          production_credits: productionCredits,
        },
      });

      setSuccess(true);
      setTimeout(() => router.push("/reels"), 2000);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } } };
      setError(err?.response?.data?.detail || "Failed to publish reel. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="artstage min-h-[calc(100vh-56px)] bg-[var(--as-bg)] flex items-center justify-center">
        <div className="text-center flex flex-col items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold text-white">Reel Published!</h2>
          <p className="text-white/50 text-sm">Redirecting to your reels…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row bg-[var(--as-bg)] font-[var(--font-outfit)] min-h-[calc(100vh-73px)] relative">
      
      {/* ── LEFT PANEL (Camera/Preview) ── */}
      <section className="sticky top-[73px] w-full md:w-1/2 h-[50vh] md:h-[calc(100vh-73px)] bg-black flex flex-col border-b md:border-b-0 md:border-r border-white/10 shrink-0 z-20">
        <div className="absolute top-4 left-4 z-40">
          <Link href="/reels" className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-md text-white/80 hover:text-white transition-colors text-xs font-semibold border border-white/10">
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </Link>
        </div>

        {/* Source Mode Tabs on top */}
        <div className="absolute top-4 right-4 z-40 bg-black/50 backdrop-blur-md p-1 rounded-xl border border-white/10 flex gap-1">
          {(["upload", "record", "multi"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setSourceMode(mode)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
                sourceMode === mode
                  ? "bg-[#ffd700] text-[#131314] shadow-md"
                  : "text-white/60 hover:text-white"
              }`}
            >
              {mode === "upload" ? "Upload" : mode === "record" ? "Record" : "Multi"}
            </button>
          ))}
        </div>

        {/* Video Area (Flex grow) */}
        <div className="flex-1 flex flex-col overflow-y-auto pb-24 relative justify-center items-center" style={{ scrollbarWidth: 'none' }}>
          {/* Upload */}
          {sourceMode === "upload" && (
            <div className="w-full h-full flex flex-col items-center justify-center p-8">
              {previewUrl ? (
                <video src={previewUrl} controls className="w-full h-full object-contain bg-black" />
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                  className="w-full max-w-[220px] sm:max-w-[260px] aspect-[9/16] border-2 border-dashed border-white/15 hover:border-[#ffd700]/60 rounded-3xl p-6 flex flex-col items-center justify-center gap-4 cursor-pointer transition-colors group bg-white/5 shrink-0"
                >
                  <div className="w-16 h-16 rounded-full bg-white/5 group-hover:bg-[#ffd700]/20 flex items-center justify-center transition-colors">
                    <Upload className="w-8 h-8 text-white/40 group-hover:text-[#ffd700] transition-colors" />
                  </div>
                  <p className="text-white/60 text-sm text-center">
                    Drag &amp; drop or <span className="text-[#ffd700] font-semibold">browse</span>
                  </p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
              />
              {!previewUrl && (
                <div className="w-full max-w-sm mt-6 shrink-0">
                  <Field label="Or paste a video URL">
                    <input
                      className={inputCls}
                      placeholder="https://..."
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                    />
                  </Field>
                </div>
              )}
            </div>
          )}

          {/* Record */}
          {sourceMode === "record" && (
             <div className="w-full h-full flex items-center justify-center p-4">
                <div className="w-full max-w-[220px] sm:max-w-[260px] shrink-0">
                   <ReelRecorder reelType={reelType} onRecordingComplete={handleRecordingComplete} />
                </div>
             </div>
          )}

          {/* Multi-Clip */}
          {sourceMode === "multi" && (
            <div className="w-full h-full p-4 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
               <MultiClipEditor
                 reelType={reelType}
                 onClipsChange={(c, total) => { setClips(c); setClipTotalDuration(total); }}
               />
            </div>
          )}
        </div>

        {/* Clip Type Selector at Bottom */}
        <div className="p-4 bg-gradient-to-t from-black to-transparent absolute bottom-0 left-0 right-0 pointer-events-none">
           <div className="pointer-events-auto overflow-x-auto flex gap-2 pb-2" style={{ scrollbarWidth: 'none' }}>
              {REEL_TYPES.map((t) => {
                  const Icon = t.icon;
                  const active = reelType === t.value;
                  return (
                    <button
                      key={t.value}
                      onClick={() => { setReelType(t.value); setDisciplineMeta({}); }}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-full shrink-0 border transition-all ${
                        active
                          ? "border-[#ffd700] bg-[#ffd700]/10 text-[#ffd700]"
                          : "border-white/10 bg-black/40 backdrop-blur-md text-white/60 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-xs font-bold whitespace-nowrap">{t.label}</span>
                    </button>
                  );
              })}
           </div>
        </div>
      </section>

      {/* ── RIGHT PANEL (Form) ── */}
      <section className="relative w-full md:w-1/2 bg-[var(--as-bg)] flex flex-col justify-between min-h-[50vh]">
         <div className="p-6 md:p-10 max-w-2xl mx-auto flex flex-col gap-8 flex-1">
            
            <div className="mb-2">
               <h1 className="text-2xl font-bold font-[var(--font-syne)] text-[var(--as-text)]">Reel Details</h1>
               <p className="text-sm text-white/40 mt-1">Provide information about your performance to help industry professionals find you.</p>
            </div>

            {error && (
              <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 rounded-2xl px-4 py-3 text-red-400 text-sm">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>{error}</span>
                <button onClick={() => setError(null)} className="ml-auto"><X className="w-4 h-4" /></button>
              </div>
            )}

            {/* ── CORE METADATA ── */}
            <SectionCard title="Details">
              <Field label="Title *">
                <input className={inputCls} placeholder={`My ${selectedType.label}`} value={title} onChange={(e) => setTitle(e.target.value)} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Year">
                  <input className={inputCls} type="number" min="1900" max="2099" value={year} onChange={(e) => setYear(e.target.value)} />
                </Field>
              </div>
              <Field label="Description / Bio note">
                <textarea
                  className={inputCls + " resize-none"}
                  rows={3}
                  placeholder="Briefly describe this clip — production, role, or context…"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </Field>
            </SectionCard>


            {/* ── PRIVACY ── */}
            <SectionCard title="Privacy &amp; Distribution">
              <div className="grid grid-cols-1 gap-2">
                {VISIBILITY_OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  const active = visibility === opt.value;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => setVisibility(opt.value)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all ${
                        active
                          ? "border-[#ffd700] bg-[#ffd700]/10"
                          : "border-white/10 bg-[var(--as-surface)]/5 hover:border-white/20"
                      }`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${active ? "text-[#ffd700]" : "text-white/40"}`} />
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold ${active ? "text-white" : "text-white/70"}`}>{opt.label}</p>
                        <p className="text-white/35 text-xs">{opt.desc}</p>
                      </div>
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${active ? "border-[#ffd700]" : "border-white/20"}`}>
                        {active && <div className="w-2 h-2 rounded-full bg-[#ffd700]" />}
                      </div>
                    </button>
                  );
                })}
              </div>

              {visibility === "scout_only" && (
                <Field label="Scout Access Expiry" hint="After this date scouts can no longer view the clip">
                  <input
                    type="date"
                    className={inputCls}
                    value={scoutExpiresAt}
                    onChange={(e) => setScoutExpiresAt(e.target.value)}
                  />
                </Field>
              )}

              {/* Download permission toggle */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--as-surface)]/5 border border-white/10">
                <div>
                  <p className="text-sm font-semibold text-white/80">Allow Downloads</p>
                  <p className="text-xs text-white/40">Viewers can download this clip</p>
                </div>
                <button
                  onClick={() => setDownloadAllowed((v) => !v)}
                  className={`relative w-11 h-6 rounded-full transition-colors ${downloadAllowed ? "bg-[#ffd700]" : "bg-[var(--as-surface)]/15"}`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-[var(--as-bg)] shadow transition-all ${downloadAllowed ? "left-6" : "left-1"}`} />
                </button>
              </div>

              {/* Watermark toggle */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--as-surface)]/5 border border-white/10">
                <div>
                  <p className="text-sm font-semibold text-white/80">Watermark</p>
                  <p className="text-xs text-white/40">Overlay StageLink branding on playback</p>
                </div>
                <button
                  onClick={() => setWatermarkEnabled((v) => !v)}
                  className={`relative w-11 h-6 rounded-full transition-colors ${watermarkEnabled ? "bg-[#ffd700]" : "bg-[var(--as-surface)]/15"}`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-[var(--as-bg)] shadow transition-all ${watermarkEnabled ? "left-6" : "left-1"}`} />
                </button>
              </div>
            </SectionCard>

            {/* ── ADVANCED ── */}
            <button
              onClick={() => setShowAdvanced((v) => !v)}
              className="flex items-center gap-2 text-white/40 hover:text-white/60 text-xs transition-colors w-fit"
            >
              {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              {showAdvanced ? "Hide" : "Show"} Advanced Options
            </button>

            {showAdvanced && (
              <SectionCard title="Advanced">
                <Field label="Duration Override (seconds)" hint="Only needed if the system cannot detect duration automatically">
                  <input
                    type="number"
                    className={inputCls}
                    value={duration || ""}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    placeholder="Auto-detected"
                  />
                </Field>
              </SectionCard>
            )}

         </div>

         {/* Sticky Footer */}
         <div className="sticky bottom-0 left-0 right-0 p-4 bg-[var(--as-bg)]/90 backdrop-blur-xl border-t border-white/5 flex items-center justify-between z-10 mt-8">
            <p className="text-[11px] text-white/40 ml-2 hidden sm:block">Please ensure you have rights to upload this content.</p>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-8 py-3 rounded-full bg-gradient-to-r from-[#ffd700] to-[#e9c400] text-[#131314] font-bold text-sm flex items-center gap-2 disabled:opacity-50 hover:shadow-[0_0_15px_rgba(255,215,0,0.3)] transition-all ml-auto"
            >
               {submitting ? <Loader2 className="w-4 h-4 animate-spin text-[#131314]" /> : <Upload className="w-4 h-4 text-[#131314]" />}
               Publish Reel
            </button>
         </div>
      </section>

      <style>{`
        input[type=date]::-webkit-calendar-picker-indicator { filter: invert(1) opacity(0.4); }
      `}</style>
    </div>
  );
}
