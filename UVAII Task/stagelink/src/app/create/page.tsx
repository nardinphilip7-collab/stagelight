"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api";
import { getUser } from "@/lib/auth";
import { uploadFile } from "@/lib/upload";
import {
  Check, Radio, Loader2, Upload, Video, Link2, Camera,
  X, ImageIcon, StopCircle, Play,
  Sparkles, FileText, Film, Globe, Music, Mic, Smile,
  Clapperboard, BookOpen, Headphones, Zap, Tag, MessageSquare,
  Settings2, Users, Briefcase, Eye, Info, Drama,
} from "lucide-react";

type Tab = "post" | "reel" | "live";
type VideoSource = "upload" | "record" | "url";
type UploadState = "idle" | "uploading" | "done" | "error";
type RecordState = "idle" | "requesting" | "recording" | "uploading" | "done" | "error";

const POST_CATEGORIES = ["General", "Acting", "Music", "Dance", "Voiceover", "Comedy", "Production"];

const REEL_TYPES = [
  { value: "monologue", label: "Monologue" },
  { value: "song", label: "Song" },
  { value: "dance", label: "Dance" },
  { value: "voice_demo", label: "Voice Demo" },
  { value: "comedy", label: "Comedy" },
  { value: "reel", label: "Showreel" },
  { value: "cover", label: "Cover" },
];

const VISIBILITY_OPTIONS = [
  { value: "public", label: "Public", desc: "Visible to everyone" },
  { value: "platform_only", label: "Platform Only", desc: "StageLink members only" },
  { value: "industry_only", label: "Industry Only", desc: "Verified hirers & agencies" },
  { value: "scout_only", label: "Scout Only", desc: "Industry scouts with link" },
];

const LIVE_VISIBILITY_OPTIONS = [
  { value: "public", label: "Public", desc: "Visible to everyone" },
  { value: "platform_only", label: "Platform Only", desc: "StageLink members only" },
  { value: "industry_only", label: "Industry Only", desc: "Verified hirers & agencies" },
];

const VISIBILITY_ICONS: Record<string, React.ElementType> = {
  public: Globe,
  platform_only: Users,
  industry_only: Briefcase,
  scout_only: Eye,
};

const POST_CATEGORY_ICONS: Record<string, React.ElementType> = {
  General: Globe,
  Acting: Drama,
  Music: Music,
  Dance: Zap,
  Voiceover: Mic,
  Comedy: Smile,
  Production: Clapperboard,
};

const REEL_TYPE_ICONS: Record<string, React.ElementType> = {
  monologue: BookOpen,
  song: Music,
  dance: Zap,
  voice_demo: Mic,
  comedy: Smile,
  reel: Film,
  cover: Headphones,
};

type LiveResult = { id: number; title: string; scheduled_for: string | null; is_live: boolean };

// ── Shared helpers ────────────────────────────────────────────────────────────

const inputCls = "w-full px-3 py-2.5 rounded-xl border border-[var(--as-border)] bg-[var(--as-bg)] text-sm text-[var(--as-text)] outline-none focus:border-[var(--as-accent)] focus:ring-2 focus:ring-[var(--as-accent)]/10 transition-all";
const labelCls = "block text-[11px] font-bold uppercase tracking-wider text-[var(--as-text-muted)] mb-1.5";

function SectionHeader({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <Icon className="w-4 h-4 text-[var(--as-accent)]" />
      <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--as-text-muted)]">{title}</span>
    </div>
  );
}

