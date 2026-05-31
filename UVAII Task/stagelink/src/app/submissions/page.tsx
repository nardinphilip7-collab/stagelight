"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api";
import { getUser } from "@/lib/auth";
import {
  Briefcase, Clock, CheckCircle2, Send, Eye, Star, Calendar,
  ArrowRight, FileText, UserCheck, TrendingUp, Award,
  AlertCircle, ChevronRight, Filter, Download, Video, Mic, X
} from "lucide-react";
import Link from "next/link";

interface Application {
  id: string;
  stage: string;
  cover_note: string;
  video_url: string | null;
  audio_url?: string | null;
  review_state?: string;
  opportunity_submission_type?: string;
  audition_slot?: { start_time: string; end_time: string; location_or_link: string } | null;
  submitted_at: string;
  opportunity: string;
}

interface Opportunity {
  id: string;
  title: string;
  company: string;
  location: string;
  company_logo?: string;
}

const T = {
  bg:          "#131314",
  surface:     "#201f20",
  surfaceLow:  "#1c1b1c",
  surfaceHigh: "#2a2a2b",
  gold:        "#ffe16d",
  onGold:      "#3a3000",
  border:      "rgba(77,71,50,0.2)",
  primary:     "#fff6df",
  text:        "#e5e2e3",
  muted:       "#d0c6ab",
  mutedDim:    "#999077",
};

const STAGE_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any; description: string }> = {
  New: {
    label: "Under Review",
    color: "#9A9A9A",
    bg: "rgba(154,154,154,0.12)",
    icon: Send,
    description: "Your application has been received and is awaiting initial screening."
  },
  Shortlisted: {
    label: "Shortlisted",
    color: "#60A5FA",
    bg: "rgba(96,165,250,0.12)",
    icon: Eye,
    description: "You have been shortlisted for the next round of consideration."
  },
  Callback: {
    label: "Callback",
    color: "#FB923C",
    bg: "rgba(251,146,60,0.12)",
    icon: Star,
    description: "The hiring team has requested an interview or audition."
  },
  Approved: {
    label: "Approved",
    color: "#34D399",
    bg: "rgba(52,211,153,0.12)",
    icon: UserCheck,
    description: "Congratulations! You have been approved — expect a formal offer soon."
  },
  Hired: {
    label: "Hired",
    color: "#10B981",
    bg: "rgba(16,185,129,0.12)",
    icon: CheckCircle2,
    description: "You have been officially hired. Welcome aboard!"
  },
};

const SUBMISSION_TYPE_LABELS: Record<string, string> = {
  SELF_TAPE: "Self-tape", AUDIO: "Audio", LIVE_AUDITION: "Live Audition",
  WRITTEN: "Written", PROFILE_ONLY: "Profile",
};

const REVIEW_STATE_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: "Pending", color: "#9A9A9A" },
  shortlisted: { label: "Shortlisted", color: "#3B82F6" },
  starred: { label: "Starred", color: "#F59E0B" },
  flagged: { label: "Flagged", color: "#DC2626" },
  passed: { label: "Passed", color: "#6B7280" },
};

