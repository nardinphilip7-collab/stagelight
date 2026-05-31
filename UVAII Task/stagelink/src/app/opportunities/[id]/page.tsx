"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { apiClient } from "@/lib/api";
import { getUser } from "@/lib/auth";
import { DynamicIcon } from "@/components/ui/DynamicIcon";
import { ReelRecorder } from "@/components/artstage/reels/ReelRecorder";
import {
  Calendar, MapPin, DollarSign, Building, Clock,
  ArrowLeft, CheckCircle2, Briefcase, FileText,
  X, Loader2, Tag, Share2, Bookmark, Star, AlertCircle,
  FileCheck, Send, TrendingUp, Mic, Video, FileUp,
  ChevronLeft, ChevronRight, Trash2, ArrowUp, ArrowDown,
  Film, User, ShieldCheck,
} from "lucide-react";
import Link from "next/link";

interface Opportunity {
  id: string;
  title: string;
  company: string;
  company_logo: string;
  type: string;
  category: string;
  location: string;
  compensation: string;
  deadline: string;
  urgent: boolean;
  featured: boolean;
  description: string;
  posted: string;
  applicants: number;
  requirements: string[];
  tags: string[];
  questionnaire?: {question: string; type: string}[];
  portfolio_requirements?: {label: string; description: string}[];
  submission_type: string;
  prompt_text: string;
  allow_download: boolean;
}

interface AuditionSlot {
  id: number;
  start_time: string;
  end_time: string;
  capacity: number;
  booked_by: number | null;
  location_or_link: string;
}

interface Take {
  video_url: string;
  duration: number;
  label: string;
}

// ─── Dark cinematic design tokens ─────────────────────────────────────────────
const C = {
  bg: "#131314", glass: "rgba(22,22,24,0.7)", surface: "#201f20",
  border: "rgba(255,255,255,0.1)", gold: "#ffd700", goldFixed: "#ffe16d",
  onGold: "#221b00", red: "#e10111", primary: "#fff6df",
  text: "#e5e2e3", muted: "#d0c6ab", mutedDim: "#999077",
  syne: "var(--font-syne, 'Syne', sans-serif)",
};
const glass: React.CSSProperties = {
  background: "rgba(22,22,24,0.7)", backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.1)",
};