// ── Camera snapshot widget ────────────────────────────────────────────────────
function CameraSnapshotWidget({
  onCapture,
  onCancel,
}: {
  onCapture: (url: string) => void;
  onCancel: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [state, setState] = useState<"starting" | "live" | "uploading" | "error">("starting");
  const [errMsg, setErrMsg] = useState("");

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => {
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
        setState("live");
      })
      .catch(() => { setErrMsg("Camera permission denied or not available."); setState("error"); });
    return () => { streamRef.current?.getTracks().forEach((t) => t.stop()); };
  }, []);

  async function capture() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    setState("uploading");
    canvas.toBlob(async (blob) => {
      if (!blob) { setState("error"); setErrMsg("Capture failed."); return; }
      try {
        const file = new File([blob], "photo.jpg", { type: "image/jpeg" });
        const url = await uploadFile(file);
        onCapture(url);
      } catch { setState("error"); setErrMsg("Upload failed."); }
    }, "image/jpeg", 0.85);
  }

  return (
    <div style={{ border: "1px solid var(--as-border)", borderRadius: "14px", overflow: "hidden", backgroundColor: "#000", position: "relative" }}>
      <video ref={videoRef} autoPlay playsInline muted style={{ width: "100%", display: "block", maxHeight: "300px", objectFit: "cover" }} />
      <canvas ref={canvasRef} style={{ display: "none" }} />
      {state === "starting" && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.7)" }}>
          <Loader2 style={{ width: "28px", height: "28px", color: "white", animation: "spin 0.8s linear infinite" }} />
        </div>
      )}
      {state === "uploading" && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.7)", flexDirection: "column", gap: "10px" }}>
          <Loader2 style={{ width: "28px", height: "28px", color: "white", animation: "spin 0.8s linear infinite" }} />
          <span style={{ color: "white", fontSize: "13px" }}>Uploading photo…</span>
        </div>
      )}
      {state === "error" && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.7)", flexDirection: "column", gap: "8px", padding: "16px" }}>
          <span style={{ color: "#FF6B6B", fontSize: "13px", textAlign: "center" }}>{errMsg}</span>
          <button onClick={onCancel} style={{ color: "white", fontSize: "12px", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>Close</button>
        </div>
      )}
      {state === "live" && (
        <div style={{ position: "absolute", bottom: "12px", left: 0, right: 0, display: "flex", justifyContent: "center", gap: "12px" }}>
          <button onClick={capture} style={{ padding: "10px 24px", borderRadius: "9999px", backgroundColor: "var(--as-accent)", color: "white", border: "none", fontWeight: "700", fontSize: "13px", cursor: "pointer" }}>Capture</button>
          <button onClick={() => { streamRef.current?.getTracks().forEach((t) => t.stop()); onCancel(); }} style={{ padding: "10px 18px", borderRadius: "9999px", backgroundColor: "rgba(0,0,0,0.5)", color: "white", border: "1px solid rgba(255,255,255,0.3)", fontSize: "13px", cursor: "pointer" }}>Cancel</button>
        </div>
      )}
    </div>
  );
}