export default function SubmissionsPage() {
  const router = useRouter();
  const [applications, setApplications] = useState<Application[]>([]);
  const [opps, setOpps] = useState<Record<string, Opportunity>>({});
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  const [viewingUrl, setViewingUrl] = useState<string | null>(null);
  const [viewingType, setViewingType] = useState<"video" | "audio">("video");

  useEffect(() => {
    const user = getUser();
    if (!user) { router.replace("/login"); return; }
    if (user.role === "HIRER" || user.role === "AGENCY") { router.replace("/manage-gigs"); return; }

    apiClient.get<Application[]>("/applications/?applied_by_me=true")
      .then(async apps => {
        setApplications(apps);
        const uniqueIds = [...new Set(apps.map(a => a.opportunity))];
        const results = await Promise.allSettled(
          uniqueIds.map(id => apiClient.get<Opportunity>(`/opportunities/${id}/`))
        );
        const map: Record<string, Opportunity> = {};
        results.forEach((r, i) => {
          if (r.status === "fulfilled") map[uniqueIds[i]] = r.value;
        });
        setOpps(map);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
  }

  const getStatusCounts = () => {
    const counts: Record<string, number> = { New: 0, Shortlisted: 0, Callback: 0, Approved: 0, Hired: 0 };
    applications.forEach(app => {
      if (counts[app.stage] !== undefined) counts[app.stage]++;
      else counts[app.stage] = 1;
    });
    return counts;
  };

  const statusCounts = getStatusCounts();

  const filteredApplications = applications.filter(app => {
    if (selectedFilter === "all") return true;
    return app.stage.toLowerCase() === selectedFilter.toLowerCase();
  });

  const getSuccessRate = () => {
    const total = applications.length;
    const approved = applications.filter(a => a.stage === "Approved" || a.stage === "Hired").length;
    const shortlisted = applications.filter(a => a.stage === "Shortlisted" || a.stage === "Callback").length;
    return total > 0 ? Math.round((approved + shortlisted) / total * 100) : 0;
  };

  const successRate = getSuccessRate();

  return (
    <div className="bg-[var(--as-bg)] text-[var(--as-text)] min-h-screen selection:bg-[#ffd700] selection:text-[#3a3000]">
      <main className="pt-10 pb-12 max-w-[1000px] mx-auto px-6 lg:px-8">

        {/* Header Section */}
        <div className="mb-10">
          <div className="flex items-center justify-between flex-wrap gap-6 mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[rgba(255,215,0,0.1)] flex items-center justify-center border border-[rgba(255,215,0,0.2)]">
                <FileText className="w-6 h-6 text-[#ffd700]" />
              </div>
              <div>
                <h1 className="font-syne text-[36px] font-bold text-[var(--as-text)] tracking-tight m-0">
                  Application Tracker
                </h1>
                <p className="font-outfit text-[16px] text-[#d0c6ab] mt-1">
                  Monitor and manage all your job applications in one place
                </p>
              </div>
            </div>

            {/* Success Rate Card */}
            <div className="bg-[#201f20] border border-white/5 rounded-2xl p-4 flex items-center gap-4 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                <TrendingUp className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <p className="font-outfit text-[12px] text-[var(--as-text-muted)] uppercase tracking-wider font-semibold mb-0.5">Success Rate</p>
                <p className="font-syne text-[28px] font-bold text-emerald-400 m-0 leading-none">{successRate}%</p>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-px bg-white/5 rounded-2xl overflow-hidden mt-8 border border-white/5">
            {Object.entries(STAGE_CONFIG).map(([stage, config]) => {
              const count = statusCounts[stage] || 0;
              const Icon = config.icon;
              return (
                <div key={stage} className="bg-[#201f20] p-5 text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Icon className="w-4 h-4" style={{ color: config.color }} />
                    <p className="font-outfit text-[11px] font-bold uppercase tracking-wider m-0" style={{ color: config.color }}>
                      {config.label}
                    </p>
                  </div>
                  <p className="font-syne text-[32px] font-bold text-[var(--as-text)] m-0">{count}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Filter Bar */}
        {!loading && applications.length > 0 && (
          <div className="flex items-center justify-between flex-wrap gap-4 mb-6 pb-4 border-b border-white/5">
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setSelectedFilter("all")}
                className={`px-4 py-1.5 rounded-full font-outfit text-[13px] font-medium transition-all ${
                  selectedFilter === "all" 
                    ? "bg-[#ffd700] text-[#3a3000] border-transparent" 
                    : "bg-transparent text-[#d0c6ab] border border-white/10 hover:border-white/20"
                }`}
              >
                All Applications
              </button>
              {Object.entries(STAGE_CONFIG).map(([stage, config]) => (
                <button
                  key={stage}
                  onClick={() => setSelectedFilter(stage.toLowerCase())}
                  className={`px-4 py-1.5 rounded-full font-outfit text-[13px] font-medium transition-all border`}
                  style={{
                    backgroundColor: selectedFilter === stage.toLowerCase() ? config.bg : "transparent",
                    color: selectedFilter === stage.toLowerCase() ? config.color : "#d0c6ab",
                    borderColor: selectedFilter === stage.toLowerCase() ? `${config.color}50` : "rgba(255,255,255,0.1)",
                  }}
                >
                  {config.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-[var(--as-text-muted)]" />
              <span className="font-outfit text-[12px] text-[var(--as-text-muted)]">
                {filteredApplications.length} of {applications.length} shown
              </span>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-20">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#ffd700] to-[#C8A882] mx-auto mb-4 animate-pulse" />
            <p className="font-outfit text-[#d0c6ab] text-[14px]">Loading your applications...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && applications.length === 0 && (
          <div className="bg-[#201f20] border border-white/5 rounded-2xl text-center py-20 px-8">
            <div className="w-24 h-24 rounded-3xl bg-[#ffd700]/10 flex items-center justify-center mx-auto mb-6">
              <Briefcase className="w-12 h-12 text-[#ffd700]" />
            </div>
            <h3 className="font-syne text-[24px] font-bold text-[var(--as-text)] mb-2">No Applications Yet</h3>
            <p className="font-outfit text-[#d0c6ab] mb-8 max-w-md mx-auto">
              Start your career journey by applying to opportunities that match your skills and experience.
            </p>
            <Link href="/opportunities" className="inline-flex items-center gap-2 bg-[#ffd700] text-[#3a3000] font-outfit font-bold px-8 py-3 rounded-xl hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-[#ffd700]/10">
              Browse Opportunities
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {/* No Results State */}
        {!loading && applications.length > 0 && filteredApplications.length === 0 && (
          <div className="bg-[#201f20] border border-white/5 rounded-2xl text-center py-16 px-8">
            <AlertCircle className="w-12 h-12 text-[var(--as-text-muted)] mx-auto mb-4" />
            <h3 className="font-syne text-[20px] font-bold text-[var(--as-text)] mb-1">No Matching Applications</h3>
            <p className="font-outfit text-[#d0c6ab] text-[14px]">No applications found with the selected filter.</p>
          </div>
        )}

        {/* Submissions List */}
        {!loading && filteredApplications.length > 0 && (
          <div className="flex flex-col gap-6">
            {filteredApplications.map((app) => {
              const opp = opps[app.opportunity];
              const stageConfig = STAGE_CONFIG[app.stage] || STAGE_CONFIG.New;
              const StageIcon = stageConfig.icon;

              return (
                <article
                  key={app.id}
                  className="group relative bg-[rgba(22,22,24,0.6)] backdrop-blur-[20px] border border-white/5 rounded-2xl overflow-hidden hover:border-white/10 hover:bg-[rgba(25,25,28,0.8)] transition-all duration-500 shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-[0_8px_40px_rgb(0,0,0,0.2)]"
                >
                  {/* Subtle Top Glow matching stage color */}
                  <div className="absolute top-0 left-0 w-full h-[2px] opacity-70 group-hover:opacity-100 transition-opacity" style={{ background: `linear-gradient(90deg, transparent, ${stageConfig.color}, transparent)` }} />
                  {/* Subtle Background Glow */}
                  <div className="absolute -inset-24 opacity-0 group-hover:opacity-10 transition-opacity duration-1000 blur-3xl pointer-events-none" style={{ backgroundColor: stageConfig.color }} />

                  <div className="p-6 md:p-8 relative z-10">
                    <div className="flex flex-col md:flex-row items-start gap-6">

                      {/* Company Logo / Icon */}
                      <div className="relative shrink-0">
                        <div className="absolute inset-0 bg-gradient-to-br from-[#ffd700] to-transparent opacity-20 blur-xl group-hover:opacity-40 transition-opacity" />
                        <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-b from-[#2a2a2b] to-[#1c1b1c] border border-white/10 flex items-center justify-center shadow-inner group-hover:border-[#ffd700]/30 transition-all">
                          <Briefcase className="w-7 h-7 text-[#ffd700] drop-shadow-[0_2px_10px_rgba(255,215,0,0.3)]" />
                        </div>
                      </div>

                      {/* Main Content */}
                      <div className="flex-1 min-w-0 w-full flex flex-col h-full">
                        <div className="flex flex-col md:flex-row items-start justify-between gap-4 mb-3">
                          <div className="min-w-0 pr-4">
                            <h3 className="font-syne text-[24px] md:text-[28px] font-bold text-white truncate tracking-tight group-hover:text-[#ffd700] transition-colors">
                              {opp?.title ?? `Application ${app.id.slice(0, 8)}`}
                            </h3>
                            {opp && (
                              <p className="font-outfit text-[15px] text-[#999077] mt-1 flex items-center gap-2">
                                <span className="font-medium text-[#d0c6ab]">{opp.company}</span>
                                <span className="w-1 h-1 rounded-full bg-[#999077]" />
                                <span>{opp.location}</span>
                              </p>
                            )}
                          </div>

                          {/* Badges */}
                          <div className="flex gap-2 flex-wrap shrink-0 mt-2 md:mt-0">
                            {/* Stage Badge */}
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl backdrop-blur-md border" style={{ backgroundColor: `${stageConfig.color}15`, borderColor: `${stageConfig.color}30` }}>
                              <StageIcon className="w-4 h-4" style={{ color: stageConfig.color }} />
                              <span className="font-outfit text-[13px] font-bold tracking-wide" style={{ color: stageConfig.color }}>{stageConfig.label}</span>
                            </div>
                            {/* Submission type badge */}
                            {app.opportunity_submission_type && SUBMISSION_TYPE_LABELS[app.opportunity_submission_type] && (
                              <div className="flex items-center px-4 py-2 rounded-xl bg-white/5 border border-white/10">
                                <span className="font-outfit text-[12px] text-[#d0c6ab] font-medium tracking-wide">{SUBMISSION_TYPE_LABELS[app.opportunity_submission_type]}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Stage Description */}
                        <p className="font-outfit text-[15px] text-[#999077] mb-5 leading-relaxed max-w-2xl">
                          {stageConfig.description}
                        </p>

                        {/* Cover Note */}
                        {app.cover_note && (
                          <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-white/[0.03] to-transparent border border-white/[0.02] p-5 mb-6 group/note hover:bg-white/[0.05] transition-colors">
                            <div className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: stageConfig.color }} />
                            <p className="font-newsreader text-[18px] text-[#d0c6ab] italic leading-relaxed pl-2 relative z-10">
                              "{app.cover_note}"
                            </p>
                          </div>
                        )}

                        {/* Audition slot */}
                        {app.audition_slot && (
                          <div className="flex items-center gap-3 mb-6 p-4 rounded-xl bg-blue-500/5 border border-blue-500/20 w-fit">
                            <Calendar className="w-5 h-5 text-blue-400" />
                            <span className="font-outfit text-[14px] text-blue-300 font-medium">
                              Slot: {new Date(app.audition_slot.start_time).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                              {app.audition_slot.location_or_link ? ` · ${app.audition_slot.location_or_link}` : ""}
                            </span>
                          </div>
                        )}

                        <div className="flex-grow" />

                        {/* Footer Meta */}
                        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-5 border-t border-white/10 mt-2">
                          <div className="flex items-center gap-2.5 text-[#999077]">
                            <Clock className="w-4 h-4 opacity-70" />
                            <span className="font-outfit text-[13px] font-medium tracking-wide">
                              Submitted {formatDate(app.submitted_at)}
                            </span>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex gap-3 flex-wrap">
                            {(app.video_url || app.audio_url) && (
                              <button
                                onClick={() => {
                                  const url = app.video_url || app.audio_url!;
                                  setViewingUrl(url);
                                  setViewingType(app.video_url ? "video" : "audio");
                                }}
                                className="flex items-center gap-2 font-outfit text-[14px] font-bold text-[#ffd700] px-5 py-2.5 rounded-xl border border-[#ffd700]/30 bg-[#ffd700]/5 hover:bg-[#ffd700]/15 hover:border-[#ffd700]/50 transition-all active:scale-95 group/btn"
                              >
                                {app.video_url ? <Video className="w-4 h-4 group-hover/btn:scale-110 transition-transform" /> : <Mic className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />}
                                View Recording
                              </button>
                            )}
                            {opp && (
                              <Link href={`/opportunities/${opp.id}`} className="group/link flex items-center gap-2 font-outfit text-[14px] font-bold text-white px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all active:scale-95">
                                View Opportunity
                                <ChevronRight className="w-4 h-4 group-hover/link:translate-x-1 transition-transform text-[#ffd700]" />
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* Summary Footer */}
        {!loading && applications.length > 0 && (
          <div className="mt-10 p-6 bg-[#201f20] rounded-2xl border border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <Award className="w-6 h-6 text-[#ffd700]" />
              <div>
                <p className="font-outfit text-[14px] text-[#d0c6ab] m-0">
                  Total Applications: <strong className="text-[var(--as-text)]">{applications.length}</strong>
                </p>
                <p className="font-outfit text-[12px] text-[var(--as-text-muted)] m-0 mt-1">
                  Last updated {new Date().toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="flex gap-4 flex-wrap">
              {Object.entries(statusCounts).map(([stage, count]) => {
                const config = STAGE_CONFIG[stage] || STAGE_CONFIG.New;
                if (count === 0) return null;
                return (
                  <div key={stage} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: config.color }} />
                    <span className="font-outfit text-[13px] text-[#d0c6ab]">
                      {config.label}: <strong className="text-[var(--as-text)]">{count}</strong>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* Recording lightbox */}
      {viewingUrl && (
        <>
          <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[100]" onClick={() => setViewingUrl(null)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-[900px] z-[101]">
            <button onClick={() => setViewingUrl(null)} className="absolute -top-10 right-0 flex items-center gap-2 text-white font-outfit text-[14px] hover:text-[#ffd700] transition-colors">
              <X className="w-5 h-5" /> Close
            </button>
            {viewingType === "video"
              ? <video src={viewingUrl} controls autoPlay className="w-full rounded-xl max-h-[80vh] shadow-2xl" />
              : <audio src={viewingUrl} controls autoPlay className="w-full mt-5 shadow-2xl" />
            }
          </div>
        </>
      )}
    </div>
  );
}