export default function OpportunityDetail() {
  const { id } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentUser = getUser();

  const [gig, setGig] = useState<Opportunity | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const [coverNote, setCoverNote] = useState("");
  const [myReels, setMyReels] = useState<{ id: number; description: string; video_url: string }[]>([]);
  const [isApplying, setIsApplying] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [applyError, setApplyError] = useState("");
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [applicationSuccess, setApplicationSuccess] = useState(false);
  const [questionAnswers, setQuestionAnswers] = useState<Record<string, string>>({});
  const [portfolioUrls, setPortfolioUrls] = useState<Record<string, string>>({});

  // Wizard state
  const [wizardStep, setWizardStep] = useState(0);
  const [takes, setTakes] = useState<Take[]>([]);
  const [selectedTake, setSelectedTake] = useState<number | null>(null);
  const [clipOrder, setClipOrder] = useState<number[]>([]);
  const [slateData, setSlateData] = useState({ name: currentUser?.email?.split("@")[0] || "", role: "", agency: "", custom_text: "" });
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [pdfUrls, setPdfUrls] = useState<string[]>([]);
  const [auditionSlotId, setAuditionSlotId] = useState<string | null>(null);
  const [availableSlots, setAvailableSlots] = useState<AuditionSlot[]>([]);
  const [visibilityConsent, setVisibilityConsent] = useState(false);
  const [downloadAllowed, setDownloadAllowed] = useState(true);
  const [recordMode, setRecordMode] = useState<"record" | "upload">("record");
  const [uploadingAudio, setUploadingAudio] = useState(false);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [uploadingTake, setUploadingTake] = useState(false);

  const isHirerOrAgency = currentUser?.role === "HIRER" || currentUser?.role === "AGENCY";

  useEffect(() => {
    apiClient.get<Opportunity>(`/opportunities/${id}/`)
      .then(g => {
        setGig(g);
        setDownloadAllowed(g.allow_download);
        if (g.submission_type === "LIVE_AUDITION") {
          apiClient.get<AuditionSlot[]>(`/slots/?opportunity=${id}`).then(setAvailableSlots).catch(() => {});
        }
        // Auto-open the apply wizard when navigated via "Apply Now" (?apply=1).
        const canApply = currentUser?.role === "ARTIST" || currentUser?.role === "FAN";
        if (searchParams.get("apply") === "1" && canApply) {
          setShowApplyModal(true);
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
    if (!isHirerOrAgency) {
      apiClient.get<{ id: number; description: string; video_url: string }[]>("/reels/?mine=true").then(setMyReels).catch(() => {});
    }
  }, [id, isHirerOrAgency]);

  // Wizard steps config based on submission_type
  const getSteps = () => {
    const t = gig?.submission_type || "SELF_TAPE";
    if (t === "PROFILE_ONLY") return ["Cover Note", "Submit"];
    if (t === "SELF_TAPE") return ["Prompt", "Record Takes", "Order Clips", "Slate", "Cover Note", "Consent", "Preview", "Submit"];
    if (t === "AUDIO") return ["Prompt", "Record Audio", "Cover Note", "Consent", "Submit"];
    if (t === "LIVE_AUDITION") return ["Select Slot", "Cover Note", "Submit"];
    if (t === "WRITTEN") return ["Upload PDFs", "Cover Note", "Submit"];
    return ["Cover Note", "Submit"];
  };

  const steps = getSteps();

  const handleTakeRecorded = async (blob: Blob, dur: number) => {
    setUploadingTake(true);
    try {
      const formData = new FormData();
      formData.append("file", blob, "take.webm");
      const res = await apiClient.postForm("/upload/", formData) as { url: string };
      const newTake: Take = { video_url: res.url, duration: dur, label: `Take ${takes.length + 1}` };
      const newTakes = [...takes, newTake];
      setTakes(newTakes);
      setSelectedTake(newTakes.length - 1);
      setClipOrder(newTakes.map((_, i) => i));
    } catch {
      setApplyError("Failed to upload take. Please try again.");
    } finally {
      setUploadingTake(false);
    }
  };

  const handleUploadTake = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingTake(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await apiClient.postForm("/upload/", formData) as { url: string };
      const newTake: Take = { video_url: res.url, duration: 0, label: `Take ${takes.length + 1}` };
      const newTakes = [...takes, newTake];
      setTakes(newTakes);
      setSelectedTake(newTakes.length - 1);
      setClipOrder(newTakes.map((_, i) => i));
    } catch {
      setApplyError("Failed to upload video. Please try again.");
    } finally {
      setUploadingTake(false);
    }
  };

  const handleUploadAudio = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAudio(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await apiClient.postForm("/upload/", formData) as { url: string };
      setAudioUrl(res.url);
    } catch {
      setApplyError("Failed to upload audio.");
    } finally {
      setUploadingAudio(false);
    }
  };

  const handleUploadPdf = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPdf(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await apiClient.postForm("/upload/", formData) as { url: string };
      setPdfUrls(prev => [...prev, res.url]);
    } catch {
      setApplyError("Failed to upload PDF.");
    } finally {
      setUploadingPdf(false);
    }
  };

  const handleApply = async () => {
    setApplyError("");
    setIsApplying(true);
    try {
      const videoUrl = takes.length > 0 && selectedTake !== null ? takes[selectedTake].video_url : null;
      await apiClient.post(`/opportunities/${id}/apply/`, {
        cover_note: coverNote,
        video_url: videoUrl,
        questionnaire_answers: questionAnswers,
        portfolio_submissions: portfolioUrls,
        audio_url: audioUrl,
        pdf_urls: pdfUrls,
        takes: takes,
        selected_take: selectedTake,
        clip_order: clipOrder,
        slate_data: slateData,
        audition_slot_id: auditionSlotId,
        visibility_consent: visibilityConsent,
        download_allowed: downloadAllowed,
      });
      setHasApplied(true);
      setApplicationSuccess(true);
      setTimeout(() => {
        setShowApplyModal(false);
        setApplicationSuccess(false);
      }, 3000);
    } catch (err: unknown) {
      const detail = (err as { data?: { detail?: string } })?.data?.detail || (err as Error)?.message;
      setApplyError(detail || "Failed to submit application. Please try again.");
    } finally {
      setIsApplying(false);
    }
  };

  if (loading) {
    return (
      <div className="artstage" style={{ minHeight: "100vh", backgroundColor: "var(--as-bg)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ width: "56px", height: "56px", borderRadius: "16px", background: "linear-gradient(135deg, #ffd700 0%, #e9c400 100%)", margin: "0 auto 20px", animation: "pulse 1.5s ease-in-out infinite" }} />
            <p style={{ color: "var(--as-text-muted)", fontSize: "14px" }}>Loading opportunity details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (notFound || !gig) {
    return (
      <div className="artstage" style={{ minHeight: "100vh", backgroundColor: "var(--as-bg)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
          <div style={{ textAlign: "center", maxWidth: "480px", padding: "40px" }}>
            <div style={{ width: "96px", height: "96px", borderRadius: "24px", backgroundColor: "rgba(255,215,0,0.08)", border: "1px solid rgba(255,215,0,0.15)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
              <Briefcase style={{ width: "48px", height: "48px", color: "var(--as-accent)" }} />
            </div>
            <h2 style={{ fontSize: "28px", fontWeight: "600", color: "var(--as-text)", marginBottom: "12px" }}>Opportunity Not Found</h2>
            <p style={{ color: "var(--as-text-muted)", marginBottom: "32px", lineHeight: "1.5" }}>
              The opportunity you're looking for does not exist, has been removed, or the link may be broken.
            </p>
            <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
              <button onClick={() => router.back()} style={{
                padding: "12px 28px",
                borderRadius: "9999px",
                backgroundColor: C.gold,
                color: C.onGold,
                border: "none",
                cursor: "pointer",
                fontWeight: "600",
                fontSize: "14px",
              }}>
                Go Back
              </button>
              <Link href="/opportunities">
                <button style={{
                  padding: "12px 28px",
                  borderRadius: "9999px",
                  backgroundColor: "transparent",
                  color: "var(--as-text)",
                  border: "1px solid var(--as-border)",
                  cursor: "pointer",
                  fontWeight: "500",
                  fontSize: "14px",
                }}>
                  Browse All Opportunities
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="artstage" style={{ minHeight: "100vh", backgroundColor: "var(--as-bg)" }}>

      {/* ── Hero Section ── */}
      <section style={{ position: "relative", height: "clamp(460px, 72vh, 716px)", width: "100%", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, #0a0e1a 0%, #101820 40%, #131314 100%)" }} />
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 60% 40% at 70% 30%, rgba(255,215,0,0.09) 0%, transparent 70%)" }} />
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(rgba(255,255,255,0.02) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "60%", background: "linear-gradient(0deg, #131314 0%, rgba(19,19,20,0) 100%)", zIndex: 1 }} />

        {/* Back link */}
        <div style={{ position: "absolute", top: "88px", left: 0, right: 0, padding: "0 clamp(20px, 5vw, 64px)", zIndex: 20 }}>
          <Link href="/opportunities" style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "rgba(255,255,255,0.55)", fontSize: "13px", textDecoration: "none" }}>
            <ArrowLeft style={{ width: "15px", height: "15px" }} />
            Back to Opportunities
          </Link>
        </div>

        {/* Bottom hero content */}
        <div style={{ position: "absolute", bottom: 0, left: 0, width: "100%", padding: "0 clamp(20px, 5vw, 64px) clamp(32px, 5vw, 64px)", zIndex: 10 }}>
          {/* Badges */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px", flexWrap: "wrap" }}>
            <span style={{ background: "rgba(255,215,0,0.18)", color: C.gold, padding: "4px 12px", borderRadius: "9999px", fontSize: "11px", fontWeight: "600", letterSpacing: "0.08em", textTransform: "uppercase" }}>
              {gig.category}
            </span>
            <span style={{ background: "rgba(255,255,255,0.1)", color: "#fff", padding: "4px 12px", borderRadius: "9999px", fontSize: "11px", fontWeight: "600", letterSpacing: "0.08em", textTransform: "uppercase" }}>
              Active Phase
            </span>
            {gig.featured && (
              <span style={{ background: C.gold, color: C.onGold, padding: "4px 12px", borderRadius: "9999px", fontSize: "11px", fontWeight: "600", letterSpacing: "0.08em", textTransform: "uppercase", display: "flex", alignItems: "center", gap: "4px" }}>
                <Star style={{ width: "10px", height: "10px" }} /> Featured
              </span>
            )}
            {gig.urgent && (
              <span style={{ background: "rgba(225,1,17,0.18)", color: "#ffb4ab", border: "1px solid rgba(225,1,17,0.3)", padding: "4px 12px", borderRadius: "9999px", fontSize: "11px", fontWeight: "600", letterSpacing: "0.08em", textTransform: "uppercase", display: "flex", alignItems: "center", gap: "4px" }}>
                <AlertCircle style={{ width: "10px", height: "10px" }} /> Urgent
              </span>
            )}
          </div>

          {/* Title */}
          <h1 style={{ fontFamily: C.syne, fontSize: "clamp(40px, 5.5vw, 80px)", fontWeight: "800", color: "#fff", letterSpacing: "-0.03em", margin: "0 0 24px", lineHeight: 1.0 }}>
            {gig.title}
          </h1>

          {/* Role chip */}
          <div style={{ borderLeft: `4px solid ${C.gold}`, background: "rgba(42,42,43,0.5)", backdropFilter: "blur(12px)", padding: "12px 24px", borderRadius: "0 12px 12px 0", display: "inline-block" }}>
            <p style={{ fontSize: "11px", fontWeight: "600", letterSpacing: "0.08em", textTransform: "uppercase", color: C.gold, margin: "0 0 4px" }}>Target Role</p>
            <p style={{ fontFamily: C.syne, fontSize: "22px", fontWeight: "700", color: "#fff", margin: 0 }}>{gig.type}</p>
          </div>
        </div>
      </section>

      {/* ── Body ── */}
      <div style={{ maxWidth: "1440px", margin: "0 auto", padding: "clamp(32px, 5vw, 48px) clamp(20px, 5vw, 64px)" }}>
        <div className="od-grid">

          {/* Left column */}
          <div className="od-left">

            {/* Quick specs */}
            <div className="od-specs">
              {[
                { icon: MapPin, label: "Location", value: gig.location },
                { icon: ShieldCheck, label: "Union / Type", value: gig.type },
                { icon: DollarSign, label: "Compensation", value: gig.compensation },
                { icon: Calendar, label: "Deadline", value: gig.deadline },
              ].map((item, idx) => (
                <div key={idx} style={{ ...glass, padding: "24px", borderRadius: "12px" }}>
                  <item.icon style={{ width: "24px", height: "24px", color: C.gold, marginBottom: "10px" }} />
                  <p style={{ fontSize: "11px", color: C.mutedDim, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 4px" }}>{item.label}</p>
                  <p style={{ fontSize: "17px", fontWeight: "700", color: "#fff", margin: 0 }}>{item.value}</p>
                </div>
              ))}
            </div>

            {/* Character Breakdown */}
            <div style={{ ...glass, borderRadius: "20px", padding: "40px" }}>
              <h2 style={{ fontFamily: C.syne, fontSize: "26px", fontWeight: "700", color: "#fff", margin: "0 0 24px", paddingBottom: "16px", borderBottom: `1px solid ${C.border}` }}>Character Breakdown</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                <p style={{ color: C.muted, lineHeight: "1.75", fontSize: "16px", margin: 0 }}>{gig.description}</p>
                {gig.prompt_text && (
                  <div style={{ background: "rgba(255,255,255,0.04)", padding: "24px", borderRadius: "12px", borderLeft: `2px solid ${C.gold}` }}>
                    <h4 style={{ fontSize: "11px", fontWeight: "600", letterSpacing: "0.08em", textTransform: "uppercase", color: C.gold, margin: "0 0 10px" }}>Director&apos;s Note</h4>
                    <p style={{ fontSize: "15px", color: C.text, lineHeight: "1.65", margin: 0 }}>{gig.prompt_text}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Production Requirements */}
            {gig.requirements && gig.requirements.length > 0 && (
              <div style={{ ...glass, borderRadius: "20px", padding: "40px" }}>
                <h2 style={{ fontFamily: C.syne, fontSize: "26px", fontWeight: "700", color: "#fff", margin: "0 0 24px", paddingBottom: "16px", borderBottom: `1px solid ${C.border}` }}>Production Requirements</h2>
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {gig.requirements.map((req, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}>
                      <CheckCircle2 style={{ width: "20px", height: "20px", color: C.gold, marginTop: "2px", flexShrink: 0 }} />
                      <span style={{ color: C.text, lineHeight: "1.55", fontSize: "15px" }}>{req}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right column (sidebar) */}
          <div className="od-right">
            <div style={{ position: "sticky", top: "104px", display: "flex", flexDirection: "column", gap: "32px" }}>
              {/* CTA Card */}
              <div style={{ ...glass, border: "1px solid rgba(255,215,0,0.28)", padding: "32px", borderRadius: "20px" }}>
              {!isHirerOrAgency && !hasApplied && (
                <button
                  onClick={() => setShowApplyModal(true)}
                  style={{ width: "100%", backgroundColor: C.gold, color: C.onGold, border: "none", cursor: "pointer", padding: "16px", borderRadius: "12px", fontFamily: C.syne, fontWeight: "700", fontSize: "20px", display: "flex", alignItems: "center", justifyContent: "center", gap: "12px", transition: "box-shadow 0.3s" }}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 0 25px rgba(255,215,0,0.3)"; }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; }}
                  onMouseDown={e => { e.currentTarget.style.transform = "scale(0.97)"; }}
                  onMouseUp={e => { e.currentTarget.style.transform = "scale(1)"; }}
                >
                  Apply Now <Send style={{ width: "20px", height: "20px" }} />
                </button>
              )}
              {hasApplied && (
                <div style={{ width: "100%", padding: "16px", borderRadius: "12px", background: "rgba(0,219,232,0.1)", border: "1px solid rgba(0,219,232,0.3)", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", color: "#00dbe8", fontWeight: "700", fontSize: "16px" }}>
                  <CheckCircle2 style={{ width: "20px", height: "20px" }} /> Applied
                </div>
              )}
              {isHirerOrAgency && (
                <div style={{ width: "100%", padding: "16px", borderRadius: "12px", background: "rgba(255,255,255,0.04)", border: `1px solid ${C.border}`, textAlign: "center", color: C.mutedDim, fontWeight: "600", fontSize: "14px" }}>
                  Viewing as employer
                </div>
              )}

              {!hasApplied && (
                <button
                  onClick={() => setIsSaved(!isSaved)}
                  style={{ width: "100%", marginTop: "16px", backgroundColor: "rgba(255,255,255,0.05)", border: `1px solid ${isSaved ? "rgba(255,215,0,0.3)" : C.border}`, color: isSaved ? C.gold : "#fff", cursor: "pointer", padding: "16px", borderRadius: "12px", fontWeight: "600", fontSize: "15px", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", transition: "all 0.2s" }}
                  onMouseEnter={e => { if (!isSaved) e.currentTarget.style.background = "rgba(255,255,255,0.1)"; }}
                  onMouseLeave={e => { if (!isSaved) e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
                >
                  {isSaved ? "Saved" : "Save for Later"} <Bookmark style={{ width: "18px", height: "18px", fill: isSaved ? C.gold : "none" }} />
                </button>
              )}

              {/* Key Dates */}
              <div style={{ marginTop: "32px", paddingTop: "32px", borderTop: `1px solid ${C.border}` }}>
                <p style={{ fontSize: "11px", color: C.mutedDim, textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 16px" }}>Key Dates</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <Calendar style={{ width: "20px", height: "20px", color: C.gold, flexShrink: 0 }} />
                    <div>
                      <p style={{ fontSize: "14px", color: "#fff", margin: "0 0 2px", fontWeight: "500" }}>Application Deadline</p>
                      <p style={{ fontSize: "12px", color: C.mutedDim, margin: 0 }}>{gig.deadline}</p>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <Film style={{ width: "20px", height: "20px", color: C.gold, flexShrink: 0 }} />
                    <div>
                      <p style={{ fontSize: "14px", color: "#fff", margin: "0 0 2px", fontWeight: "500" }}>Posted</p>
                      <p style={{ fontSize: "12px", color: C.mutedDim, margin: 0 }}>{gig.posted}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Production Team */}
              <div style={{ marginTop: "32px", paddingTop: "32px", borderTop: `1px solid ${C.border}` }}>
                <p style={{ fontSize: "11px", color: C.mutedDim, textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 16px" }}>Production Team</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {[
                    { name: gig.company, role: "Production Company" },
                    { name: "Casting Team", role: "Casting Director" },
                  ].map((person, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div style={{ width: "40px", height: "40px", borderRadius: "9999px", backgroundColor: "#353436", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <User style={{ width: "18px", height: "18px", color: C.gold }} />
                      </div>
                      <div>
                        <p style={{ fontSize: "14px", color: "#fff", margin: "0 0 2px", fontWeight: "500" }}>{person.name}</p>
                        <p style={{ fontSize: "11px", color: C.mutedDim, margin: 0, textTransform: "uppercase", letterSpacing: "0.06em" }}>{person.role}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Studio Brand Card */}
            <div style={{ ...glass, borderRadius: "20px", padding: "24px", display: "flex", alignItems: "center", gap: "16px" }}>
              <div style={{ width: "48px", height: "48px", borderRadius: "10px", backgroundColor: "#353436", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <DynamicIcon name={gig.company_logo} className="w-6 h-6" style={{ color: C.gold }} />
              </div>
              <div>
                <p style={{ fontFamily: C.syne, fontSize: "18px", fontWeight: "700", color: C.gold, margin: "0 0 4px", lineHeight: 1 }}>{gig.company}</p>
                <p style={{ fontSize: "12px", color: C.mutedDim, margin: 0 }}>Active Casting Phase</p>
              </div>
            </div>

            {/* Skills & Tags */}
            {gig.tags && gig.tags.length > 0 && (
              <div style={{ ...glass, borderRadius: "20px", padding: "24px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
                  <Tag style={{ width: "18px", height: "18px", color: C.gold }} />
                  <h3 style={{ fontSize: "16px", fontWeight: "600", color: "#fff", margin: 0 }}>Skills & Tags</h3>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {gig.tags.map((tag) => (
                    <span key={tag} style={{ padding: "6px 14px", borderRadius: "8px", fontSize: "12px", backgroundColor: "rgba(255,255,255,0.05)", border: `1px solid ${C.border}`, color: C.muted }}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <footer style={{ width: "100%", padding: "48px 0", borderTop: "1px solid #353436", backgroundColor: "#131314" }}>
        <div style={{ maxWidth: "1440px", margin: "0 auto", padding: "0 clamp(20px, 5vw, 64px)", display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "32px" }}>
          <div>
            <p style={{ fontFamily: C.syne, fontSize: "20px", fontWeight: "700", color: C.primary, margin: "0 0 4px" }}>StageLink</p>
            <p style={{ fontSize: "14px", color: C.mutedDim, margin: 0 }}>© {new Date().getFullYear()} StageLink. All rights reserved.</p>
          </div>
          <div style={{ display: "flex", gap: "32px", flexWrap: "wrap" }}>
            {["Privacy Policy", "Terms of Service", "Union Guidelines", "Support"].map(lnk => (
              <Link key={lnk} href="#" style={{ fontSize: "14px", color: C.mutedDim, textDecoration: "none", opacity: 0.8, transition: "color 0.2s, opacity 0.2s" }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.color = C.gold; el.style.opacity = "1"; }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.color = C.mutedDim; el.style.opacity = "0.8"; }}
              >{lnk}</Link>
            ))}
          </div>
        </div>
      </footer>

      {/* Apply Wizard Modal */}
      {showApplyModal && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 50,
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "16px", backgroundColor: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)"
        }} onClick={() => { setShowApplyModal(false); setWizardStep(0); }}>
          <div style={{
            background: "rgba(22,22,24,0.97)", backdropFilter: "blur(20px)", borderRadius: "24px",
            maxWidth: "560px", width: "100%", maxHeight: "90vh",
            display: "flex", flexDirection: "column",
            border: `1px solid ${C.border}`, boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
            overflow: "hidden",
          }} onClick={e => e.stopPropagation()}>

            {/* Modal header */}
            <div style={{ padding: "24px 28px 16px", borderBottom: "1px solid var(--as-border)", flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                <div>
                  <h3 style={{ fontSize: "20px", fontWeight: "600", color: "var(--as-text)", marginBottom: "2px" }}>Submit Application</h3>
                  <p style={{ fontSize: "12px", color: "var(--as-text-muted)", margin: 0 }}>{gig.title} · {gig.company}</p>
                </div>
                <button onClick={() => { setShowApplyModal(false); setWizardStep(0); }} style={{ padding: "8px", borderRadius: "10px", background: "transparent", border: "1px solid var(--as-border)", cursor: "pointer", color: "var(--as-text-muted)", display: "flex" }}>
                  <X style={{ width: "16px", height: "16px" }} />
                </button>
              </div>
              {/* Progress dots */}
              {!applicationSuccess && (
                <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                  {steps.map((s, i) => (
                    <div key={i} title={s} style={{
                      height: "6px", flex: 1, borderRadius: "3px",
                      backgroundColor: i <= wizardStep ? "var(--as-accent)" : "var(--as-border)",
                      transition: "background-color 0.3s",
                    }} />
                  ))}
                </div>
              )}
            </div>

            {/* Modal body */}
            <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px" }}>
              {applicationSuccess ? (
                <div style={{ textAlign: "center", padding: "40px 0" }}>
                  <div style={{ width: "64px", height: "64px", borderRadius: "32px", backgroundColor: "rgba(0,219,232,0.1)", border: "1px solid rgba(0,219,232,0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                    <CheckCircle2 style={{ width: "32px", height: "32px", color: "#00dbe8" }} />
                  </div>
                  <h4 style={{ fontSize: "20px", fontWeight: "600", color: "var(--as-text)", marginBottom: "8px" }}>Application Submitted!</h4>
                  <p style={{ color: "var(--as-text-muted)", fontSize: "14px", marginBottom: "8px" }}>Your application has been received successfully.</p>
                  <p style={{ color: "var(--as-text-muted)", fontSize: "13px" }}>A confirmation has been logged for this submission.</p>
                </div>
              ) : (
                <WizardStep
                  step={wizardStep}
                  steps={steps}
                  gig={gig}
                  takes={takes}
                  selectedTake={selectedTake}
                  clipOrder={clipOrder}
                  slateData={slateData}
                  audioUrl={audioUrl}
                  pdfUrls={pdfUrls}
                  availableSlots={availableSlots}
                  auditionSlotId={auditionSlotId}
                  visibilityConsent={visibilityConsent}
                  downloadAllowed={downloadAllowed}
                  coverNote={coverNote}
                  questionAnswers={questionAnswers}
                  portfolioUrls={portfolioUrls}
                  recordMode={recordMode}
                  uploadingTake={uploadingTake}
                  uploadingAudio={uploadingAudio}
                  uploadingPdf={uploadingPdf}
                  myReels={myReels}
                  currentUser={currentUser}
                  applyError={applyError}
                  setTakes={setTakes}
                  setSelectedTake={setSelectedTake}
                  setClipOrder={setClipOrder}
                  setSlateData={setSlateData}
                  setAudioUrl={setAudioUrl}
                  setPdfUrls={setPdfUrls}
                  setAuditionSlotId={setAuditionSlotId}
                  setVisibilityConsent={setVisibilityConsent}
                  setDownloadAllowed={setDownloadAllowed}
                  setCoverNote={setCoverNote}
                  setQuestionAnswers={setQuestionAnswers}
                  setPortfolioUrls={setPortfolioUrls}
                  setRecordMode={setRecordMode}
                  onTakeRecorded={handleTakeRecorded}
                  onUploadTake={handleUploadTake}
                  onUploadAudio={handleUploadAudio}
                  onUploadPdf={handleUploadPdf}
                />
              )}
            </div>

            {/* Modal footer nav */}
            {!applicationSuccess && (
              <div style={{ padding: "16px 28px 24px", borderTop: "1px solid var(--as-border)", display: "flex", justifyContent: "space-between", gap: "12px", flexShrink: 0 }}>
                <button
                  onClick={() => setWizardStep(s => Math.max(0, s - 1))}
                  disabled={wizardStep === 0}
                  style={{ padding: "10px 20px", borderRadius: "9999px", border: "1px solid var(--as-border)", background: "transparent", color: "var(--as-text-muted)", cursor: wizardStep === 0 ? "not-allowed" : "pointer", opacity: wizardStep === 0 ? 0.4 : 1, display: "flex", alignItems: "center", gap: "6px", fontSize: "14px" }}
                >
                  <ChevronLeft style={{ width: "14px", height: "14px" }} /> Back
                </button>
                {wizardStep < steps.length - 1 ? (
                  <button
                    onClick={() => setWizardStep(s => s + 1)}
                    style={{ padding: "10px 24px", borderRadius: "9999px", backgroundColor: C.gold, color: C.onGold, border: "none", cursor: "pointer", fontWeight: "700", fontSize: "14px", display: "flex", alignItems: "center", gap: "6px" }}
                  >
                    Next <ChevronRight style={{ width: "14px", height: "14px" }} />
                  </button>
                ) : (
                  <button
                    onClick={handleApply}
                    disabled={isApplying || !coverNote.trim()}
                    style={{ padding: "10px 24px", borderRadius: "9999px", backgroundColor: C.gold, color: C.onGold, border: "none", cursor: isApplying || !coverNote.trim() ? "not-allowed" : "pointer", fontWeight: "700", fontSize: "14px", opacity: isApplying || !coverNote.trim() ? 0.7 : 1, display: "flex", alignItems: "center", gap: "6px" }}
                  >
                    {isApplying ? <Loader2 style={{ width: "16px", height: "16px", animation: "spin 1s linear infinite" }} /> : <><Send style={{ width: "14px", height: "14px" }} /> Submit</>}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.7; transform: scale(0.98); } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .od-grid { display: grid; grid-template-columns: 1fr; gap: 24px; }
        .od-specs { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
        .od-left { display: flex; flex-direction: column; gap: 48px; }
        .od-right { display: flex; flex-direction: column; gap: 32px; }
        @media (min-width: 1024px) {
          .od-grid { grid-template-columns: 2fr 1fr; gap: 48px; }
          .od-specs { grid-template-columns: repeat(4, 1fr); }
        }
      `}</style>
    </div>
  );
}

// ─── Wizard Step Component ────────────────────────────────────────────────────

interface WizardStepProps {
  step: number;
  steps: string[];
  gig: {
    submission_type: string;
    prompt_text: string;
    questionnaire?: {question: string; type: string}[];
    portfolio_requirements?: {label: string; description: string}[];
    title: string;
  };
  takes: Take[];
  selectedTake: number | null;
  clipOrder: number[];
  slateData: { name: string; role: string; agency: string; custom_text: string };
  audioUrl: string | null;
  pdfUrls: string[];
  availableSlots: AuditionSlot[];
  auditionSlotId: string | null;
  visibilityConsent: boolean;
  downloadAllowed: boolean;
  coverNote: string;
  questionAnswers: Record<string, string>;
  portfolioUrls: Record<string, string>;
  recordMode: "record" | "upload";
  uploadingTake: boolean;
  uploadingAudio: boolean;
  uploadingPdf: boolean;
  myReels: { id: number; description: string; video_url: string }[];
  currentUser: { email?: string } | null;
  applyError: string;
  setTakes: React.Dispatch<React.SetStateAction<Take[]>>;
  setSelectedTake: React.Dispatch<React.SetStateAction<number | null>>;
  setClipOrder: React.Dispatch<React.SetStateAction<number[]>>;
  setSlateData: React.Dispatch<React.SetStateAction<{ name: string; role: string; agency: string; custom_text: string }>>;
  setAudioUrl: React.Dispatch<React.SetStateAction<string | null>>;
  setPdfUrls: React.Dispatch<React.SetStateAction<string[]>>;
  setAuditionSlotId: React.Dispatch<React.SetStateAction<string | null>>;
  setVisibilityConsent: React.Dispatch<React.SetStateAction<boolean>>;
  setDownloadAllowed: React.Dispatch<React.SetStateAction<boolean>>;
  setCoverNote: React.Dispatch<React.SetStateAction<string>>;
  setQuestionAnswers: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  setPortfolioUrls: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  setRecordMode: React.Dispatch<React.SetStateAction<"record" | "upload">>;
  onTakeRecorded: (blob: Blob, dur: number) => void;
  onUploadTake: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onUploadAudio: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onUploadPdf: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

function WizardStep({
  step, steps, gig, takes, selectedTake, clipOrder, slateData, audioUrl, pdfUrls,
  availableSlots, auditionSlotId, visibilityConsent, downloadAllowed, coverNote,
  questionAnswers, portfolioUrls, recordMode, uploadingTake, uploadingAudio, uploadingPdf,
  myReels, currentUser, applyError,
  setTakes, setSelectedTake, setClipOrder, setSlateData, setAudioUrl, setPdfUrls,
  setAuditionSlotId, setVisibilityConsent, setDownloadAllowed, setCoverNote,
  setQuestionAnswers, setPortfolioUrls, setRecordMode,
  onTakeRecorded, onUploadTake, onUploadAudio, onUploadPdf,
}: WizardStepProps) {
  const stepName = steps[step];
  const inputStyle = {
    width: "100%", padding: "11px 14px", borderRadius: "10px",
    border: "1px solid rgba(255,255,255,0.1)", backgroundColor: "#0e0e0f",
    fontSize: "14px", color: "var(--as-text)", outline: "none",
    fontFamily: "inherit",
  };
  const labelStyle: React.CSSProperties = { fontSize: "13px", fontWeight: "500", color: "var(--as-text)", display: "block", marginBottom: "6px" };

  // ── Prompt step ──
  if (stepName === "Prompt") {
    return (
      <div>
        <h4 style={{ fontSize: "16px", fontWeight: "600", color: "var(--as-text)", marginBottom: "12px" }}>Your Recording Prompt</h4>
        {gig.prompt_text ? (
          <div style={{ padding: "16px 20px", borderRadius: "12px", backgroundColor: "rgba(255,215,0,0.06)", border: "1px solid rgba(255,215,0,0.2)", lineHeight: "1.6", fontSize: "15px", color: "var(--as-text)" }}>
            {gig.prompt_text}
          </div>
        ) : (
          <p style={{ color: "var(--as-text-muted)", fontSize: "14px" }}>No specific prompt. Use your best judgment for this role.</p>
        )}
        <p style={{ fontSize: "12px", color: "var(--as-text-muted)", marginTop: "16px" }}>
          Read the prompt carefully before recording. It will be shown as an overlay during recording.
        </p>
      </div>
    );
  }

  // ── Record Takes step ──
  if (stepName === "Record Takes") {
    return (
      <div>
        <h4 style={{ fontSize: "16px", fontWeight: "600", color: "var(--as-text)", marginBottom: "12px" }}>Record Your Self-Tape</h4>
        <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
          {(["record", "upload"] as const).map(m => (
            <button key={m} onClick={() => setRecordMode(m)} style={{ padding: "8px 18px", borderRadius: "9999px", fontSize: "13px", fontWeight: "600", border: `1px solid ${recordMode === m ? "var(--as-accent)" : "var(--as-border)"}`, backgroundColor: recordMode === m ? "var(--as-accent)" : "transparent", color: recordMode === m ? C.onGold : "var(--as-text-muted)", cursor: "pointer" }}>
              {m === "record" ? <><Video style={{ width: "12px", height: "12px", display: "inline", marginRight: "4px" }} />Record in App</> : <><FileUp style={{ width: "12px", height: "12px", display: "inline", marginRight: "4px" }} />Upload File</>}
            </button>
          ))}
        </div>

        {recordMode === "record" ? (
          <div style={{ position: "relative" }}>
            {gig.prompt_text && (
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 10, backgroundColor: "rgba(0,0,0,0.7)", color: "white", padding: "10px 14px", fontSize: "13px", borderRadius: "12px 12px 0 0", lineHeight: "1.4" }}>
                {gig.prompt_text}
              </div>
            )}
            <div style={{ marginTop: gig.prompt_text ? "0" : "0" }}>
              <ReelRecorder reelType="reel" onRecordingComplete={onTakeRecorded} />
            </div>
            {uploadingTake && <p style={{ color: "var(--as-text-muted)", fontSize: "13px", marginTop: "8px" }}>Uploading take…</p>}
          </div>
        ) : (
          <div>
            <label style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "32px", border: "2px dashed var(--as-border)", borderRadius: "12px", cursor: "pointer", gap: "8px" }}>
              <FileUp style={{ width: "32px", height: "32px", color: "var(--as-text-muted)" }} />
              <span style={{ fontSize: "14px", color: "var(--as-text-muted)" }}>Click to upload video file</span>
              <input type="file" accept="video/*" onChange={onUploadTake} style={{ display: "none" }} />
            </label>
            {uploadingTake && <p style={{ color: "var(--as-text-muted)", fontSize: "13px", marginTop: "8px" }}>Uploading…</p>}
          </div>
        )}

        {takes.length > 0 && (
          <div style={{ marginTop: "20px" }}>
            <p style={{ fontSize: "13px", fontWeight: "500", color: "var(--as-text)", marginBottom: "10px" }}>Takes ({takes.length}/5)</p>
            {takes.map((t, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px", borderRadius: "10px", backgroundColor: selectedTake === i ? "rgba(255,215,0,0.08)" : "#201f20", border: `1px solid ${selectedTake === i ? "var(--as-accent)" : "transparent"}`, marginBottom: "8px" }}>
                <input type="radio" checked={selectedTake === i} onChange={() => setSelectedTake(i)} style={{ accentColor: "var(--as-accent)" }} />
                <span style={{ flex: 1, fontSize: "13px", color: "var(--as-text)" }}>{t.label} {t.duration > 0 ? `(${Math.floor(t.duration)}s)` : ""}</span>
                {selectedTake === i && <span style={{ fontSize: "11px", color: "var(--as-accent)", fontWeight: "600" }}>SELECTED</span>}
                <button onClick={() => { const nt = takes.filter((_, idx) => idx !== i); setTakes(nt); if (selectedTake === i) setSelectedTake(nt.length > 0 ? 0 : null); setClipOrder(nt.map((_, idx) => idx)); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#DC2626" }}>
                  <Trash2 style={{ width: "14px", height: "14px" }} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── Record Audio step ──
  if (stepName === "Record Audio") {
    return (
      <div>
        <h4 style={{ fontSize: "16px", fontWeight: "600", color: "var(--as-text)", marginBottom: "12px" }}>Record or Upload Audio</h4>
        {gig.prompt_text && (
          <div style={{ padding: "12px 16px", borderRadius: "10px", backgroundColor: "rgba(255,215,0,0.06)", border: "1px solid rgba(255,215,0,0.2)", fontSize: "13px", color: "var(--as-text)", marginBottom: "16px", lineHeight: "1.5" }}>
            <strong>Prompt: </strong>{gig.prompt_text}
          </div>
        )}
        <label style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "32px", border: "2px dashed var(--as-border)", borderRadius: "12px", cursor: "pointer", gap: "8px" }}>
          <Mic style={{ width: "32px", height: "32px", color: "var(--as-text-muted)" }} />
          <span style={{ fontSize: "14px", color: "var(--as-text-muted)" }}>Click to upload audio file (MP3, WAV, M4A)</span>
          <input type="file" accept="audio/*" onChange={onUploadAudio} style={{ display: "none" }} />
        </label>
        {uploadingAudio && <p style={{ color: "var(--as-text-muted)", fontSize: "13px", marginTop: "8px" }}>Uploading…</p>}
        {audioUrl && (
          <div style={{ marginTop: "16px" }}>
            <p style={{ fontSize: "13px", fontWeight: "500", color: "var(--as-text)", marginBottom: "8px" }}>Your audio:</p>
            <audio controls src={audioUrl} style={{ width: "100%" }} />
          </div>
        )}
      </div>
    );
  }

  // ── Order Clips step ──
  if (stepName === "Order Clips") {
    return (
      <div>
        <h4 style={{ fontSize: "16px", fontWeight: "600", color: "var(--as-text)", marginBottom: "8px" }}>Order Your Clips</h4>
        <p style={{ fontSize: "13px", color: "var(--as-text-muted)", marginBottom: "16px" }}>Drag the arrows to reorder which clips appear first in your submission.</p>
        {clipOrder.map((takeIdx, orderPos) => {
          const t = takes[takeIdx];
          if (!t) return null;
          return (
            <div key={orderPos} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px", borderRadius: "10px", backgroundColor: "#201f20", marginBottom: "8px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                <button disabled={orderPos === 0} onClick={() => {
                  const nc = [...clipOrder];
                  [nc[orderPos - 1], nc[orderPos]] = [nc[orderPos], nc[orderPos - 1]];
                  setClipOrder(nc);
                }} style={{ background: "none", border: "none", cursor: orderPos === 0 ? "not-allowed" : "pointer", opacity: orderPos === 0 ? 0.3 : 1, padding: "2px" }}>
                  <ArrowUp style={{ width: "14px", height: "14px" }} />
                </button>
                <button disabled={orderPos === clipOrder.length - 1} onClick={() => {
                  const nc = [...clipOrder];
                  [nc[orderPos], nc[orderPos + 1]] = [nc[orderPos + 1], nc[orderPos]];
                  setClipOrder(nc);
                }} style={{ background: "none", border: "none", cursor: orderPos === clipOrder.length - 1 ? "not-allowed" : "pointer", opacity: orderPos === clipOrder.length - 1 ? 0.3 : 1, padding: "2px" }}>
                  <ArrowDown style={{ width: "14px", height: "14px" }} />
                </button>
              </div>
              <span style={{ fontSize: "13px", color: "var(--as-text)", flex: 1 }}>{t.label}</span>
              <span style={{ fontSize: "11px", color: "var(--as-text-muted)" }}>#{orderPos + 1}</span>
            </div>
          );
        })}
      </div>
    );
  }

  // ── Slate step ──
  if (stepName === "Slate") {
    return (
      <div>
        <h4 style={{ fontSize: "16px", fontWeight: "600", color: "var(--as-text)", marginBottom: "8px" }}>Slate Template</h4>
        <p style={{ fontSize: "13px", color: "var(--as-text-muted)", marginBottom: "16px" }}>Fill in your slate details. This will appear at the start of your submission.</p>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px" }}>
          {(["name", "role", "agency", "custom_text"] as const).map(field => (
            <div key={field}>
              <label style={labelStyle}>{field === "custom_text" ? "Custom Line" : field.charAt(0).toUpperCase() + field.slice(1)}</label>
              <input
                type="text"
                value={slateData[field]}
                onChange={e => setSlateData(prev => ({ ...prev, [field]: e.target.value }))}
                placeholder={field === "custom_text" ? "e.g. represented by..." : ""}
                style={inputStyle}
              />
            </div>
          ))}
        </div>
        {/* Live preview */}
        <div style={{ padding: "20px", borderRadius: "12px", backgroundColor: "#0e0e0f", border: `1px solid ${C.border}`, color: "white", textAlign: "center" }}>
          <p style={{ fontSize: "18px", fontWeight: "600", marginBottom: "4px" }}>{slateData.name || "Your Name"}</p>
          <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.7)", marginBottom: "4px" }}>{slateData.role || gig.title}</p>
          {slateData.agency && <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)", marginBottom: "4px" }}>{slateData.agency}</p>}
          {slateData.custom_text && <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)" }}>{slateData.custom_text}</p>}
        </div>
      </div>
    );
  }

  // ── Cover Note step ──
  if (stepName === "Cover Note") {
    return (
      <div>
        <h4 style={{ fontSize: "16px", fontWeight: "600", color: "var(--as-text)", marginBottom: "8px" }}>Cover Note</h4>
        {gig.questionnaire && gig.questionnaire.length > 0 && (
          <div style={{ marginBottom: "20px" }}>
            <p style={{ fontSize: "13px", fontWeight: "500", color: "var(--as-text)", marginBottom: "12px" }}>Hiring Questions</p>
            {gig.questionnaire.map((q, idx) => (
              <div key={idx} style={{ marginBottom: "12px" }}>
                <label style={labelStyle}>{q.question} <span style={{ color: "var(--as-accent)" }}>*</span></label>
                {q.type === "Yes/No" ? (
                  <select required value={questionAnswers[q.question] || ""} onChange={e => setQuestionAnswers(prev => ({ ...prev, [q.question]: e.target.value }))} style={inputStyle}>
                    <option value="">Select</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                ) : (
                  <input type="text" required value={questionAnswers[q.question] || ""} onChange={e => setQuestionAnswers(prev => ({ ...prev, [q.question]: e.target.value }))} placeholder="Your answer" style={inputStyle} />
                )}
              </div>
            ))}
          </div>
        )}
        {gig.portfolio_requirements && gig.portfolio_requirements.length > 0 && (
          <div style={{ marginBottom: "20px" }}>
            <p style={{ fontSize: "13px", fontWeight: "500", color: "var(--as-text)", marginBottom: "12px" }}>Portfolio Links</p>
            {gig.portfolio_requirements.map((req, idx) => (
              <div key={idx} style={{ marginBottom: "12px" }}>
                <label style={labelStyle}>{req.label} <span style={{ color: "var(--as-accent)" }}>*</span></label>
                {req.description && <p style={{ fontSize: "12px", color: "var(--as-text-muted)", marginBottom: "6px" }}>{req.description}</p>}
                <input type="url" required value={portfolioUrls[req.label] || ""} onChange={e => setPortfolioUrls(prev => ({ ...prev, [req.label]: e.target.value }))} placeholder="https://..." style={inputStyle} />
              </div>
            ))}
          </div>
        )}
        <label style={labelStyle}>Your Cover Note <span style={{ color: "var(--as-accent)" }}>*</span></label>
        <textarea
          required value={coverNote} onChange={e => setCoverNote(e.target.value)}
          placeholder="Explain why you're right for this role…" rows={5}
          style={{ ...inputStyle, resize: "vertical" }}
          onFocus={e => e.currentTarget.style.borderColor = "var(--as-accent)"}
          onBlur={e => e.currentTarget.style.borderColor = "var(--as-border)"}
        />
      </div>
    );
  }

  // ── Select Slot step ──
  if (stepName === "Select Slot") {
    return (
      <div>
        <h4 style={{ fontSize: "16px", fontWeight: "600", color: "var(--as-text)", marginBottom: "8px" }}>Select an Audition Slot</h4>
        {availableSlots.length === 0 ? (
          <p style={{ color: "var(--as-text-muted)", fontSize: "14px" }}>No slots available yet. Check back later.</p>
        ) : (
          availableSlots.map(slot => {
            const start = new Date(slot.start_time);
            const end = new Date(slot.end_time);
            const booked = !!slot.booked_by;
            return (
              <div key={slot.id} onClick={() => !booked && setAuditionSlotId(String(slot.id))} style={{ padding: "14px 16px", borderRadius: "12px", border: `1px solid ${auditionSlotId === String(slot.id) ? "var(--as-accent)" : "var(--as-border)"}`, backgroundColor: booked ? "#201f20" : auditionSlotId === String(slot.id) ? "rgba(255,215,0,0.06)" : "#0e0e0f", marginBottom: "10px", cursor: booked ? "not-allowed" : "pointer", opacity: booked ? 0.6 : 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <p style={{ fontWeight: "500", fontSize: "14px", color: "var(--as-text)", marginBottom: "2px" }}>
                      {start.toLocaleDateString()} · {start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} – {end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                    {slot.location_or_link && <p style={{ fontSize: "12px", color: "var(--as-text-muted)" }}>{slot.location_or_link}</p>}
                  </div>
                  {booked ? (
                    <span style={{ fontSize: "11px", color: "#ffb4ab", backgroundColor: "rgba(225,1,17,0.15)", border: "1px solid rgba(225,1,17,0.3)", padding: "3px 10px", borderRadius: "9999px" }}>Booked</span>
                  ) : (
                    auditionSlotId === String(slot.id) && <CheckCircle2 style={{ width: "18px", height: "18px", color: "var(--as-accent)" }} />
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    );
  }

  // ── Upload PDFs step ──
  if (stepName === "Upload PDFs") {
    return (
      <div>
        <h4 style={{ fontSize: "16px", fontWeight: "600", color: "var(--as-text)", marginBottom: "8px" }}>Upload PDFs / Documents</h4>
        <label style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "32px", border: "2px dashed var(--as-border)", borderRadius: "12px", cursor: "pointer", gap: "8px" }}>
          <FileUp style={{ width: "32px", height: "32px", color: "var(--as-text-muted)" }} />
          <span style={{ fontSize: "14px", color: "var(--as-text-muted)" }}>Click to upload PDF</span>
          <input type="file" accept=".pdf,.doc,.docx" onChange={onUploadPdf} style={{ display: "none" }} />
        </label>
        {uploadingPdf && <p style={{ color: "var(--as-text-muted)", fontSize: "13px", marginTop: "8px" }}>Uploading…</p>}
        {pdfUrls.length > 0 && (
          <div style={{ marginTop: "16px" }}>
            {pdfUrls.map((url, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 12px", borderRadius: "8px", backgroundColor: "#201f20", marginBottom: "6px" }}>
                <FileText style={{ width: "14px", height: "14px", color: "var(--as-accent)" }} />
                <span style={{ fontSize: "13px", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{url.split("/").pop()}</span>
                <button onClick={() => setPdfUrls(prev => prev.filter((_, idx) => idx !== i))} style={{ background: "none", border: "none", cursor: "pointer", color: "#DC2626" }}>
                  <Trash2 style={{ width: "13px", height: "13px" }} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── Consent step ──
  if (stepName === "Consent") {
    return (
      <div>
        <h4 style={{ fontSize: "16px", fontWeight: "600", color: "var(--as-text)", marginBottom: "16px" }}>Delivery Settings</h4>
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderRadius: "12px", border: "1px solid var(--as-border)", cursor: "pointer" }}>
            <div>
              <p style={{ fontWeight: "500", fontSize: "14px", color: "var(--as-text)", marginBottom: "2px" }}>Scout-only visibility</p>
              <p style={{ fontSize: "12px", color: "var(--as-text-muted)" }}>Only the casting team can see your submission</p>
            </div>
            <input type="checkbox" checked={!visibilityConsent} onChange={e => setVisibilityConsent(!e.target.checked)} style={{ accentColor: "var(--as-accent)", width: "16px", height: "16px" }} />
          </label>
          <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderRadius: "12px", border: "1px solid var(--as-border)", cursor: "pointer" }}>
            <div>
              <p style={{ fontWeight: "500", fontSize: "14px", color: "var(--as-text)", marginBottom: "2px" }}>Allow download</p>
              <p style={{ fontSize: "12px", color: "var(--as-text-muted)" }}>Reviewers can download your submission</p>
            </div>
            <input type="checkbox" checked={downloadAllowed} onChange={e => setDownloadAllowed(e.target.checked)} style={{ accentColor: "var(--as-accent)", width: "16px", height: "16px" }} />
          </label>
        </div>
        <p style={{ fontSize: "12px", color: "var(--as-text-muted)", marginTop: "16px" }}>Your submission will display viewer identity for security (watermarked with reviewer email + date).</p>
      </div>
    );
  }

  // ── Preview step ──
  if (stepName === "Preview") {
    const previewUrl = takes.length > 0 && selectedTake !== null ? takes[selectedTake].video_url : null;
    return (
      <div>
        <h4 style={{ fontSize: "16px", fontWeight: "600", color: "var(--as-text)", marginBottom: "12px" }}>Preview Your Submission</h4>
        {previewUrl && (
          <div style={{ position: "relative", borderRadius: "12px", overflow: "hidden", marginBottom: "16px" }}>
            <video src={previewUrl} controls style={{ width: "100%", display: "block", maxHeight: "260px", objectFit: "cover" }} />
            {/* Watermark badge */}
            <div style={{ position: "absolute", top: "10px", right: "10px", backgroundColor: "rgba(0,0,0,0.6)", color: "white", fontSize: "11px", padding: "4px 10px", borderRadius: "9999px", backdropFilter: "blur(4px)" }}>
              {currentUser?.email} · {new Date().toLocaleDateString()}
            </div>
          </div>
        )}
        {audioUrl && (
          <div style={{ marginBottom: "16px" }}>
            <audio controls src={audioUrl} style={{ width: "100%" }} />
          </div>
        )}
        <div style={{ padding: "14px 16px", borderRadius: "12px", backgroundColor: "#201f20", marginBottom: "16px" }}>
          <p style={{ fontSize: "13px", fontWeight: "500", color: "var(--as-text)", marginBottom: "6px" }}>Cover Note:</p>
          <p style={{ fontSize: "13px", color: "var(--as-text-muted)", lineHeight: "1.5", margin: 0 }}>{coverNote || "(no cover note)"}</p>
        </div>
        <p style={{ fontSize: "12px", color: "var(--as-text-muted)" }}>By submitting you confirm this is your original work and you have the rights to submit it.</p>
      </div>
    );
  }

  // ── Submit step (final review) ──
  if (stepName === "Submit") {
    return (
      <div>
        <h4 style={{ fontSize: "16px", fontWeight: "600", color: "var(--as-text)", marginBottom: "12px" }}>Ready to Submit</h4>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 14px", borderRadius: "10px", backgroundColor: "#201f20" }}>
            <span style={{ fontSize: "13px", color: "var(--as-text-muted)" }}>Submission type</span>
            <span style={{ fontSize: "13px", fontWeight: "500" }}>{gig.submission_type.replace(/_/g, " ")}</span>
          </div>
          {takes.length > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 14px", borderRadius: "10px", backgroundColor: "#201f20" }}>
              <span style={{ fontSize: "13px", color: "var(--as-text-muted)" }}>Video takes</span>
              <span style={{ fontSize: "13px", fontWeight: "500" }}>{takes.length} take(s) · #{(selectedTake ?? 0) + 1} selected</span>
            </div>
          )}
          {audioUrl && (
            <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 14px", borderRadius: "10px", backgroundColor: "#201f20" }}>
              <span style={{ fontSize: "13px", color: "var(--as-text-muted)" }}>Audio</span>
              <span style={{ fontSize: "13px", fontWeight: "500" }}>1 file</span>
            </div>
          )}
          {pdfUrls.length > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 14px", borderRadius: "10px", backgroundColor: "#201f20" }}>
              <span style={{ fontSize: "13px", color: "var(--as-text-muted)" }}>Documents</span>
              <span style={{ fontSize: "13px", fontWeight: "500" }}>{pdfUrls.length} file(s)</span>
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 14px", borderRadius: "10px", backgroundColor: "#201f20" }}>
            <span style={{ fontSize: "13px", color: "var(--as-text-muted)" }}>Download allowed</span>
            <span style={{ fontSize: "13px", fontWeight: "500" }}>{downloadAllowed ? "Yes" : "No"}</span>
          </div>
        </div>
        <p style={{ fontSize: "12px", color: "var(--as-text-muted)" }}>By submitting you confirm this is your original work.</p>
        {applyError && (
          <div style={{ marginTop: "12px", padding: "10px 14px", borderRadius: "10px", backgroundColor: "rgba(220,38,38,0.1)", border: "1px solid rgba(220,38,38,0.2)", display: "flex", gap: "8px", alignItems: "center" }}>
            <AlertCircle style={{ width: "14px", height: "14px", color: "#DC2626", flexShrink: 0 }} />
            <p style={{ fontSize: "13px", color: "#DC2626", margin: 0 }}>{applyError}</p>
          </div>
        )}
      </div>
    );
  }

  return null;
}