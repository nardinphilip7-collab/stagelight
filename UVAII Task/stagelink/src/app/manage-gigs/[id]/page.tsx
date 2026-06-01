"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { apiClient } from "@/lib/api";
import { getUser } from "@/lib/auth";
import {
  ArrowLeft, Video, Mail, CheckCircle2,
  Loader2, StickyNote, DollarSign, Users, Briefcase,
  Calendar, Star, Send, X, ChevronDown,
  Clock, Eye, FileText, Mic, FileBadge,
  Maximize2, Tag, Activity, RotateCcw, AlertCircle,
} from "lucide-react";

const STAGES = [
  { id: "New",         label: "New Applications", color: "#9A9A9A", bg: "rgba(154,154,154,0.12)" },
  { id: "Shortlisted", label: "Shortlisted",      color: "#60A5FA", bg: "rgba(96,165,250,0.12)" },
  { id: "Callback",    label: "Callback",          color: "#FB923C", bg: "rgba(251,146,60,0.12)" },
  { id: "Avail Check", label: "Avail Check",       color: "#A78BFA", bg: "rgba(167,139,250,0.12)" },
  { id: "Approved",    label: "Selected",          color: "#34D399", bg: "rgba(52,211,153,0.12)" },
  { id: "Hired",       label: "Contracted",        color: "#10B981", bg: "rgba(16,185,129,0.12)" },
  { id: "Rejected",    label: "Rejected",          color: "#F87171", bg: "rgba(248,113,113,0.12)" },
];

interface Opportunity {
  id: string;
  title: string;
  applicants: number;
  posted: string;
  deadline: string;
  questionnaire?: { question: string; type: string }[];
  portfolio_requirements?: { label: string; description: string }[];
}

interface Application {
  id: string;
  stage: string;
  cover_note: string;
  video_url: string | null;
  audio_url?: string | null;
  pdf_urls?: string[];
  takes?: {video_url: string; duration: number; label: string}[];
  notes: string;
  shared_notes?: string;
  questionnaire_answers?: Record<string, string>;
  portfolio_submissions?: Record<string, string>;
  talent: string;
  talent_name: string;
  talent_avatar: string;
  talent_category: string;
  submitted_at: string;
  star_rating?: number | null;
  review_state?: string;
  tags?: string[];
  opportunity_submission_type?: string;
  talent_availability_status?: string;
  audition_slot?: { id: number; start_time: string; end_time: string; location_or_link: string } | null;
}

interface AuditEntry { id: number; user_email: string; action: string; old_value: string; new_value: string; timestamp: string; note: string; }
interface CallbackRound { id: number; round_number: number; scheduled_date: string | null; notes: string; }
interface AvailWindow { id: number; start_date: string; end_date: string; state: string; note: string; willing_to_travel: boolean; }