// ── Webcam recorder ───────────────────────────────────────────────────────────
function WebcamRecorder({ onDone, onCancel }: { onDone: (url: string) => void; onCancel: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [state, setState] = useState<RecordState>("requesting");
  const [errMsg, setErrMsg] = useState("");

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => { streamRef.current = stream; if (videoRef.current) videoRef.current.srcObject = stream; setState("idle"); })
      .catch(() => { setErrMsg("Camera/microphone permission denied."); setState("error"); });
    return () => { streamRef.current?.getTracks().forEach((t) => t.stop()); };
  }, []);

  function startRecording() {
    if (!streamRef.current) return;
    chunksRef.current = [];
    const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9") ? "video/webm;codecs=vp9" : "video/webm";
    const recorder = new MediaRecorder(streamRef.current, { mimeType });
    recorderRef.current = recorder;
    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    recorder.onstop = async () => {
      setState("uploading");
      streamRef.current?.getTracks().forEach((t) => t.stop());
      const blob = new Blob(chunksRef.current, { type: "video/webm" });
      const file = new File([blob], "recording.webm", { type: "video/webm" });
      try { const url = await uploadFile(file); onDone(url); }
      catch { setErrMsg("Upload failed. Please try again."); setState("error"); }
    };
    recorder.start();
    setState("recording");
  }

  function stopRecording() { recorderRef.current?.stop(); }

  return (
    <div style={{ border: "1px solid var(--as-border)", borderRadius: "14px", overflow: "hidden", backgroundColor: "#000", position: "relative" }}>
      <video ref={videoRef} autoPlay playsInline muted style={{ width: "100%", display: "block", maxHeight: "300px", objectFit: "cover" }} />
      {state === "requesting" && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.7)", flexDirection: "column", gap: "10px" }}>
          <Loader2 style={{ width: "28px", height: "28px", color: "white", animation: "spin 0.8s linear infinite" }} />
          <span style={{ color: "white", fontSize: "13px" }}>Requesting camera access…</span>
        </div>
      )}
      {state === "uploading" && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.7)", flexDirection: "column", gap: "10px" }}>
          <Loader2 style={{ width: "28px", height: "28px", color: "white", animation: "spin 0.8s linear infinite" }} />
          <span style={{ color: "white", fontSize: "13px" }}>Uploading recording…</span>
        </div>
      )}
      {state === "error" && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.7)", flexDirection: "column", gap: "8px", padding: "16px" }}>
          <span style={{ color: "#FF6B6B", fontSize: "13px", textAlign: "center" }}>{errMsg}</span>
          <button onClick={onCancel} style={{ color: "white", fontSize: "12px", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>Close</button>
        </div>
      )}
      {(state === "idle" || state === "recording") && (
        <div style={{ position: "absolute", bottom: "12px", left: 0, right: 0, display: "flex", justifyContent: "center", gap: "12px" }}>
          {state === "idle" && (
            <>
              <button onClick={startRecording} style={{ padding: "10px 24px", borderRadius: "9999px", backgroundColor: "var(--as-accent)", color: "white", border: "none", fontWeight: "700", fontSize: "13px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
                <Play style={{ width: "14px", height: "14px" }} /> Start Recording
              </button>
              <button onClick={() => { streamRef.current?.getTracks().forEach((t) => t.stop()); onCancel(); }} style={{ padding: "10px 18px", borderRadius: "9999px", backgroundColor: "rgba(0,0,0,0.5)", color: "white", border: "1px solid rgba(255,255,255,0.3)", fontSize: "13px", cursor: "pointer" }}>Cancel</button>
            </>
          )}
          {state === "recording" && (
            <button onClick={stopRecording} style={{ padding: "10px 24px", borderRadius: "9999px", backgroundColor: "#EF4444", color: "white", border: "none", fontWeight: "700", fontSize: "13px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
              <StopCircle style={{ width: "14px", height: "14px" }} /> Stop Recording
            </button>
          )}
        </div>
      )}
      {state === "recording" && (
        <div style={{ position: "absolute", top: "12px", left: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
          <div style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: "#EF4444", animation: "pulse 1s infinite" }} />
          <span style={{ color: "white", fontSize: "11px", fontWeight: "600" }}>REC</span>
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function CreatePage() {
  const router = useRouter();
  const currentUser = getUser();

  const [tab, setTab] = useState<Tab>("post");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [postDesc, setPostDesc] = useState("");
  const [postCategory, setPostCategory] = useState("General");
  const [postImages, setPostImages] = useState<string[]>([]);
  const [showPostCamera, setShowPostCamera] = useState(false);
  const [postImgUploadState, setPostImgUploadState] = useState<UploadState>("idle");
  const postImageInputRef = useRef<HTMLInputElement>(null);

  const [videoSource, setVideoSource] = useState<VideoSource>("upload");
  const [reelTitle, setReelTitle] = useState("");
  const [reelType, setReelType] = useState("monologue");
  const [reelVideoUrl, setReelVideoUrl] = useState("");
  const [reelVideoFilename, setReelVideoFilename] = useState("");
  const [reelUploadState, setReelUploadState] = useState<UploadState>("idle");
  const [showRecorder, setShowRecorder] = useState(false);
  const [reelThumbnail, setReelThumbnail] = useState("");
  const [reelDesc, setReelDesc] = useState("");
  const [reelDuration, setReelDuration] = useState("");
  const [reelVisibility, setReelVisibility] = useState("public");
  const [reelCaptions, setReelCaptions] = useState(false);
  const reelFileInputRef = useRef<HTMLInputElement>(null);

  const [liveTitle, setLiveTitle] = useState("");
  const [liveVisibility, setLiveVisibility] = useState("public");
  const [liveResult, setLiveResult] = useState<LiveResult | null>(null);

  const [hasProfile, setHasProfile] = useState<boolean | null>(null);

  useEffect(() => {
    if (!currentUser) { router.push("/login"); return; }
    if (currentUser.role !== "ARTIST") { router.replace("/explore"); return; }
    // Honour ?tab= so "Go Live" from the Lives page lands on the Live tab
    const t = new URLSearchParams(window.location.search).get("tab");
    if (t === "live" || t === "reel" || t === "post") setTab(t as Tab);
    apiClient.get("/profile/")
      .then(() => setHasProfile(true))
      .catch(() => setHasProfile(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleReelFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setReelVideoFilename(file.name);
    setReelUploadState("uploading");
    setError("");
    try { const url = await uploadFile(file); setReelVideoUrl(url); setReelUploadState("done"); }
    catch { setReelUploadState("error"); setError("Video upload failed. Please try again."); }
  }

  async function handlePostImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || postImages.length >= 4) return;
    setPostImgUploadState("uploading");
    setError("");
    try { const url = await uploadFile(file); setPostImages((prev) => [...prev, url]); setPostImgUploadState("idle"); }
    catch { setPostImgUploadState("error"); setError("Image upload failed. Please try again."); }
  }

  async function submitPost() {
    if (!postDesc.trim()) { setError("Description is required."); return; }
    setSubmitting(true); setError("");
    try { await apiClient.post("/feed/", { description: postDesc.trim(), category: postCategory, attachments: postImages.map((url) => ({ url })) }); router.push("/explore"); }
    catch (e: unknown) { setError(e instanceof Error ? e.message : "Failed to post."); }
    finally { setSubmitting(false); }
  }

  async function submitReel() {
    if (!reelTitle.trim()) { setError("Title is required."); return; }
    if (!reelVideoUrl.trim()) { setError("Video is required — upload a file, record, or paste a URL."); return; }
    setSubmitting(true); setError("");
    try {
      await apiClient.post("/reels/", { title: reelTitle.trim(), type: reelType, video_url: reelVideoUrl.trim(), thumbnail_url: reelThumbnail.trim(), description: reelDesc.trim(), duration: reelDuration ? parseInt(reelDuration) : 0, visibility: reelVisibility, has_captions: reelCaptions });
      router.push("/reels");
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Failed to create reel."); }
    finally { setSubmitting(false); }
  }

  async function submitLive() {
    if (!liveTitle.trim()) { setError("Title is required."); return; }
    setSubmitting(true); setError("");
    try { 
      const result = await apiClient.post<LiveResult>("/lives/", { title: liveTitle.trim(), scheduled_for: null, visibility: liveVisibility }); 
      router.push("/lives/" + result.id); 
    }
    catch (e: unknown) { setError(e instanceof Error ? e.message : "Failed to go live."); }
    finally { setSubmitting(false); }
  }

  return (
    <div className="flex flex-col md:flex-row min-h-[calc(100vh-73px)] bg-[var(--as-bg)] font-[var(--font-outfit)] relative">
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
      `}</style>

      {/* ── LEFT PANEL (Media) ── */}
      <section className="relative w-full md:w-1/2 h-[50vh] md:h-[calc(100vh-73px)] flex flex-col md:sticky md:top-0 border-r border-white/5 bg-[#0a0a0a]">
        <div className="absolute inset-0 flex items-center justify-center p-6 md:p-12 overflow-y-auto">
          <div className="w-full max-w-md mx-auto flex flex-col justify-center h-full">

            {tab === "post" && (
              <div>
                <SectionHeader icon={ImageIcon} title="Photos (up to 4)" />
                {postImages.length > 0 && (
                  <div className="flex gap-2.5 flex-wrap mb-4">
                    {postImages.map((url, i) => (
                      <div key={i} className="relative w-24 h-24">
                        <img src={url} alt="" className="w-full h-full object-cover rounded-xl border border-[var(--as-border)]" />
                        <button
                          onClick={() => setPostImages(prev => prev.filter((_, j) => j !== i))}
                          className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-[var(--as-accent)] text-white flex items-center justify-center border-2 border-white cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {showPostCamera ? (
                  <CameraSnapshotWidget
                    onCapture={url => { setPostImages(prev => [...prev, url]); setShowPostCamera(false); }}
                    onCancel={() => setShowPostCamera(false)}
                  />
                ) : postImages.length < 4 && (
                  <div className="flex gap-3">
                    <input ref={postImageInputRef} type="file" accept="image/*" className="hidden" onChange={handlePostImageChange} />
                    <button
                      onClick={() => postImageInputRef.current?.click()}
                      disabled={postImgUploadState === "uploading"}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-[var(--as-border)] bg-[var(--as-surface)] text-sm font-semibold text-[var(--as-text-muted)] hover:border-[var(--as-accent)] hover:text-[var(--as-accent)] transition-all disabled:opacity-50 cursor-pointer"
                    >
                      {postImgUploadState === "uploading"
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : <ImageIcon className="w-4 h-4" />}
                      {postImgUploadState === "uploading" ? "Uploading…" : "Choose Photo"}
                    </button>
                    <button
                      onClick={() => setShowPostCamera(true)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-[var(--as-border)] bg-[var(--as-surface)] text-sm font-semibold text-[var(--as-text-muted)] hover:border-[var(--as-accent)] hover:text-[var(--as-accent)] transition-all cursor-pointer"
                    >
                      <Camera className="w-4 h-4" /> Take Photo
                    </button>
                  </div>
                )}
                {postImages.length === 0 && !showPostCamera && (
                  <div className="mt-8 text-center text-white/30">
                    <ImageIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>Share photos with your post</p>
                  </div>
                )}
              </div>
            )}

            {tab === "reel" && (
              <div>
                <SectionHeader icon={Video} title="Reel Video" />
                <input ref={reelFileInputRef} type="file" accept="video/*" className="hidden" onChange={handleReelFileChange} />

                {videoSource === "upload" && (
                  <>
                    <button
                      onClick={() => reelFileInputRef.current?.click()}
                      disabled={reelUploadState === "uploading"}
                      className={`w-full py-12 px-6 rounded-2xl border-2 border-dashed flex flex-col items-center gap-4 transition-all cursor-pointer group disabled:opacity-60 disabled:cursor-not-allowed ${
                        reelUploadState === "done"
                          ? "border-green-400 bg-green-50"
                          : "border-[var(--as-border)] bg-[var(--as-bg)] hover:border-[var(--as-accent)] hover:bg-[var(--as-accent)]/5"
                      }`}
                    >
                      {reelUploadState === "uploading" ? (
                        <>
                          <Loader2 className="w-10 h-10 text-[var(--as-accent)] animate-spin" />
                          <p className="text-sm font-semibold text-[var(--as-text-muted)]">Uploading…</p>
                        </>
                      ) : reelUploadState === "done" ? (
                        <>
                          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                            <Check className="w-8 h-8 text-green-600" />
                          </div>
                          <p className="text-sm font-semibold text-green-700">{reelVideoFilename}</p>
                          <p className="text-xs text-green-600">Click to replace</p>
                        </>
                      ) : (
                        <>
                          <div className="w-16 h-16 rounded-full bg-[var(--as-border)] flex items-center justify-center group-hover:bg-[var(--as-accent)]/10 transition-colors">
                            <Upload className="w-8 h-8 text-[var(--as-text-muted)] group-hover:text-[var(--as-accent)] transition-colors" />
                          </div>
                          <div className="text-center">
                            <p className="text-base font-semibold text-[var(--as-text)]">Upload your video</p>
                            <p className="text-xs text-[var(--as-text-muted)] mt-1.5">MP4, MOV, WebM · up to 200 MB</p>
                          </div>
                        </>
                      )}
                    </button>
                    <div className="flex items-center justify-center gap-4 mt-6 text-sm text-[var(--as-text-muted)]">
                      <span>or</span>
                      <button
                        onClick={() => { setVideoSource("record"); setShowRecorder(true); setReelVideoUrl(""); setReelVideoFilename(""); setReelUploadState("idle"); }}
                        className="flex items-center gap-2 font-semibold hover:text-[var(--as-accent)] transition-colors cursor-pointer"
                      >
                        <Video className="w-4 h-4" /> Record webcam
                      </button>
                      <span>·</span>
                      <button
                        onClick={() => { setVideoSource("url"); setShowRecorder(false); }}
                        className="flex items-center gap-2 font-semibold hover:text-[var(--as-accent)] transition-colors cursor-pointer"
                      >
                        <Link2 className="w-4 h-4" /> Paste URL
                      </button>
                    </div>
                  </>
                )}

                {videoSource === "record" && (
                  <div className="flex flex-col gap-4">
                    {showRecorder ? (
                      <WebcamRecorder
                        onDone={url => { setReelVideoUrl(url); setShowRecorder(false); setReelUploadState("done"); setReelVideoFilename("webcam-recording.webm"); }}
                        onCancel={() => { setShowRecorder(false); setVideoSource("upload"); }}
                      />
                    ) : reelUploadState === "done" && (
                      <div className="flex items-center gap-4 px-5 py-4 rounded-xl bg-green-50 border border-green-200">
                        <Check className="w-6 h-6 text-green-600" />
                        <span className="text-sm font-semibold text-green-700 flex-1">Recording uploaded</span>
                        <button onClick={() => { setShowRecorder(true); setReelVideoUrl(""); setReelUploadState("idle"); }}
                          className="text-xs font-semibold text-[var(--as-text-muted)] hover:text-[var(--as-accent)] transition-colors cursor-pointer">
                          Re-record
                        </button>
                      </div>
                    )}
                    <button onClick={() => { setVideoSource("upload"); setShowRecorder(false); }}
                      className="text-sm text-[var(--as-text-muted)] hover:text-[var(--as-accent)] transition-colors self-center cursor-pointer mt-2">
                      ← Use file upload instead
                    </button>
                  </div>
                )}

                {videoSource === "url" && (
                  <div className="flex flex-col gap-4">
                    <input value={reelVideoUrl} onChange={e => setReelVideoUrl(e.target.value)}
                      placeholder="https://youtube.com/embed/... or direct video link"
                      className={inputCls} type="url" />
                    <button onClick={() => { setVideoSource("upload"); setReelVideoUrl(""); }}
                      className="text-sm text-[var(--as-text-muted)] hover:text-[var(--as-accent)] transition-colors self-center cursor-pointer mt-2">
                      ← Use file upload instead
                    </button>
                  </div>
                )}
              </div>
            )}

            {tab === "live" && (
              <div className="text-center">
                <div className="w-24 h-24 rounded-full bg-[var(--as-accent)]/10 flex items-center justify-center mx-auto mb-6">
                  <Radio className="w-12 h-12 text-[var(--as-accent)]" style={{ animation: "pulse 1.5s ease-in-out infinite" }} />
                </div>
                <h2 className="text-2xl font-bold text-[var(--as-text)]" style={{ fontFamily: "var(--as-font-display)" }}>Live Stream Ready</h2>
                <p className="text-sm text-[var(--as-text-muted)] mt-2 max-w-xs mx-auto">
                  Set up your stream details on the right, then hit "Go Live Now" to broadcast.
                </p>
              </div>
            )}

          </div>
        </div>
      </section>

      {/* ── RIGHT PANEL (Form) ── */}
      <section className="relative w-full md:w-1/2 bg-[var(--as-surface)] flex flex-col">
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 md:p-10 max-w-xl mx-auto w-full">

            {/* Page header */}
            <div className="flex items-center gap-4 mb-8">
              <div>
                <h1 className="text-3xl font-bold text-[var(--as-text)] leading-none tracking-tight" style={{ fontFamily: "var(--as-font-display)" }}>Create</h1>
                <p className="text-sm text-[var(--as-text-muted)] mt-1">Share your art with the StageLink community</p>
              </div>
            </div>

            {/* Tab selector */}
            <div className="grid grid-cols-3 gap-3 mb-8">
              {([
                { id: "post" as Tab, icon: FileText, label: "Post" },
                { id: "reel" as Tab, icon: Film,     label: "Reel" },
                { id: "live" as Tab, icon: Radio,    label: "Live" },
              ]).map(t => (
                <button
                  key={t.id}
                  onClick={() => { setTab(t.id); setError(""); setLiveResult(null); }}
                  className={`flex items-center justify-center gap-2 py-3.5 px-3 rounded-xl border-2 transition-all cursor-pointer ${
                    tab === t.id
                      ? "border-[var(--as-accent)] bg-[var(--as-accent)]/5 text-[var(--as-accent)]"
                      : "border-[var(--as-border)] bg-[var(--as-bg)] text-[var(--as-text-muted)] hover:border-[var(--as-accent)]/40"
                  }`}
                >
                  <t.icon className="w-4 h-4 shrink-0" />
                  <span className="font-bold text-sm">{t.label}</span>
                </button>
              ))}
            </div>

            {/* Profile required alert */}
            {hasProfile === false && (tab === "reel" || tab === "live") && (
              <div className="flex items-center justify-between gap-3 px-4 py-3.5 rounded-xl bg-[rgba(255,215,0,0.1)] border border-[var(--as-accent)]/40 text-sm text-[var(--as-text)] mb-6">
                <span>You need a talent profile to create reels and go live.</span>
                <button onClick={() => router.push("/profile/edit")}
                  className="shrink-0 px-4 py-2 rounded-lg bg-[var(--as-accent)] text-white text-xs font-semibold cursor-pointer">
                  Set up profile
                </button>
              </div>
            )}

            {/* Error banner */}
            {error && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-[rgba(225,1,17,0.12)] border border-[rgba(225,1,17,0.25)] text-[#FF6B6B] text-sm mb-6">
                <X className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <div className="space-y-8 pb-20">
              {/* ── POST TAB FORM ── */}
              {tab === "post" && (
                <>
                  <div>
                    <SectionHeader icon={MessageSquare} title="What's on your mind?" />
                    <textarea
                      value={postDesc}
                      onChange={e => setPostDesc(e.target.value)}
                      placeholder="Share something with the industry..."
                      rows={5}
                      className={`${inputCls} resize-y leading-relaxed text-base`}
                    />
                  </div>

                  <div>
                    <SectionHeader icon={Tag} title="Category" />
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {POST_CATEGORIES.map(cat => {
                        const Icon = POST_CATEGORY_ICONS[cat] ?? Globe;
                        const active = postCategory === cat;
                        return (
                          <button
                            key={cat}
                            onClick={() => setPostCategory(cat)}
                            className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all cursor-pointer ${
                              active
                                ? "border-[var(--as-accent)] bg-[var(--as-accent)]/5 text-[var(--as-accent)]"
                                : "border-[var(--as-border)] bg-[var(--as-bg)] text-[var(--as-text-muted)] hover:border-[var(--as-accent)]/40 hover:text-[var(--as-text)]"
                            }`}
                          >
                            <Icon className="w-5 h-5" />
                            <span className="text-[11px] font-semibold">{cat}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}

              {/* ── REEL TAB FORM ── */}
              {tab === "reel" && (
                <>
                  <div>
                    <SectionHeader icon={Clapperboard} title="Reel Details" />
                    <div className="flex flex-col gap-5">
                      <div>
                        <label className={labelCls}>Title *</label>
                        <input value={reelTitle} onChange={e => setReelTitle(e.target.value)} placeholder="Give your reel a title" className={inputCls} />
                      </div>
                      <div>
                        <label className={labelCls}>Type</label>
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                          {REEL_TYPES.map(rt => {
                            const Icon = REEL_TYPE_ICONS[rt.value] ?? Film;
                            const active = reelType === rt.value;
                            return (
                              <button
                                key={rt.value}
                                onClick={() => setReelType(rt.value)}
                                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all cursor-pointer ${
                                  active
                                    ? "border-[var(--as-accent)] bg-[var(--as-accent)]/5 text-[var(--as-accent)]"
                                    : "border-[var(--as-border)] bg-[var(--as-bg)] text-[var(--as-text-muted)] hover:border-[var(--as-accent)]/40 hover:text-[var(--as-text)]"
                                }`}
                              >
                                <Icon className="w-5 h-5" />
                                <span className="text-[11px] font-semibold">{rt.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <SectionHeader icon={Info} title="Extra Info (optional)" />
                    <div className="flex flex-col gap-5">
                      <div>
                        <label className={labelCls}>Thumbnail URL</label>
                        <input value={reelThumbnail} onChange={e => setReelThumbnail(e.target.value)} placeholder="https://…" className={inputCls} type="url" />
                      </div>
                      <div>
                        <label className={labelCls}>Description</label>
                        <textarea value={reelDesc} onChange={e => setReelDesc(e.target.value)} placeholder="Describe this reel…" rows={3} className={`${inputCls} resize-y`} />
                      </div>
                    </div>
                  </div>

                  <div>
                    <SectionHeader icon={Settings2} title="Settings" />
                    <div className="flex flex-col gap-6">
                      <div className="grid grid-cols-2 gap-4 items-end">
                        <div>
                          <label className={labelCls}>Duration (seconds)</label>
                          <input value={reelDuration} onChange={e => setReelDuration(e.target.value)} placeholder="e.g. 120" type="number" min={0} className={inputCls} />
                        </div>
                        <label className="flex items-center gap-3 cursor-pointer pb-0.5">
                          <div
                            onClick={() => setReelCaptions(!reelCaptions)}
                            className={`w-10 h-5 rounded-full transition-colors relative shrink-0 cursor-pointer ${reelCaptions ? "bg-[var(--as-accent)]" : "bg-[var(--as-border)]"}`}
                          >
                            <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-[var(--as-surface)] shadow transition-transform ${reelCaptions ? "translate-x-5" : "translate-x-0.5"}`} />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-[var(--as-text)]">Has captions</p>
                            <p className="text-[11px] text-[var(--as-text-muted)]">Accessibility enabled</p>
                          </div>
                        </label>
                      </div>

                      <div>
                        <label className={labelCls}>Visibility</label>
                        <div className="flex flex-col gap-2">
                          {VISIBILITY_OPTIONS.map(v => {
                            const Icon = VISIBILITY_ICONS[v.value] ?? Globe;
                            const active = reelVisibility === v.value;
                            return (
                              <button
                                key={v.value}
                                onClick={() => setReelVisibility(v.value)}
                                className={`flex items-center gap-3 px-4 py-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                                  active
                                    ? "border-[var(--as-accent)] bg-[var(--as-accent)]/5 border-l-[3px]"
                                    : "border-[var(--as-border)] bg-[var(--as-bg)] hover:border-[var(--as-accent)]/40"
                                }`}
                              >
                                <Icon className={`w-4 h-4 shrink-0 ${active ? "text-[var(--as-accent)]" : "text-[var(--as-text-muted)]"}`} />
                                <div className="flex-1">
                                  <p className={`text-sm font-semibold ${active ? "text-[var(--as-accent)]" : "text-[var(--as-text)]"}`}>{v.label}</p>
                                  <p className="text-[11px] text-[var(--as-text-muted)] mt-0.5">{v.desc}</p>
                                </div>
                                {active && <Check className="w-4 h-4 text-[var(--as-accent)] shrink-0" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* ── LIVE TAB FORM ── */}
              {tab === "live" && (
                <>
                  {liveResult ? (
                    <LiveConfirmation result={liveResult} onReset={() => { setLiveResult(null); setLiveTitle(""); }} />
                  ) : (
                    <>
                      <div>
                        <label className={labelCls}>Stream Title *</label>
                        <input value={liveTitle} onChange={e => setLiveTitle(e.target.value)} placeholder="What's this stream about?" className={inputCls} />
                      </div>

                      <div>
                        <label className={labelCls}>Visibility</label>
                        <div className="flex flex-col gap-2">
                          {LIVE_VISIBILITY_OPTIONS.map(v => {
                            const Icon = VISIBILITY_ICONS[v.value] ?? Globe;
                            const active = liveVisibility === v.value;
                            return (
                              <button
                                key={v.value}
                                onClick={() => setLiveVisibility(v.value)}
                                className={`flex items-center gap-3 px-4 py-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                                  active
                                    ? "border-[var(--as-accent)] bg-[var(--as-accent)]/5 border-l-[3px]"
                                    : "border-[var(--as-border)] bg-[var(--as-bg)] hover:border-[var(--as-accent)]/40"
                                }`}
                              >
                                <Icon className={`w-4 h-4 shrink-0 ${active ? "text-[var(--as-accent)]" : "text-[var(--as-text-muted)]"}`} />
                                <div className="flex-1">
                                  <p className={`text-sm font-semibold ${active ? "text-[var(--as-accent)]" : "text-[var(--as-text)]"}`}>{v.label}</p>
                                  <p className="text-[11px] text-[var(--as-text-muted)] mt-0.5">{v.desc}</p>
                                </div>
                                {active && <Check className="w-4 h-4 text-[var(--as-accent)] shrink-0" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>

          </div>
        </div>

        {/* ── STICKY FOOTER (Submit Actions) ── */}
        <div className="sticky bottom-0 left-0 right-0 border-t border-[var(--as-border)] bg-[var(--as-surface)]/95 backdrop-blur-md p-6 flex justify-end z-20">
          <div className="w-full max-w-xl mx-auto flex gap-4 items-center">
            {tab === "post" && <SubmitButton label="Publish Post" loading={submitting} onClick={submitPost} />}
            {tab === "reel" && <SubmitButton label="Publish Reel" loading={submitting} onClick={submitReel} />}
            {tab === "live" && !liveResult && <SubmitButton label="Go Live Now" loading={submitting} onClick={submitLive} />}
          </div>
        </div>

      </section>
    </div>
  );
}

function SubmitButton({ label, loading, onClick }: { label: string; loading: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="w-full py-3.5 rounded-xl bg-[var(--as-accent)] text-white text-sm font-bold flex items-center justify-center gap-2 transition-opacity cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed hover:shadow-lg"
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {label}
    </button>
  );
}

function LiveConfirmation({ result, onReset }: { result: LiveResult; onReset: () => void }) {
  const router = useRouter();
  return (
    <div className="text-center py-4">
      <div className="w-16 h-16 rounded-full bg-[var(--as-accent)]/10 flex items-center justify-center mx-auto mb-5">
        <Radio className="w-8 h-8 text-[var(--as-accent)]" style={{ animation: "pulse 1.5s ease-in-out infinite" }} />
      </div>
      <h2 className="text-2xl font-bold text-[var(--as-text)] mb-2" style={{ fontFamily: "var(--as-font-display)" }}>
        You&apos;re Live!
      </h2>
      <p className="text-sm font-semibold text-[var(--as-text-secondary)] mb-1">{result.title}</p>
      <p className="text-sm text-[var(--as-text-muted)] mb-7">Your stream is now visible to your audience.</p>
      <div className="flex flex-col gap-3 items-center">
        <button
          onClick={() => router.push(`/lives/${result.id}`)}
          className="px-8 py-2.5 rounded-xl bg-[var(--as-accent)] text-white text-sm font-semibold cursor-pointer hover:shadow-lg transition-shadow"
        >
          Enter Your Stream
        </button>
        <button
          onClick={onReset}
          className="px-8 py-2.5 rounded-xl border border-[var(--as-border)] text-[var(--as-text-secondary)] text-sm font-semibold cursor-pointer hover:border-[var(--as-accent)] transition-colors"
        >
          Create Another
        </button>
      </div>
    </div>
  );
}