export default function PipelinePage() {
  const { id } = useParams();
  const router = useRouter();

  const [gig, setGig] = useState<Opportunity | null>(null);
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [movingId, setMovingId] = useState<string | null>(null);
  const [noteValues, setNoteValues] = useState<Record<string, string>>({});
  const [savingNote, setSavingNote] = useState<string | null>(null);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [showDetailsPanel, setShowDetailsPanel] = useState(false);
  const [offerForms, setOfferForms] = useState<Record<string, { amount: string; currency: string; message: string; start_date: string; end_date: string; submitting: boolean; success: boolean; error: string }>>({});
  const [stageError, setStageError] = useState<string | null>(null);
  const [noteSaved, setNoteSaved] = useState<string | null>(null);
  const [noteError, setNoteError] = useState<string | null>(null);
  const [confirmMove, setConfirmMove] = useState<{ appId: string; stageName: string; stageLabel: string; appName: string } | null>(null);

  // New state for queue + review features
  const [activeTab, setActiveTab] = useState<"queue" | "kanban" | "callbacks">("queue");
  const [selectedAppIds, setSelectedAppIds] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<"date" | "rating" | "stage" | "name">("date");
  const [filterStage, setFilterStage] = useState<string>("all");
  const [filterReviewState, setFilterReviewState] = useState<string>("all");
  const [focusedRowIdx, setFocusedRowIdx] = useState<number>(-1);
  const [fullScreenUrl, setFullScreenUrl] = useState<string | null>(null);
  const [activityLogs, setActivityLogs] = useState<Record<string, AuditEntry[]>>({});
  const [activityExpanded, setActivityExpanded] = useState<Record<string, boolean>>({});
  const [callbackRounds, setCallbackRounds] = useState<Record<string, CallbackRound[]>>({});
  const [newRoundForms, setNewRoundForms] = useState<Record<string, { open: boolean; round_number: number; scheduled_date: string; notes: string }>>({});
  const [bulkRejecting, setBulkRejecting] = useState(false);
  const [showBulkConfirm, setShowBulkConfirm] = useState(false);
  const [tagInput, setTagInput] = useState<Record<string, string>>({});
  const [sharedNoteValues, setSharedNoteValues] = useState<Record<string, string>>({});
  const [savingSharedNote, setSavingSharedNote] = useState<string | null>(null);
  const [videoSpeed, setVideoSpeed] = useState<Record<string, number>>({}); // appId -> speed multiplier
  const [offerAvailWindows, setOfferAvailWindows] = useState<Record<string, AvailWindow[]>>({}); // talentId -> windows
  const [panelTab, setPanelTab] = useState<"submission" | "review" | "notes">("submission");


  useEffect(() => {
    const user = getUser();
    if (!user) { router.replace("/login"); return; }
    if (user.role !== "HIRER" && user.role !== "AGENCY") { router.replace("/dashboard"); return; }
    Promise.all([
      apiClient.get<Opportunity>(`/opportunities/${id}/`),
      apiClient.get<Application[]>(`/applications/?opportunity=${id}`),
    ])
      .then(([opp, applications]) => {
        setGig(opp);
        setApps(applications);
        const initial: Record<string, string> = {};
        const sharedInitial: Record<string, string> = {};
        applications.forEach(a => {
          initial[a.id] = a.notes ?? "";
          sharedInitial[a.id] = a.shared_notes ?? "";
        });
        setNoteValues(initial);
        setSharedNoteValues(sharedInitial);
      })
      .catch(() => router.push('/manage-gigs'))
      .finally(() => setLoading(false));
  }, [id, router]);

  const handleSaveNote = async (appId: string) => {
    setSavingNote(appId);
    setNoteSaved(null);
    setNoteError(null);
    try {
      await apiClient.patch(`/applications/${appId}/notes/`, { notes: noteValues[appId] ?? "" });
      setApps(prev => prev.map(a => a.id === appId ? { ...a, notes: noteValues[appId] ?? "" } : a));
      setNoteSaved(appId);
      setTimeout(() => setNoteSaved(null), 2500);
    } catch {
      setNoteError(appId);
      setTimeout(() => setNoteError(null), 3000);
    } finally {
      setSavingNote(null);
    }
  };

  const handleMoveStage = async (appId: string, newStage: string) => {
    const previousStage = apps.find(a => a.id === appId)?.stage ?? newStage;
    setApps(prev => prev.map(a => a.id === appId ? { ...a, stage: newStage } : a));
    setMovingId(appId);
    setStageError(null);
    try {
      await apiClient.patch(`/applications/${appId}/stage/`, { stage: newStage });
      if (selectedApp && selectedApp.id === appId) {
        setSelectedApp(prev => prev ? { ...prev, stage: newStage } : null);
      }
    } catch {
      setApps(prev => prev.map(a => a.id === appId ? { ...a, stage: previousStage } : a));
      setStageError("Failed to move stage. Please try again.");
      setTimeout(() => setStageError(null), 3000);
    } finally {
      setMovingId(null);
    }
  };

  const handleRate = async (appId: string, rating: number | null) => {
    const prev = apps.find(a => a.id === appId)?.star_rating;
    const newRating = prev === rating ? null : rating;
    setApps(p => p.map(a => a.id === appId ? { ...a, star_rating: newRating } : a));
    if (selectedApp?.id === appId) setSelectedApp(p => p ? { ...p, star_rating: newRating } : null);
    try { await apiClient.patch(`/applications/${appId}/rate/`, { star_rating: newRating }); }
    catch { setApps(p => p.map(a => a.id === appId ? { ...a, star_rating: prev } : a)); }
  };

  const handleReviewState = async (appId: string, state: string) => {
    const prev = apps.find(a => a.id === appId)?.review_state;
    const newState = prev === state ? "pending" : state;
    setApps(p => p.map(a => a.id === appId ? { ...a, review_state: newState } : a));
    if (selectedApp?.id === appId) setSelectedApp(p => p ? { ...p, review_state: newState } : null);
    try { await apiClient.patch(`/applications/${appId}/review-state/`, { review_state: newState }); }
    catch { setApps(p => p.map(a => a.id === appId ? { ...a, review_state: prev } : a)); }
  };

  const handleAddTag = async (appId: string) => {
    const val = (tagInput[appId] || "").trim();
    if (!val) return;
    const app = apps.find(a => a.id === appId);
    const newTags = [...(app?.tags || []), val];
    setApps(p => p.map(a => a.id === appId ? { ...a, tags: newTags } : a));
    if (selectedApp?.id === appId) setSelectedApp(p => p ? { ...p, tags: newTags } : null);
    setTagInput(p => ({ ...p, [appId]: "" }));
    try { await apiClient.patch(`/applications/${appId}/tags/`, { tags: newTags }); }
    catch { /* revert silently */ }
  };

  const handleRemoveTag = async (appId: string, tag: string) => {
    const app = apps.find(a => a.id === appId);
    const newTags = (app?.tags || []).filter(t => t !== tag);
    setApps(p => p.map(a => a.id === appId ? { ...a, tags: newTags } : a));
    if (selectedApp?.id === appId) setSelectedApp(p => p ? { ...p, tags: newTags } : null);
    try { await apiClient.patch(`/applications/${appId}/tags/`, { tags: newTags }); }
    catch { /* revert silently */ }
  };

  const handleSaveSharedNote = async (appId: string) => {
    setSavingSharedNote(appId);
    try {
      await apiClient.patch(`/applications/${appId}/shared-notes/`, { shared_notes: sharedNoteValues[appId] ?? "" });
      setApps(p => p.map(a => a.id === appId ? { ...a, shared_notes: sharedNoteValues[appId] ?? "" } : a));
    } catch { /* silent */ } finally { setSavingSharedNote(null); }
  };

  const loadAuditLog = async (appId: string) => {
    if (activityLogs[appId]) {
      setActivityExpanded(p => ({ ...p, [appId]: !p[appId] }));
      return;
    }
    try {
      const logs = await apiClient.get<AuditEntry[]>(`/applications/${appId}/audit/`);
      setActivityLogs(p => ({ ...p, [appId]: logs }));
      setActivityExpanded(p => ({ ...p, [appId]: true }));
    } catch { /* silent */ }
  };

  const loadCallbackRounds = async (appId: string) => {
    try {
      const rounds = await apiClient.get<CallbackRound[]>(`/callback-rounds/?application=${appId}`);
      setCallbackRounds(p => ({ ...p, [appId]: rounds }));
    } catch { /* silent */ }
  };

  const handleCreateCallbackRound = async (appId: string) => {
    const form = newRoundForms[appId];
    if (!form) return;
    try {
      const round = await apiClient.post<CallbackRound>("/callback-rounds/", {
        opportunity: id,
        application: appId,
        round_number: form.round_number,
        scheduled_date: form.scheduled_date || null,
        notes: form.notes,
      });
      setCallbackRounds(p => ({ ...p, [appId]: [...(p[appId] || []), round] }));
      setNewRoundForms(p => ({ ...p, [appId]: { ...p[appId], open: false } }));
    } catch { /* silent */ }
  };

  const handleBulkReject = async () => {
    setBulkRejecting(true);
    try {
      const ids = Array.from(selectedAppIds);
      await apiClient.post("/applications/bulk-reject/", { ids });
      setApps(p => p.map(a => selectedAppIds.has(a.id) ? { ...a, stage: "Rejected" } : a));
      setSelectedAppIds(new Set());
      setShowBulkConfirm(false);
    } catch { /* silent */ } finally { setBulkRejecting(false); }
  };

  const loadTalentAvailability = async (talentId: string) => {
    if (offerAvailWindows[talentId]) return;
    try {
      const windows = await apiClient.get<AvailWindow[]>(`/availability/?talent=${talentId}`);
      setOfferAvailWindows(p => ({ ...p, [talentId]: windows }));
    } catch { /* silent */ }
  };

  const getAvailConflict = (talentId: string, startDate: string, endDate: string): { level: "ok" | "warn" | "conflict"; message: string } => {
    const windows = offerAvailWindows[talentId];
    if (!windows || !startDate || !endDate) return { level: "ok", message: "" };
    const start = new Date(startDate);
    const end = new Date(endDate);
    for (const w of windows) {
      const ws = new Date(w.start_date);
      const we = new Date(w.end_date);
      if (start <= we && end >= ws) {
        if (w.state === "booked" || w.state === "unavailable") {
          return { level: "conflict", message: `${w.state === "booked" ? "Already booked" : "Unavailable"} ${w.start_date} – ${w.end_date}${w.note ? ` · ${w.note}` : ""}` };
        }
        if (w.state === "tentative") {
          return { level: "warn", message: `Tentative availability ${w.start_date} – ${w.end_date}${w.note ? ` · ${w.note}` : ""}` };
        }
      }
    }
    if (windows.length > 0) return { level: "ok", message: "Available during these dates" };
    return { level: "ok", message: "" };
  };

  const openApplicantDetails = (app: Application) => {
    setSelectedApp(app);
    setShowDetailsPanel(true);
  };

  const closeDetailsPanel = () => {
    setShowDetailsPanel(false);
    setSelectedApp(null);
  };

  const Tl = {
    bg: "#131314", surface: "#201f20", surfaceLow: "#1c1b1c", surfaceHigh: "#2a2a2b",
    primary: "#fff6df", gold: "#ffe16d", onGold: "#3a3000", red: "#e10111",
    text: "#e5e2e3", muted: "#d0c6ab", mutedDim: "#999077",
    border: "rgba(77, 71, 50, 0.2)", syne: "var(--font-syne, 'Syne', sans-serif)",
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: Tl.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: `linear-gradient(135deg, ${Tl.gold} 0%, #8a6a00 100%)`, margin: "0 auto 16px", animation: "pulse 1.5s ease-in-out infinite" }} />
          <p style={{ color: Tl.muted, fontFamily: Tl.syne }}>Loading pipeline...</p>
        </div>
      </div>
    );
  }

  if (!gig) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: Tl.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", maxWidth: "400px", padding: "32px" }}>
          <div style={{ width: "80px", height: "80px", borderRadius: "20px", backgroundColor: Tl.surface, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
            <Briefcase style={{ width: "40px", height: "40px", color: Tl.gold }} />
          </div>
          <h2 style={{ fontSize: "24px", fontWeight: "600", fontFamily: Tl.syne, color: Tl.primary, marginBottom: "8px" }}>Opportunity Not Found</h2>
          <p style={{ color: Tl.muted, marginBottom: "24px" }}>The opportunity you're looking for doesn't exist or has been removed.</p>
          <button onClick={() => router.back()} style={{ padding: "10px 24px", borderRadius: "9999px", backgroundColor: Tl.gold, color: Tl.onGold, border: "none", cursor: "pointer", fontWeight: "600" }}>
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const getStageConfig = (stage: string) => STAGES.find(s => s.id === stage) || STAGES[0];

  const REVIEW_STATES = [
    { id: "pending", label: "Pending", color: "#9A9A9A" },
    { id: "shortlisted", label: "Shortlisted", color: "#3B82F6" },
    { id: "starred", label: "Starred", color: "#F59E0B" },
    { id: "flagged", label: "Flagged", color: "#DC2626" },
    { id: "passed", label: "Passed", color: "#6B7280" },
  ];

  const SUBMISSION_TYPE_LABELS: Record<string, string> = {
    SELF_TAPE: "Self-tape", AUDIO: "Audio", LIVE_AUDITION: "Live Audition",
    WRITTEN: "Written", PROFILE_ONLY: "Profile",
  };

  const sortedFilteredApps = apps
    .filter(a => filterStage === "all" || a.stage === filterStage)
    .filter(a => filterReviewState === "all" || (a.review_state || "pending") === filterReviewState)
    .sort((a, b) => {
      if (sortBy === "date") return new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime();
      if (sortBy === "rating") return (b.star_rating ?? 0) - (a.star_rating ?? 0);
      if (sortBy === "stage") return STAGES.findIndex(s => s.id === a.stage) - STAGES.findIndex(s => s.id === b.stage);
      if (sortBy === "name") return (a.talent_name || "").localeCompare(b.talent_name || "");
      return 0;
    });

  const callbackApps = apps.filter(a => a.stage === "Callback");

  const stats = {
    total: apps.length,
    new: apps.filter(a => a.stage === "New").length,
    shortlisted: apps.filter(a => a.stage === "Shortlisted").length,
    callback: apps.filter(a => a.stage === "Callback").length,
    availCheck: apps.filter(a => a.stage === "Avail Check").length,
    approved: apps.filter(a => a.stage === "Approved").length,
    hired: apps.filter(a => a.stage === "Hired").length,
    rejected: apps.filter(a => a.stage === "Rejected").length,
  };

  const T = {
    bg:          "#131314",
    surface:     "#201f20",
    surfaceLow:  "#1c1b1c",
    surfaceHigh: "#2a2a2b",
    glass:       "rgba(22, 22, 24, 0.7)",
    border:      "rgba(77, 71, 50, 0.2)",
    primary:     "#fff6df",
    gold:        "#ffe16d",
    onGold:      "#3a3000",
    red:         "#e10111",
    text:        "#e5e2e3",
    muted:       "#d0c6ab",
    mutedDim:    "#999077",
    syne:        "var(--font-syne, 'Syne', sans-serif)",
    outfit:      "var(--font-outfit, 'Outfit', sans-serif)",
  };

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", backgroundColor: T.bg, overflow: "hidden" }}>

      {/* Header */}
      <div style={{
        position: "sticky",
        top: 0,
        zIndex: 40,
        backgroundColor: "rgba(19,19,20,0.95)",
        backdropFilter: "blur(12px)",
        borderBottom: `1px solid ${T.border}`,
        padding: "20px 24px",
      }}>
        <div style={{ maxWidth: "1600px", margin: "0 auto" }}>
          <Link href="/manage-gigs" style={{ display: "inline-flex", alignItems: "center", gap: "8px", color: T.muted, fontSize: "13px", marginBottom: "12px", textDecoration: "none" }}>
            <ArrowLeft style={{ width: "16px", height: "16px" }} />
            Back to Gigs
          </Link>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
            <div>
              <h1 style={{ fontFamily: T.syne, fontSize: "28px", fontWeight: "700", color: T.primary, letterSpacing: "-0.02em", marginBottom: "8px" }}>
                {gig.title}
              </h1>
              <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
                <span style={{ fontSize: "13px", color: T.muted, display: "flex", alignItems: "center", gap: "6px" }}>
                  <Users style={{ width: "14px", height: "14px" }} />
                  {stats.total} Total Applicants
                </span>
                <span style={{ fontSize: "13px", color: T.muted, display: "flex", alignItems: "center", gap: "6px" }}>
                  <Calendar style={{ width: "14px", height: "14px" }} />
                  Posted {gig.posted}
                </span>
              </div>
            </div>

            {/* Stats Cards */}
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              {[
                { label: "New",        value: stats.new,        color: "#9A9A9A" },
                { label: "Shortlisted",value: stats.shortlisted, color: "#60A5FA" },
                { label: "Callback",   value: stats.callback,   color: "#FB923C" },
                { label: "Avail Check",value: stats.availCheck, color: "#A78BFA" },
                { label: "Selected",   value: stats.approved,   color: "#34D399" },
                { label: "Contracted", value: stats.hired,      color: "#10B981" },
                { label: "Rejected",   value: stats.rejected,   color: "#F87171" },
              ].map(stat => (
                <div key={stat.label} style={{ backgroundColor: T.surface, border: `1px solid ${T.border}`, borderRadius: "12px", padding: "8px 16px", textAlign: "center", minWidth: "80px" }}>
                  <p style={{ fontSize: "20px", fontWeight: "bold", color: stat.color, margin: 0 }}>{stat.value}</p>
                  <p style={{ fontSize: "10px", color: T.mutedDim, textTransform: "uppercase", letterSpacing: "0.5px", margin: 0 }}>{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tab Bar */}
      <div style={{ borderBottom: `1px solid ${T.border}`, backgroundColor: "rgba(19,19,20,0.95)", padding: "0 24px", flexShrink: 0 }}>
        <div style={{ display: "flex", gap: "0" }}>
          {(["queue", "kanban", "callbacks"] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              padding: "12px 20px", fontSize: "13px", fontWeight: "600",
              background: "none", border: "none", cursor: "pointer",
              color: activeTab === tab ? T.gold : T.muted,
              borderBottom: activeTab === tab ? `2px solid ${T.gold}` : "2px solid transparent",
              marginBottom: "-1px", textTransform: "capitalize",
              transition: "color 0.15s",
            }}>{tab === "queue" ? "Review Queue" : tab === "kanban" ? "Kanban Board" : `Callbacks (${callbackApps.length})`}</button>
          ))}
        </div>
      </div>

      {/* Bulk action bar */}
      {selectedAppIds.size > 0 && (
        <div style={{ backgroundColor: T.surfaceHigh, color: T.text, padding: "10px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0, borderBottom: `1px solid ${T.border}` }}>
          <span style={{ fontSize: "13px" }}>{selectedAppIds.size} selected</span>
          <button onClick={() => setShowBulkConfirm(true)} style={{ padding: "6px 16px", borderRadius: "9999px", backgroundColor: T.red, color: "white", border: "none", cursor: "pointer", fontSize: "13px", fontWeight: "600" }}>
            Bulk Reject
          </button>
        </div>
      )}

      {/* QUEUE TAB */}
      {activeTab === "queue" && (
        <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          {/* Sort + Filter bar */}
          <div style={{ padding: "12px 24px", borderBottom: `1px solid ${T.border}`, display: "flex", gap: "10px", flexWrap: "wrap", flexShrink: 0, backgroundColor: T.surfaceLow }}>
            {[
              { value: sortBy, onChange: (v: string) => setSortBy(v as typeof sortBy), options: [["date","Sort: Date"],["rating","Sort: Rating"],["stage","Sort: Stage"],["name","Sort: Name"]] },
              { value: filterStage, onChange: setFilterStage, options: [["all","All Stages"], ...STAGES.map(s => [s.id, s.label])] },
              { value: filterReviewState, onChange: setFilterReviewState, options: [["all","All States"], ...REVIEW_STATES.map(s => [s.id, s.label])] },
            ].map((sel, i) => (
              <select key={i} value={sel.value} onChange={e => sel.onChange(e.target.value)} style={{ padding: "6px 12px", borderRadius: "8px", border: `1px solid ${T.border}`, fontSize: "13px", cursor: "pointer", outline: "none", backgroundColor: T.surface, color: T.text }}>
                {sel.options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            ))}
            <span style={{ marginLeft: "auto", fontSize: "13px", color: T.muted, display: "flex", alignItems: "center" }}>{sortedFilteredApps.length} applicant{sortedFilteredApps.length !== 1 ? "s" : ""}</span>
          </div>
          {/* Table */}
          <div style={{ flex: 1, overflowY: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${T.border}`, backgroundColor: T.surfaceHigh }}>
                  <th style={{ width: "40px", padding: "8px 16px", textAlign: "left" }}>
                    <input type="checkbox" onChange={e => setSelectedAppIds(e.target.checked ? new Set(sortedFilteredApps.map(a => a.id)) : new Set())} style={{ accentColor: T.gold }} />
                  </th>
                  {["Applicant", "Type", "Date", "Rating", "State", "Stage"].map(h => (
                    <th key={h} style={{ padding: "8px 12px", fontSize: "11px", fontWeight: "600", color: T.mutedDim, textTransform: "uppercase", letterSpacing: "0.5px", textAlign: "left" }}>{h}</th>
                  ))}
                  <th style={{ width: "60px" }} />
                </tr>
              </thead>
              <tbody>
                {sortedFilteredApps.map((app, rowIdx) => {
                  const sc = getStageConfig(app.stage);
                  const rs = REVIEW_STATES.find(r => r.id === (app.review_state || "pending")) || REVIEW_STATES[0];
                  const isFocused = focusedRowIdx === rowIdx;
                  return (
                    <tr key={app.id}
                      tabIndex={0}
                      onFocus={() => setFocusedRowIdx(rowIdx)}
                      onClick={() => openApplicantDetails(app)}
                      onKeyDown={e => {
                        if (e.key === "j" || e.key === "J") { e.preventDefault(); setFocusedRowIdx(r => Math.min(r + 1, sortedFilteredApps.length - 1)); }
                        if (e.key === "k" || e.key === "K") { e.preventDefault(); setFocusedRowIdx(r => Math.max(r - 1, 0)); }
                        if (e.key === "s" || e.key === "S") { e.preventDefault(); handleReviewState(app.id, "shortlisted"); }
                      }}
                      style={{ borderBottom: `1px solid ${T.border}`, cursor: "pointer", backgroundColor: isFocused ? "rgba(255,214,0,0.04)" : T.surface, transition: "background 0.1s" }}
                      onMouseEnter={e => { if (!isFocused) e.currentTarget.style.backgroundColor = T.surfaceHigh; }}
                      onMouseLeave={e => { if (!isFocused) e.currentTarget.style.backgroundColor = T.surface; }}
                    >
                      <td style={{ padding: "10px 16px" }} onClick={e => e.stopPropagation()}>
                        <input type="checkbox" checked={selectedAppIds.has(app.id)}
                          onChange={e => setSelectedAppIds(p => { const ns = new Set(p); e.target.checked ? ns.add(app.id) : ns.delete(app.id); return ns; })}
                          style={{ accentColor: T.gold }} />
                      </td>
                      <td style={{ padding: "10px 12px", minWidth: "180px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: `linear-gradient(135deg, ${T.gold} 0%, #8a6a00 100%)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <span style={{ fontSize: "11px", fontWeight: "600", color: T.onGold }}>{(app.talent_name || "TA").slice(0, 2).toUpperCase()}</span>
                          </div>
                          <div>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "1px" }}>
                              <p style={{ fontSize: "13px", fontWeight: "600", color: T.text, margin: 0 }}>{app.talent_name || `#${app.talent}`}</p>
                              {app.talent_availability_status && (
                                <span style={{ fontSize: "9px", fontWeight: "600", padding: "1px 6px", borderRadius: "9999px",
                                  backgroundColor: app.talent_availability_status === "Available" ? "rgba(52,211,153,0.15)" : app.talent_availability_status === "Limited" ? "rgba(251,191,36,0.15)" : "rgba(154,154,154,0.15)",
                                  color: app.talent_availability_status === "Available" ? "#34D399" : app.talent_availability_status === "Limited" ? "#FBBF24" : "#9A9A9A",
                                }}>
                                  {app.talent_availability_status}
                                </span>
                              )}
                            </div>
                            <p style={{ fontSize: "11px", color: T.muted }}>{app.talent_category}</p>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "10px 12px" }}>
                        <span style={{ fontSize: "12px", color: T.muted }}>{SUBMISSION_TYPE_LABELS[app.opportunity_submission_type || ""] || "–"}</span>
                      </td>
                      <td style={{ padding: "10px 12px" }}>
                        <span style={{ fontSize: "12px", color: T.muted }}>{new Date(app.submitted_at).toLocaleDateString()}</span>
                      </td>
                      <td style={{ padding: "10px 12px" }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: "flex", gap: "2px" }}>
                          {[1, 2, 3, 4, 5].map(n => (
                            <button key={n} onClick={() => handleRate(app.id, n)}
                              style={{ background: "none", border: "none", cursor: "pointer", padding: "2px", color: (app.star_rating ?? 0) >= n ? "#F59E0B" : T.surfaceHigh, fontSize: "14px" }}>
                              ★
                            </button>
                          ))}
                        </div>
                      </td>
                      <td style={{ padding: "10px 12px" }} onClick={e => e.stopPropagation()}>
                        <span style={{ fontSize: "11px", fontWeight: "500", padding: "3px 10px", borderRadius: "9999px", backgroundColor: rs.color + "20", color: rs.color }}>{rs.label}</span>
                      </td>
                      <td style={{ padding: "10px 12px" }}>
                        <span style={{ fontSize: "11px", fontWeight: "500", padding: "3px 10px", borderRadius: "9999px", backgroundColor: sc.bg, color: sc.color }}>{app.stage}</span>
                      </td>
                      <td style={{ padding: "10px 8px" }}>
                        <button onClick={e => { e.stopPropagation(); openApplicantDetails(app); }} style={{ padding: "4px 10px", borderRadius: "6px", border: `1px solid ${T.border}`, background: "none", fontSize: "12px", cursor: "pointer", color: T.gold }}>
                          Open
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {sortedFilteredApps.length === 0 && (
              <div style={{ textAlign: "center", padding: "60px 24px", color: T.muted }}>
                <p>No applicants match your filters.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Kanban Board */}
      {activeTab === "kanban" && <div style={{ flex: 1, overflowX: "auto", padding: "24px" }}>
        <div style={{ display: "flex", gap: "20px", minWidth: "fit-content", height: "100%" }}>
          {STAGES.map((stage) => {
            const stageApps = apps.filter(a => a.stage === stage.id);
            const stageConfig = getStageConfig(stage.id);

            return (
              <div key={stage.id} style={{
                width: "320px",
                display: "flex",
                flexDirection: "column",
                backgroundColor: T.glass,
                backdropFilter: "blur(10px)",
                borderRadius: "16px",
                border: `1px solid ${T.border}`,
                maxHeight: "100%",
              }}>
                {/* Stage Header */}
                <div style={{
                  padding: "16px",
                  borderBottom: `1px solid ${T.border}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  backgroundColor: T.surfaceLow,
                  borderRadius: "16px 16px 0 0",
                  borderLeft: `3px solid ${stageConfig.color}`,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <h3 style={{ fontSize: "13px", fontWeight: "600", color: stageConfig.color, margin: 0, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      {stage.label}
                    </h3>
                  </div>
                  <span style={{
                    backgroundColor: T.surfaceHigh,
                    padding: "2px 8px",
                    borderRadius: "9999px",
                    fontSize: "11px",
                    fontWeight: "600",
                    color: stageConfig.color,
                  }}>
                    {stageApps.length}
                  </span>
                </div>

                {/* Stage Cards */}
                <div style={{ flex: 1, overflowY: "auto", padding: "12px", display: "flex", flexDirection: "column", gap: "12px" }}>
                  {stageApps.map((app) => (
                    <div
                      key={app.id}
                      onClick={() => openApplicantDetails(app)}
                      style={{
                        backgroundColor: T.surface,
                        border: `1px solid ${T.border}`,
                        borderRadius: "12px",
                        padding: "14px",
                        cursor: "pointer",
                        transition: "all 0.2s",
                        position: "relative",
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.borderColor = T.gold;
                        e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.3)";
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.borderColor = T.border;
                        e.currentTarget.style.boxShadow = "none";
                      }}
                    >
                      {movingId === app.id && (
                        <div style={{ position: "absolute", top: "12px", right: "12px" }}>
                          <Loader2 style={{ width: "14px", height: "14px", color: T.gold, animation: "spin 0.8s linear infinite" }} />
                        </div>
                      )}

                      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                        <div style={{
                          width: "44px",
                          height: "44px",
                          borderRadius: "12px",
                          background: `linear-gradient(135deg, ${T.gold} 0%, #8a6a00 100%)`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}>
                          <span style={{ fontSize: "16px", fontWeight: "600", color: T.onGold }}>
                            {(app.talent_name || 'TA').slice(0, 2).toUpperCase()}
                          </span>
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <Link
                            href={`/profile/${app.talent}`}
                            onClick={e => e.stopPropagation()}
                            style={{ fontWeight: "600", color: T.text, fontSize: "14px", marginBottom: "2px", textDecoration: "none", display: "block" }}
                            onMouseEnter={e => (e.currentTarget.style.color = T.gold)}
                            onMouseLeave={e => (e.currentTarget.style.color = T.text)}
                          >
                            {app.talent_name || `Applicant #${app.talent}`}
                          </Link>
                          <p style={{ fontSize: "11px", color: T.muted }}>{app.talent_category}</p>
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                        {app.video_url && (
                          <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "10px", color: T.mutedDim }}>
                            <Video style={{ width: "10px", height: "10px" }} />
                            Reel
                          </span>
                        )}
                        {app.cover_note && (
                          <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "10px", color: T.mutedDim }}>
                            <Mail style={{ width: "10px", height: "10px" }} />
                            Note
                          </span>
                        )}
                      </div>
                    </div>
                  ))}

                  {stageApps.length === 0 && (
                    <div style={{ textAlign: "center", padding: "32px 16px" }}>
                      <p style={{ fontSize: "12px", color: T.mutedDim }}>No applicants yet</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>}

      {/* Callbacks Tab */}
      {activeTab === "callbacks" && (
        <div style={{ flex: 1, overflowY: "auto", padding: "24px" }}>
          {callbackApps.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 24px", color: T.muted }}>
              <p>No applicants in the Callback stage yet.</p>
            </div>
          ) : (
            callbackApps.map(app => {
              const rounds = callbackRounds[app.id];
              const form = newRoundForms[app.id];
              if (!rounds) loadCallbackRounds(app.id);
              return (
                <div key={app.id} style={{ backgroundColor: T.surface, border: `1px solid ${T.border}`, borderRadius: "14px", padding: "16px 20px", marginBottom: "16px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: `linear-gradient(135deg, ${T.gold} 0%, #8a6a00 100%)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <span style={{ fontSize: "12px", fontWeight: "600", color: T.onGold }}>{(app.talent_name || "TA").slice(0, 2).toUpperCase()}</span>
                      </div>
                      <div>
                        <p style={{ fontSize: "14px", fontWeight: "600", color: T.text, marginBottom: "1px" }}>{app.talent_name || `Applicant #${app.talent}`}</p>
                        <p style={{ fontSize: "12px", color: T.muted }}>{app.talent_category}</p>
                      </div>
                    </div>
                    <button onClick={() => setNewRoundForms(p => ({ ...p, [app.id]: { open: !(p[app.id]?.open), round_number: (rounds?.length || 0) + 1, scheduled_date: "", notes: "" } }))}
                      style={{ padding: "6px 14px", borderRadius: "8px", border: `1px solid ${T.border}`, background: "none", cursor: "pointer", fontSize: "13px", fontWeight: "500", color: T.gold }}>
                      + Add Round
                    </button>
                  </div>
                  {/* Rounds timeline */}
                  {rounds && rounds.length > 0 && (
                    <div style={{ paddingLeft: "12px", borderLeft: `2px solid ${T.border}`, marginBottom: "12px" }}>
                      {rounds.map(r => (
                        <div key={r.id} style={{ marginBottom: "10px" }}>
                          <p style={{ fontSize: "13px", fontWeight: "500", color: T.text, marginBottom: "2px" }}>Round {r.round_number}{r.scheduled_date ? ` · ${new Date(r.scheduled_date).toLocaleDateString()}` : ""}</p>
                          {r.notes && <p style={{ fontSize: "12px", color: T.muted, margin: 0 }}>{r.notes}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                  {/* Add round inline form */}
                  {form?.open && (
                    <div style={{ padding: "12px", borderRadius: "10px", backgroundColor: T.surfaceHigh, display: "flex", flexDirection: "column", gap: "8px" }}>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <input type="number" min={1} value={form.round_number} onChange={e => setNewRoundForms(p => ({ ...p, [app.id]: { ...p[app.id], round_number: Number(e.target.value) } }))} placeholder="Round #" style={{ width: "80px", padding: "8px", borderRadius: "8px", border: `1px solid ${T.border}`, backgroundColor: T.surface, color: T.text, fontSize: "13px", outline: "none" }} />
                        <input type="date" value={form.scheduled_date} onChange={e => setNewRoundForms(p => ({ ...p, [app.id]: { ...p[app.id], scheduled_date: e.target.value } }))} style={{ flex: 1, padding: "8px", borderRadius: "8px", border: `1px solid ${T.border}`, backgroundColor: T.surface, color: T.text, fontSize: "13px", outline: "none" }} />
                      </div>
                      <textarea value={form.notes} onChange={e => setNewRoundForms(p => ({ ...p, [app.id]: { ...p[app.id], notes: e.target.value } }))} placeholder="Notes…" rows={2} style={{ padding: "8px", borderRadius: "8px", border: `1px solid ${T.border}`, backgroundColor: T.surface, color: T.text, fontSize: "13px", resize: "vertical", outline: "none" }} />
                      <button onClick={() => handleCreateCallbackRound(app.id)} style={{ alignSelf: "flex-end", padding: "6px 16px", borderRadius: "8px", backgroundColor: T.gold, color: T.onGold, border: "none", cursor: "pointer", fontSize: "13px", fontWeight: "600" }}>
                        Save Round
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Details Panel - Slide-in */}
      {showDetailsPanel && selectedApp && (
        <>
          <div style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.65)",
            zIndex: 45,
          }} onClick={closeDetailsPanel} />

          <div style={{
            position: "fixed",
            top: 0,
            right: 0,
            width: "500px",
            maxWidth: "90vw",
            height: "100vh",
            backgroundColor: T.surfaceLow,
            boxShadow: "-4px 0 40px rgba(0,0,0,0.6)",
            zIndex: 50,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            animation: "slideIn 0.3s ease-out",
          }}>

            {/* Panel Header */}
            <div style={{
              padding: "20px 24px",
              borderBottom: `1px solid ${T.border}`,
              backgroundColor: T.surface,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "14px",
                  background: `linear-gradient(135deg, ${T.gold} 0%, #8a6a00 100%)`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}>
                  <span style={{ fontSize: "18px", fontWeight: "600", color: T.onGold }}>
                    {(selectedApp.talent_name || 'TA').slice(0, 2).toUpperCase()}
                  </span>
                </div>
                <div>
                  <Link href={`/profile/${selectedApp.talent}`} style={{ textDecoration: "none" }}>
                    <h3 style={{ fontSize: "18px", fontWeight: "600", fontFamily: T.syne, color: T.primary, marginBottom: "2px", cursor: "pointer" }}
                      onMouseEnter={e => (e.currentTarget.style.color = T.gold)}
                      onMouseLeave={e => (e.currentTarget.style.color = T.primary)}>
                      {selectedApp.talent_name || `Applicant #${selectedApp.talent}`}
                    </h3>
                  </Link>
                  <p style={{ fontSize: "12px", color: T.muted }}>{selectedApp.talent_category}</p>
                </div>
              </div>
              <button onClick={closeDetailsPanel} style={{
                width: "32px",
                height: "32px",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: T.muted,
              }}>
                <X style={{ width: "18px", height: "18px" }} />
              </button>
            </div>

            {/* Panel Tabs */}
            <div style={{ display: "flex", gap: "16px", padding: "0 24px", borderBottom: `1px solid ${T.border}`, backgroundColor: T.surfaceLow, flexShrink: 0 }}>
              {(["submission", "review", "notes"] as const).map(t => (
                <button key={t} onClick={() => setPanelTab(t)} style={{
                  padding: "12px 4px", fontSize: "13px", fontWeight: "600",
                  background: "none", border: "none", cursor: "pointer",
                  color: panelTab === t ? T.gold : T.muted,
                  borderBottom: panelTab === t ? `2px solid ${T.gold}` : "2px solid transparent",
                  marginBottom: "-1px", textTransform: "capitalize",
                  transition: "color 0.15s",
                }}>{t}</button>
              ))}
            </div>

            {/* Panel Content */}
            <div style={{ flex: 1, overflowY: "auto", padding: "24px" }}>
              {panelTab === "submission" && (
                <>
                  {/* Cover Note */}
                  {selectedApp.cover_note && (
                    <div style={{ marginBottom: "20px" }}>
                      <h4 style={{ fontSize: "11px", fontWeight: "600", color: T.mutedDim, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>Cover Note</h4>
                      <div style={{ backgroundColor: "rgba(255,255,255,0.04)", borderRadius: "12px", padding: "14px", borderLeft: `2px solid ${T.gold}` }}>
                        <p style={{ fontSize: "13px", color: T.muted, margin: 0, lineHeight: "1.5" }}>"{selectedApp.cover_note}"</p>
                      </div>
                    </div>
                  )}

                  {/* Hiring Questions */}
                  {(() => {
                    const answers = selectedApp.questionnaire_answers || {};
                    const questions = gig?.questionnaire && gig.questionnaire.length > 0
                      ? gig.questionnaire.map(q => q.question)
                      : Object.keys(answers);
                    if (questions.length === 0) return null;
                    return (
                      <div style={{ marginBottom: "20px" }}>
                        <h4 style={{ fontSize: "11px", fontWeight: "600", color: T.mutedDim, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>Hiring Questions</h4>
                        {questions.map((question, idx) => (
                          <div key={idx} style={{ marginBottom: "10px" }}>
                            <p style={{ fontSize: "12px", fontWeight: "600", color: T.text, marginBottom: "3px" }}>{question}</p>
                            <p style={{ fontSize: "13px", color: T.muted, margin: 0, lineHeight: "1.5" }}>
                              {answers[question]?.trim()
                                ? answers[question]
                                : <span style={{ color: T.mutedDim, fontStyle: "italic" }}>No answer</span>}
                            </p>
                          </div>
                        ))}
                      </div>
                    );
                  })()}

                  {/* Portfolio Submissions */}
                  {selectedApp.portfolio_submissions && Object.keys(selectedApp.portfolio_submissions).length > 0 && (
                    <div style={{ marginBottom: "20px" }}>
                      <h4 style={{ fontSize: "11px", fontWeight: "600", color: T.mutedDim, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>Portfolio Submissions</h4>
                      {Object.entries(selectedApp.portfolio_submissions).map(([label, url]) => (
                        <div key={label} style={{ marginBottom: "8px" }}>
                          <p style={{ fontSize: "12px", fontWeight: "600", color: T.text, marginBottom: "2px" }}>{label}</p>
                          <a href={url} target="_blank" rel="noopener noreferrer" style={{ fontSize: "12px", color: T.gold, wordBreak: "break-all" }}>{url}</a>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Video Reel */}
                  {selectedApp.video_url && (
                    <div style={{ marginBottom: "20px" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                        <h4 style={{ fontSize: "11px", fontWeight: "600", color: "var(--as-text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Demo Reel</h4>
                        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                          <select value={videoSpeed[selectedApp.id] ?? 1} onChange={e => setVideoSpeed(p => ({ ...p, [selectedApp.id]: Number(e.target.value) }))} style={{ padding: "3px 8px", borderRadius: "6px", border: "1px solid var(--as-border)", fontSize: "12px", cursor: "pointer" }}>
                            {[0.75, 1, 1.25, 1.5, 2].map(s => <option key={s} value={s}>{s}×</option>)}
                          </select>
                          <button onClick={() => setFullScreenUrl(selectedApp.video_url)} title="Fullscreen" style={{ background: "none", border: "1px solid var(--as-border)", borderRadius: "6px", cursor: "pointer", padding: "3px 6px" }}>
                            <Maximize2 style={{ width: "12px", height: "12px", color: "var(--as-text-muted)" }} />
                          </button>
                        </div>
                      </div>
                      <div style={{ position: "relative", backgroundColor: "#000", borderRadius: "12px", overflow: "hidden", aspectRatio: "16/9" }}>
                        <video src={selectedApp.video_url} controls style={{ width: "100%", height: "100%", display: "block" }} ref={el => { if (el) el.playbackRate = videoSpeed[selectedApp.id] ?? 1; }} />
                        {/* Watermark badge */}
                        <div style={{ position: "absolute", top: "8px", right: "8px", backgroundColor: "rgba(0,0,0,0.6)", color: "white", fontSize: "10px", padding: "3px 8px", borderRadius: "9999px", backdropFilter: "blur(4px)", pointerEvents: "none" }}>
                          Reviewing · {new Date().toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Audio player */}
                  {selectedApp.audio_url && (
                    <div style={{ marginBottom: "20px" }}>
                      <h4 style={{ fontSize: "11px", fontWeight: "600", color: T.mutedDim, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
                        <Mic style={{ width: "12px", height: "12px" }} /> Audio
                      </h4>
                      <div style={{ backgroundColor: T.surface, borderRadius: "10px", padding: "10px" }}>
                        <audio controls src={selectedApp.audio_url} style={{ width: "100%" }} />
                      </div>
                    </div>
                  )}

                  {/* PDF links */}
                  {selectedApp.pdf_urls && selectedApp.pdf_urls.length > 0 && (
                    <div style={{ marginBottom: "20px" }}>
                      <h4 style={{ fontSize: "11px", fontWeight: "600", color: T.mutedDim, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
                        <FileText style={{ width: "12px", height: "12px" }} /> Documents
                      </h4>
                      {selectedApp.pdf_urls.map((url, i) => (
                        <a key={i} href={url} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 12px", borderRadius: "8px", backgroundColor: T.surfaceHigh, marginBottom: "6px", textDecoration: "none", color: T.gold, fontSize: "12px" }}>
                          <FileText style={{ width: "14px", height: "14px" }} />
                          {url.split("/").pop()}
                        </a>
                      ))}
                    </div>
                  )}

                  {/* Portfolio Link */}
                  <Link href={`/portfolio/${selectedApp.talent}`} style={{ textDecoration: "none" }}>
                    <button style={{
                      width: "100%",
                      padding: "12px",
                      borderRadius: "10px",
                      backgroundColor: "transparent",
                      border: `1px solid ${T.border}`,
                      color: T.gold,
                      fontSize: "13px",
                      fontWeight: "500",
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}>
                      View Portfolio
                    </button>
                  </Link>
                </>
              )}

              {panelTab === "review" && (
                <>
                  {/* Stage + Type badges */}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "20px" }}>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "5px 12px", borderRadius: "9999px", backgroundColor: getStageConfig(selectedApp.stage).bg }}>
                      <div style={{ width: "7px", height: "7px", borderRadius: "50%", backgroundColor: getStageConfig(selectedApp.stage).color }} />
                      <span style={{ fontSize: "11px", fontWeight: "500", color: getStageConfig(selectedApp.stage).color }}>{selectedApp.stage}</span>
                    </div>
                    {selectedApp.opportunity_submission_type && (
                      <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "5px 12px", borderRadius: "9999px", backgroundColor: T.surfaceHigh }}>
                        <span style={{ fontSize: "11px", color: T.muted }}>{SUBMISSION_TYPE_LABELS[selectedApp.opportunity_submission_type] || selectedApp.opportunity_submission_type}</span>
                      </div>
                    )}
                  </div>

                  {/* Star rating */}
                  <div style={{ marginBottom: "20px" }}>
                    <h4 style={{ fontSize: "11px", fontWeight: "600", color: T.mutedDim, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>Rating</h4>
                    <div style={{ display: "flex", gap: "4px" }}>
                      {[1, 2, 3, 4, 5].map(n => (
                        <button key={n} onClick={() => handleRate(selectedApp.id, n)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "22px", padding: "2px", color: (selectedApp.star_rating ?? 0) >= n ? "#F59E0B" : T.surfaceHigh }}>★</button>
                      ))}
                      {selectedApp.star_rating && (
                        <button onClick={() => handleRate(selectedApp.id, null)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "12px", color: T.muted, padding: "0 6px", alignSelf: "center" }}>Clear</button>
                      )}
                    </div>
                  </div>

                  {/* Review state */}
                  <div style={{ marginBottom: "20px" }}>
                    <h4 style={{ fontSize: "11px", fontWeight: "600", color: T.mutedDim, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>Review State</h4>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                      {REVIEW_STATES.map(rs => {
                        const active = (selectedApp.review_state || "pending") === rs.id;
                        return (
                          <button key={rs.id} onClick={() => handleReviewState(selectedApp.id, rs.id)} style={{ padding: "5px 12px", borderRadius: "9999px", fontSize: "12px", fontWeight: "500", border: `1px solid ${active ? rs.color : T.border}`, backgroundColor: active ? rs.color + "20" : "transparent", color: active ? rs.color : T.muted, cursor: "pointer" }}>
                            {rs.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Tags */}
                  <div style={{ marginBottom: "20px" }}>
                    <h4 style={{ fontSize: "11px", fontWeight: "600", color: T.mutedDim, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
                      <Tag style={{ width: "12px", height: "12px" }} /> Tags
                    </h4>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "8px" }}>
                      {(selectedApp.tags || []).map(tag => (
                        <span key={tag} style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "3px 10px", borderRadius: "9999px", backgroundColor: T.surfaceHigh, fontSize: "12px", color: T.text }}>
                          {tag}
                          <button onClick={() => handleRemoveTag(selectedApp.id, tag)} style={{ background: "none", border: "none", cursor: "pointer", color: T.mutedDim, padding: "0", lineHeight: 1 }}>×</button>
                        </span>
                      ))}
                    </div>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <input value={tagInput[selectedApp.id] || ""} onChange={e => setTagInput(p => ({ ...p, [selectedApp.id]: e.target.value }))}
                        onKeyDown={e => e.key === "Enter" && handleAddTag(selectedApp.id)}
                        placeholder="Add tag…" style={{ flex: 1, padding: "7px 11px", borderRadius: "8px", border: `1px solid ${T.border}`, backgroundColor: T.surface, color: T.text, fontSize: "12px", outline: "none" }} />
                      <button onClick={() => handleAddTag(selectedApp.id)} style={{ padding: "7px 14px", borderRadius: "8px", backgroundColor: T.gold, color: T.onGold, border: "none", cursor: "pointer", fontSize: "12px", fontWeight: "600" }}>Add</button>
                    </div>
                  </div>

                  {/* Audition slot */}
                  {selectedApp.audition_slot && (
                    <div style={{ marginBottom: "20px" }}>
                      <h4 style={{ fontSize: "11px", fontWeight: "600", color: T.mutedDim, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>Audition Slot</h4>
                      <div style={{ padding: "10px 14px", borderRadius: "10px", backgroundColor: "rgba(96,165,250,0.08)", border: "1px solid rgba(96,165,250,0.2)" }}>
                        <p style={{ fontSize: "13px", fontWeight: "500", color: "#93C5FD", marginBottom: "2px" }}>
                          {new Date(selectedApp.audition_slot.start_time).toLocaleString()} – {new Date(selectedApp.audition_slot.end_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                        {selectedApp.audition_slot.location_or_link && <p style={{ fontSize: "12px", color: "#93C5FD", margin: 0, opacity: 0.8 }}>{selectedApp.audition_slot.location_or_link}</p>}
                      </div>
                    </div>
                  )}

                  {/* Move Stage Section */}
                  <div style={{ marginBottom: "24px" }}>
                    <h4 style={{ fontSize: "12px", fontWeight: "600", color: T.mutedDim, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "12px" }}>
                      Move to Stage
                    </h4>
                    {stageError && (
                      <div style={{ marginBottom: "10px", padding: "8px 12px", borderRadius: "8px", backgroundColor: "rgba(248,113,113,0.1)", color: "#F87171", fontSize: "12px" }}>
                        {stageError}
                      </div>
                    )}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "8px" }}>
                      {STAGES.map((stage) => (
                        <button
                          key={stage.id}
                          onClick={() => {
                            if (selectedApp.stage === stage.id) return;
                            setConfirmMove({ appId: selectedApp.id, stageName: stage.id, stageLabel: stage.label, appName: selectedApp.talent_name || `Applicant #${selectedApp.talent}` });
                          }}
                          disabled={movingId === selectedApp.id}
                          style={{
                            padding: "8px 12px",
                            borderRadius: "10px",
                            fontSize: "12px",
                            fontWeight: "500",
                            backgroundColor: selectedApp.stage === stage.id ? stage.color : T.surface,
                            color: selectedApp.stage === stage.id ? (T.bg) : T.muted,
                            border: `1px solid ${selectedApp.stage === stage.id ? stage.color : T.border}`,
                            cursor: selectedApp.stage === stage.id || movingId === selectedApp.id ? "default" : "pointer",
                            transition: "all 0.2s",
                            opacity: movingId === selectedApp.id ? 0.6 : 1,
                          }}
                        >
                          {selectedApp.stage === stage.id && <CheckCircle2 style={{ width: "12px", height: "12px", display: "inline", marginRight: "6px" }} />}
                          {stage.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Make Offer Section — only visible when Approved */}
                  {selectedApp.stage === 'Approved' && <div style={{ marginBottom: "24px" }}>
                    <h4 style={{ fontSize: "12px", fontWeight: "600", color: T.mutedDim, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
                      <DollarSign style={{ width: "14px", height: "14px" }} />
                      Make Offer
                    </h4>

                    {offerForms[selectedApp.id]?.success && (
                      <div style={{ marginBottom: "12px", padding: "10px", borderRadius: "8px", backgroundColor: "rgba(52,211,153,0.1)", color: "#34D399", fontSize: "12px" }}>
                        Offer sent successfully!
                      </div>
                    )}

                    {offerForms[selectedApp.id]?.error && (
                      <div style={{ marginBottom: "12px", padding: "10px", borderRadius: "8px", backgroundColor: "rgba(248,113,113,0.1)", color: "#F87171", fontSize: "12px" }}>
                        {offerForms[selectedApp.id].error}
                      </div>
                    )}

                    <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
                      <input
                        type="text"
                        placeholder="Amount"
                        value={offerForms[selectedApp.id]?.amount ?? ''}
                        onChange={e => setOfferForms(prev => ({ ...prev, [selectedApp.id]: { ...prev[selectedApp.id], amount: e.target.value, success: false, error: '' } }))}
                        style={{
                          flex: 1,
                          padding: "10px 12px",
                          borderRadius: "10px",
                          border: `1px solid ${T.border}`,
                          backgroundColor: T.surface,
                          color: T.text,
                          fontSize: "13px",
                          outline: "none",
                        }}
                        onFocus={e => e.currentTarget.style.borderColor = T.gold}
                        onBlur={e => e.currentTarget.style.borderColor = T.border}
                      />
                      <select
                        value={offerForms[selectedApp.id]?.currency ?? 'USD'}
                        onChange={e => setOfferForms(prev => ({ ...prev, [selectedApp.id]: { ...prev[selectedApp.id], currency: e.target.value } }))}
                        style={{
                          width: "80px",
                          padding: "10px 8px",
                          borderRadius: "10px",
                          border: `1px solid ${T.border}`,
                          backgroundColor: T.surface,
                          color: T.text,
                          fontSize: "13px",
                          outline: "none",
                        }}
                      >
                        <option>USD</option>
                        <option>EUR</option>
                        <option>GBP</option>
                      </select>
                    </div>

                    <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
                      <input
                        type="date"
                        value={offerForms[selectedApp.id]?.start_date ?? ''}
                        onChange={e => setOfferForms(prev => ({ ...prev, [selectedApp.id]: { ...prev[selectedApp.id], start_date: e.target.value } }))}
                        onFocus={() => loadTalentAvailability(selectedApp.talent)}
                        style={{ flex: 1, padding: "10px 12px", borderRadius: "10px", border: `1px solid ${T.border}`, backgroundColor: T.surface, color: T.text, fontSize: "13px", outline: "none" }}
                      />
                      <input
                        type="date"
                        value={offerForms[selectedApp.id]?.end_date ?? ''}
                        onChange={e => setOfferForms(prev => ({ ...prev, [selectedApp.id]: { ...prev[selectedApp.id], end_date: e.target.value } }))}
                        onFocus={() => loadTalentAvailability(selectedApp.talent)}
                        style={{ flex: 1, padding: "10px 12px", borderRadius: "10px", border: `1px solid ${T.border}`, backgroundColor: T.surface, color: T.text, fontSize: "13px", outline: "none" }}
                      />
                    </div>
                    {(() => {
                      const conflict = getAvailConflict(selectedApp.talent, offerForms[selectedApp.id]?.start_date ?? "", offerForms[selectedApp.id]?.end_date ?? "");
                      if (!conflict.message) return null;
                      const styles = {
                        ok:       { bg: "rgba(52,211,153,0.08)",  color: "#34D399", border: "rgba(52,211,153,0.25)"  },
                        warn:     { bg: "rgba(251,191,36,0.08)",  color: "#FBBF24", border: "rgba(251,191,36,0.25)"  },
                        conflict: { bg: "rgba(248,113,113,0.08)", color: "#F87171", border: "rgba(248,113,113,0.25)" },
                      };
                      const s = styles[conflict.level];
                      return (
                        <div style={{ marginBottom: "12px", padding: "8px 12px", borderRadius: "8px", backgroundColor: s.bg, border: `1px solid ${s.border}`, fontSize: "12px", color: s.color }}>
                          {conflict.level === "ok" ? "✓" : conflict.level === "warn" ? "⚠" : "✕"} {conflict.message}
                        </div>
                      );
                    })()}

                    <textarea
                      rows={2}
                      placeholder="Message (optional)"
                      value={offerForms[selectedApp.id]?.message ?? ''}
                      onChange={e => setOfferForms(prev => ({ ...prev, [selectedApp.id]: { ...prev[selectedApp.id], message: e.target.value } }))}
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        borderRadius: "10px",
                        border: `1px solid ${T.border}`,
                        backgroundColor: T.surface,
                        color: T.text,
                        fontSize: "13px",
                        resize: "vertical",
                        outline: "none",
                        marginBottom: "12px",
                      }}
                    />

                    <button
                      onClick={async () => {
                        const form = offerForms[selectedApp.id];
                        if (!form || !form.amount) return;
                        setOfferForms(prev => ({ ...prev, [selectedApp.id]: { ...prev[selectedApp.id], submitting: true, error: '', success: false } }));
                        try {
                          await apiClient.post('/bookings/', {
                            to_talent: selectedApp.talent,
                            opportunity: id,
                            amount: form.amount,
                            currency: form.currency,
                            message: form.message,
                            start_date: form.start_date || null,
                            end_date: form.end_date || null,
                          });
                          setOfferForms(prev => ({ ...prev, [selectedApp.id]: { ...prev[selectedApp.id], submitting: false, success: true, amount: '', message: '', start_date: '', end_date: '' } }));
                        } catch (err) {
                          const msg = err instanceof Error ? err.message : 'Failed to send offer.';
                          setOfferForms(prev => ({ ...prev, [selectedApp.id]: { ...prev[selectedApp.id], submitting: false, error: msg } }));
                        }
                      }}
                      disabled={offerForms[selectedApp.id]?.submitting || !offerForms[selectedApp.id]?.amount}
                      style={{
                        width: "100%",
                        padding: "10px",
                        borderRadius: "10px",
                        backgroundColor: T.gold,
                        color: T.onGold,
                        border: "none",
                        fontWeight: "600",
                        cursor: offerForms[selectedApp.id]?.submitting || !offerForms[selectedApp.id]?.amount ? "not-allowed" : "pointer",
                        opacity: offerForms[selectedApp.id]?.submitting || !offerForms[selectedApp.id]?.amount ? 0.6 : 1,
                      }}
                    >
                      {offerForms[selectedApp.id]?.submitting ? <Loader2 style={{ width: "14px", height: "14px", animation: "spin 0.8s linear infinite", display: "inline", marginRight: "6px" }} /> : <Send style={{ width: "14px", height: "14px", display: "inline", marginRight: "6px" }} />}
                      Send Offer
                    </button>
                  </div>}
                </>
              )}

              {panelTab === "notes" && (
                <>
                  {/* Private Notes */}
                  <div style={{ marginBottom: "24px" }}>
                    <h4 style={{ fontSize: "12px", fontWeight: "600", color: T.mutedDim, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
                      <StickyNote style={{ width: "14px", height: "14px" }} />
                      Private Notes
                    </h4>
                    <textarea
                      value={noteValues[selectedApp.id] ?? ""}
                      onChange={e => setNoteValues(prev => ({ ...prev, [selectedApp.id]: e.target.value }))}
                      rows={4}
                      placeholder="Add private notes about this applicant..."
                      style={{
                        width: "100%",
                        padding: "12px",
                        borderRadius: "12px",
                        border: `1px solid ${T.border}`,
                        backgroundColor: T.surface,
                        color: T.text,
                        fontSize: "13px",
                        resize: "vertical",
                        outline: "none",
                      }}
                      onFocus={e => e.currentTarget.style.borderColor = T.gold}
                      onBlur={e => e.currentTarget.style.borderColor = T.border}
                    />
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "8px" }}>
                      <button
                        onClick={() => handleSaveNote(selectedApp.id)}
                        disabled={savingNote === selectedApp.id}
                        style={{
                          padding: "6px 16px",
                          borderRadius: "8px",
                          fontSize: "12px",
                          fontWeight: "600",
                          backgroundColor: T.gold,
                          color: T.onGold,
                          border: "none",
                          cursor: savingNote === selectedApp.id ? "not-allowed" : "pointer",
                        }}
                      >
                        {savingNote === selectedApp.id ? <Loader2 style={{ width: "12px", height: "12px", animation: "spin 0.8s linear infinite", display: "inline", marginRight: "6px" }} /> : null}
                        Save Note
                      </button>
                      {noteSaved === selectedApp.id && (
                        <span style={{ fontSize: "11px", color: "#34D399" }}>Saved</span>
                      )}
                      {noteError === selectedApp.id && (
                        <span style={{ fontSize: "11px", color: "#F87171" }}>Failed to save</span>
                      )}
                    </div>
                  </div>

                  {/* Shared Notes */}
                  <div style={{ marginBottom: "24px" }}>
                    <h4 style={{ fontSize: "12px", fontWeight: "600", color: T.mutedDim, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
                      <Users style={{ width: "14px", height: "14px" }} />
                      Shared Notes
                      <span style={{ fontSize: "10px", fontWeight: "400", color: T.muted, textTransform: "none", letterSpacing: 0 }}>(visible to all reviewers)</span>
                    </h4>
                    <textarea
                      value={sharedNoteValues[selectedApp.id] ?? ""}
                      onChange={e => setSharedNoteValues(prev => ({ ...prev, [selectedApp.id]: e.target.value }))}
                      rows={3}
                      placeholder="Add shared notes visible to all reviewers..."
                      style={{ width: "100%", padding: "12px", borderRadius: "12px", border: `1px solid ${T.border}`, backgroundColor: T.surface, color: T.text, fontSize: "13px", resize: "vertical", outline: "none" }}
                      onFocus={e => e.currentTarget.style.borderColor = T.gold}
                      onBlur={e => e.currentTarget.style.borderColor = T.border}
                    />
                    <button
                      onClick={() => handleSaveSharedNote(selectedApp.id)}
                      disabled={savingSharedNote === selectedApp.id}
                      style={{ marginTop: "8px", padding: "6px 16px", borderRadius: "8px", fontSize: "12px", fontWeight: "600", backgroundColor: T.gold, color: T.onGold, border: "none", cursor: savingSharedNote === selectedApp.id ? "not-allowed" : "pointer" }}
                    >
                      {savingSharedNote === selectedApp.id ? "Saving..." : "Save"}
                    </button>
                  </div>

                  {/* Activity accordion */}
                  <div style={{ marginTop: "20px", borderTop: `1px solid ${T.border}`, paddingTop: "20px" }}>
                    <button
                      onClick={() => loadAuditLog(selectedApp.id)}
                      style={{ display: "flex", alignItems: "center", gap: "6px", background: "none", border: "none", cursor: "pointer", color: T.muted, fontSize: "12px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px", padding: "0" }}
                    >
                      <Activity style={{ width: "13px", height: "13px" }} />
                      Activity Log
                      <ChevronDown style={{ width: "12px", height: "12px", transform: activityExpanded[selectedApp.id] ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
                    </button>
                    {activityExpanded[selectedApp.id] && (
                      <div style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "10px" }}>
                        {(activityLogs[selectedApp.id] || []).length === 0 ? (
                          <p style={{ fontSize: "12px", color: T.muted }}>No activity yet.</p>
                        ) : (activityLogs[selectedApp.id] || []).map(entry => (
                          <div key={entry.id} style={{ display: "flex", gap: "10px", fontSize: "12px" }}>
                            <div style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: T.gold, marginTop: "5px", flexShrink: 0 }} />
                            <div>
                              <span style={{ color: T.text, fontWeight: "500" }}>{entry.action.replace(/_/g, " ")}</span>
                              {entry.old_value && entry.new_value && (
                                <span style={{ color: T.muted }}> · {entry.old_value} → {entry.new_value}</span>
                              )}
                              {entry.note && <p style={{ color: T.muted, margin: "2px 0 0" }}>{entry.note}</p>}
                              <p style={{ color: T.mutedDim, fontSize: "11px", margin: "2px 0 0" }}>{new Date(entry.timestamp).toLocaleString()}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}

      {/* Confirmation Modal */}
      {confirmMove && (
        <>
          <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 60 }} onClick={() => setConfirmMove(null)} />
          <div style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "360px",
            maxWidth: "90vw",
            backgroundColor: T.surfaceLow,
            border: `1px solid ${T.border}`,
            borderRadius: "18px",
            padding: "28px 28px 24px",
            zIndex: 70,
            boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
          }}>
            <h3 style={{ fontSize: "18px", fontWeight: "700", fontFamily: T.syne, color: T.primary, marginBottom: "10px" }}>
              Move to {confirmMove.stageLabel}?
            </h3>
            <p style={{ fontSize: "14px", color: T.muted, lineHeight: "1.5", marginBottom: "24px" }}>
              <strong style={{ color: T.text }}>{confirmMove.appName}</strong> will be moved to <strong style={{ color: T.text }}>{confirmMove.stageLabel}</strong>. You can move them again at any time.
            </p>
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button
                onClick={() => setConfirmMove(null)}
                style={{
                  padding: "9px 20px", borderRadius: "9999px",
                  border: `1.5px solid ${T.border}`, backgroundColor: "transparent",
                  fontSize: "13px", fontWeight: "600", cursor: "pointer", color: T.text,
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleMoveStage(confirmMove.appId, confirmMove.stageName);
                  setConfirmMove(null);
                }}
                style={{
                  padding: "9px 20px", borderRadius: "9999px",
                  backgroundColor: T.gold, color: T.onGold,
                  border: "none", fontSize: "13px", fontWeight: "600", cursor: "pointer",
                }}
              >
                Confirm
              </button>
            </div>
          </div>
        </>
      )}

      {/* Bulk reject confirmation modal */}
      {showBulkConfirm && (
        <>
          <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 60 }} onClick={() => setShowBulkConfirm(false)} />
          <div style={{
            position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
            width: "360px", maxWidth: "90vw", backgroundColor: T.surfaceLow,
            border: `1px solid ${T.border}`,
            borderRadius: "18px", padding: "28px 28px 24px", zIndex: 70,
            boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
          }}>
            <h3 style={{ fontSize: "18px", fontWeight: "700", fontFamily: T.syne, color: T.primary, marginBottom: "10px" }}>
              Reject {selectedAppIds.size} Applicant{selectedAppIds.size !== 1 ? "s" : ""}?
            </h3>
            <p style={{ fontSize: "14px", color: T.muted, lineHeight: "1.5", marginBottom: "24px" }}>
              All selected applicants will be moved to <strong style={{ color: T.text }}>Rejected</strong>. You can move them back manually at any time.
            </p>
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button onClick={() => setShowBulkConfirm(false)} style={{ padding: "9px 20px", borderRadius: "9999px", border: `1.5px solid ${T.border}`, backgroundColor: "transparent", fontSize: "13px", fontWeight: "600", cursor: "pointer", color: T.text }}>
                Cancel
              </button>
              <button onClick={handleBulkReject} disabled={bulkRejecting} style={{ padding: "9px 20px", borderRadius: "9999px", backgroundColor: T.red, color: "white", border: "none", fontSize: "13px", fontWeight: "600", cursor: bulkRejecting ? "not-allowed" : "pointer", opacity: bulkRejecting ? 0.7 : 1 }}>
                {bulkRejecting ? "Rejecting…" : "Confirm Reject"}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Full-screen video lightbox */}
      {fullScreenUrl && (
        <>
          <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.92)", zIndex: 100 }} onClick={() => setFullScreenUrl(null)} />
          <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: "90vw", maxWidth: "1100px", zIndex: 101 }}>
            <button onClick={() => setFullScreenUrl(null)} style={{ position: "absolute", top: "-44px", right: "0", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", color: "white", fontSize: "13px" }}>
              <X style={{ width: "18px", height: "18px" }} /> Close
            </button>
            <video src={fullScreenUrl} controls autoPlay style={{ width: "100%", borderRadius: "12px", maxHeight: "80vh", display: "block" }} />
          </div>
        </>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(0.98); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}