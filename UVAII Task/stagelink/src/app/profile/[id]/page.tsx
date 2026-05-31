"use client";

import { use, useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api";
import { getUser } from "@/lib/auth";
import Link from "next/link";
import {
  CheckCircle2, MapPin, Users, FileVideo, MessageSquare, Plus, Star, Award, Loader2,
  Briefcase, Video, ShieldCheck, Pencil, ExternalLink, Film, Scissors,
  Palette, Image as ImageIcon, Headphones, FileText, Tv, Camera,
  Volume2, Globe, Plane, GraduationCap, Wrench, Trophy, Quote, BarChart3,
  TrendingUp, Eye, X, ChevronLeft, ChevronRight, Calendar,
  Ruler, Zap, Package, Heart, BookOpen, MapPinned, ArrowDownToLine, Play,
  Sliders, Newspaper, DollarSign, Repeat, Send, Bookmark, MoreHorizontal,
} from "lucide-react";
import { DisciplineDetails, DISCIPLINE_LABELS } from "@/components/profile/DisciplineForm";
import CinematicProfile from "./CinematicProfile";

function formatTimeAgo(dateStr?: string | null): string {
  if (!dateStr || dateStr === "Just now") return "Just now";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  
  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

/* ═══════════════════════════════ TYPES ════════════════════════════ */
interface Talent {
  id: string;
  owner: number | null;
  owner_role?: string;
  name: string;
  category: string;
  avatar: string;
  cover_gradient: string;
  verified: boolean;
  location: string;
  followers: number;
  rating: number;
  views: number;
  bio: string;
  agency: string | null;
  skills: string[];
  credits: Array<{ title: string; role: string; year: number; collaborators?: string[] } | string>;
  badges: string[];
  reel_url: string | null;
  union_name: string | null;
  social_links: Record<string, string>;
  discipline_data?: Record<string, Record<string, unknown>>;
  physical_stats: {
    height?: string; weight?: string; hair_color?: string;
    eye_color?: string; age_range?: string; build?: string;
    dress_size?: string; shoe_size?: string;
  };
  travel_info: {
    passport_countries?: string[];
    works_local_cities?: string[];
    visa_notes?: string;
  };
  training: Array<{ school: string; program: string; year?: string }>;
  awards: Array<{ name: string; project?: string; year?: string; festival?: string; award_type?: string; url?: string }>;
  equipment: string[];
  field_visibility?: Record<string, string>;
  availability_status: string;
  availability_until: string;
  endorsements: Array<{ author_name: string; author_role: string; author_avatar?: string; text: string }>;
  pinned_post_id: string;
  name_audio_url: string | null;
  languages: string[];
  // §8.1 fields
  sub_disciplines?: string[];
  press_mentions?: Array<{ publication: string; headline: string; date?: string; url?: string }>;
  external_links?: Record<string, string>;
  profile_visibility?: string;
  artstage_username?: string;
}

interface ArtistProfile {
  primary_discipline?: string;
  tagline?: string;
  completeness_score?: number;
  headshots?: string[];
  skill_entries?: Array<{ id: number; category: string; name: string; proficiency: string }>;
  representation?: { manager_name?: string; agent?: string; agency?: string; [key: string]: unknown };
}

interface EndorsementRecord {
  id: number;
  author: number;
  author_name: string;
  author_email: string;
  text: string;
  skill_category?: string;
  verified: boolean;
  created_at: string;
}

interface CreditVerification { id: number; credit_title: string; status: string; }
interface Application { id: string; stage: string; opportunity: string; cover_note: string; }
interface Connection {
  id: number;
  from_user: number;
  from_user_email: string;
  to_user: number;
  to_user_email: string;
  status: string;
  created_at: string;
}

interface AvailWindow {
  id: number;
  start_date: string;
  end_date: string;
  state: string;
  note: string;
  willing_to_travel: boolean;
}

const AVAIL_WIN_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  available:   { bg: "rgba(52,211,153,0.10)",  text: "#34D399", border: "#34D399" },
  tentative:   { bg: "rgba(251,191,36,0.10)",  text: "#FBBF24", border: "#FBBF24" },
  unavailable: { bg: "rgba(154,154,154,0.10)", text: "#9A9A9A", border: "#9A9A9A" },
  booked:      { bg: "rgba(167,139,250,0.10)", text: "#A78BFA", border: "#A78BFA" },
};
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
  owner?: number;
}

/* ═══════════════ SHARED UI (ArtStage styled) ═════════════════════ */

function EditShortcut({ section }: { section: string }) {
  return (
    <Link href={`/profile/edit?section=${section}`}
      className="inline-flex items-center gap-1 text-xs as-text-muted hover:as-accent transition-colors shrink-0">
      <Pencil className="w-3 h-3" /> Edit
    </Link>
  );
}

function SectionHeading({ children, editSection, isOwner }: {
  children: React.ReactNode;
  editSection?: string;
  isOwner?: boolean;
}) {
  return (
    <div className={`${editSection && isOwner ? "flex items-center justify-between" : ""} mb-4`}>
      <h3 className="as-display text-[22px] font-semibold as-text tracking-tight">
        {children}
      </h3>
      {editSection && isOwner && <EditShortcut section={editSection} />}
    </div>
  );
}

function Pill({ children, active, className = "" }: { children: React.ReactNode; active?: boolean; className?: string }) {
  return (
    <span className={`as-pill ${active ? '!bg-[var(--as-accent)] !text-white !border-[var(--as-accent)]' : ''} ${className}`}>
      {children}
    </span>
  );
}

function AvailBadge({ status, until }: { status: string; until: string }) {
  const s = status.toLowerCase();
  const dotColor = s === "available" ? "bg-[var(--as-verified)]" : s === "limited" ? "bg-[#C8A882]" : "bg-[var(--as-text-muted)]";
  const textColor = s === "available" ? "as-verified-color" : "as-text-secondary";
  return (
    <span className={`inline-flex items-center gap-2 text-sm font-medium ${textColor}`}>
      <span className={`w-2 h-2 rounded-full as-live-pulse ${dotColor}`} />
      {status}{until ? ` · ${until}` : ""}
    </span>
  );
}

/* ═══════════════ LIGHTBOX GALLERY ════════════════════════════════ */
function LightboxGallery({ images }: { images: string[] }) {
  const [open, setOpen] = useState<number | null>(null);
  if (!images || images.length === 0) return null;
  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {images.map((src, i) => (
          <button key={i} onClick={() => setOpen(i)}
            className="aspect-square overflow-hidden rounded-lg bg-[rgba(255,255,255,0.04)] group relative cursor-pointer">
            <img src={src} alt={`Headshot ${i + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
          </button>
        ))}
      </div>
      {open !== null && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setOpen(null)}>
          <button className="absolute top-4 right-4 text-white/60 hover:text-white" onClick={() => setOpen(null)}>
            <X className="w-8 h-8" />
          </button>
          {open > 0 && (
            <button className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white"
              onClick={e => { e.stopPropagation(); setOpen(Math.max(0, open - 1)); }}>
              <ChevronLeft className="w-10 h-10" />
            </button>
          )}
          <img src={images[open]} alt="" className="max-h-[85vh] max-w-[85vw] object-contain rounded-lg"
            onClick={e => e.stopPropagation()} />
          {open < images.length - 1 && (
            <button className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white"
              onClick={e => { e.stopPropagation(); setOpen(Math.min(images.length - 1, open + 1)); }}>
              <ChevronRight className="w-10 h-10" />
            </button>
          )}
          <span className="absolute bottom-6 text-white/40 text-sm">{open + 1} / {images.length}</span>
        </div>
      )}
    </>
  );
}


/* ═══════════════ ABOUT TAB ═══════════════════════════════════════ */
function AboutTab({ talent, artist, isOwner }: { talent: Talent; artist: ArtistProfile | null; isOwner?: boolean }) {
  const [availWindows, setAvailWindows] = useState<AvailWindow[]>([]);
  useEffect(() => {
    apiClient.get<AvailWindow[]>(`/availability/?talent=${talent.id}`).then(setAvailWindows).catch(() => {});
  }, [talent.id]);

  // ── Booking (hirers / agencies only) ──
  const me = getUser();
  const canBook = !isOwner && (me?.role === "HIRER" || me?.role === "AGENCY");
  const [showBooking, setShowBooking] = useState(false);
  const [bookForm, setBookForm] = useState({ amount: "", currency: "USD", message: "", start_date: "", end_date: "" });
  const [bookingSubmitting, setBookingSubmitting] = useState(false);
  const [bookingResult, setBookingResult] = useState<{ ok: boolean; text: string } | null>(null);

  function openBooking(win?: AvailWindow) {
    setBookingResult(null);
    setBookForm({
      amount: "", currency: "USD", message: "",
      start_date: win?.start_date ?? "", end_date: win?.end_date ?? "",
    });
    setShowBooking(true);
  }

  async function submitBooking() {
    if (!bookForm.amount.trim()) { setBookingResult({ ok: false, text: "Enter an offer amount." }); return; }
    setBookingSubmitting(true); setBookingResult(null);
    try {
      await apiClient.post("/bookings/", {
        to_talent: talent.id,
        amount: bookForm.amount.trim(),
        currency: bookForm.currency,
        message: bookForm.message.trim(),
        start_date: bookForm.start_date || null,
        end_date: bookForm.end_date || null,
      });
      setBookingResult({ ok: true, text: `Offer sent to ${talent.name}!` });
      setTimeout(() => setShowBooking(false), 1800);
    } catch (err: unknown) {
      const detail = (err as { data?: { detail?: string } })?.data?.detail || (err as Error)?.message;
      setBookingResult({ ok: false, text: detail || "Failed to send offer." });
    } finally {
      setBookingSubmitting(false);
    }
  }

  const stats = talent.physical_stats ?? {};
  const travel = talent.travel_info ?? {};
  const training = talent.training ?? [];
  const equipment = talent.equipment ?? [];
  const isPerformer = !['director','editor','designer','vfx','producer','writer','screenwriter','pa','assistant'].some(k => talent.category.toLowerCase().includes(k));
  const isCrew = ['editor','designer','vfx','dp','sound'].some(k => talent.category.toLowerCase().includes(k));

  return (
    <div className="space-y-10">
      {/* Physical Stats */}
      {isPerformer && (
        <div>
          <SectionHeading editSection="physical" isOwner={isOwner}>Physical Stats</SectionHeading>
          <div className="as-surface rounded-lg p-5">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-4">
              {Object.entries(stats).map(([key, val]) => (
                <div key={key}>
                  <p className="text-[10px] uppercase tracking-[0.1em] as-text-muted mb-0.5">{key.replace(/_/g, ' ')}</p>
                  <p className="font-semibold as-text text-sm">{val as string}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Languages */}
      {talent.languages?.length > 0 && (
        <div>
          <SectionHeading editSection="disciplines" isOwner={isOwner}>Languages &amp; Accents</SectionHeading>
          <div className="flex flex-wrap gap-2">
            {talent.languages.map(lang => <Pill key={lang}>{lang}</Pill>)}
          </div>
        </div>
      )}

      {/* Availability */}
      <div>
        <SectionHeading editSection="availability" isOwner={isOwner}>Availability</SectionHeading>
        <div className="as-surface rounded-lg p-5">
          <div className="flex items-center gap-4 flex-wrap mb-3">
            <AvailBadge status={talent.availability_status || "Available"} until={talent.availability_until || "Jun – Aug 2025"} />
            <span className="text-sm as-text-secondary">Based in {talent.location}</span>
            {canBook && (
              <button
                onClick={() => openBooking()}
                className="ml-auto flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold"
                style={{ background: "#ffd700", color: "#221b00" }}
              >
                <Briefcase className="w-4 h-4" /> Book Talent
              </button>
            )}
          </div>
          {availWindows.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "4px" }}>
              {availWindows.map(w => {
                const colors = AVAIL_WIN_COLORS[w.state] ?? AVAIL_WIN_COLORS.available;
                const bookable = canBook && w.state !== "booked" && w.state !== "unavailable";
                return (
                  <div key={w.id} style={{
                    borderLeft: `3px solid ${colors.border}`,
                    border: `1px solid ${colors.border}18`,
                    borderLeftWidth: "3px",
                    background: colors.bg,
                    borderRadius: "10px",
                    padding: "12px 16px",
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                  }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                        <span style={{ fontSize: "13px", fontWeight: 500, color: "var(--as-text)" }}>
                          {w.start_date} – {w.end_date}
                        </span>
                        <span style={{ fontSize: "11px", fontWeight: 600, color: colors.text, textTransform: "capitalize", background: colors.bg, border: `1px solid ${colors.border}30`, padding: "2px 8px", borderRadius: "999px" }}>
                          {w.state}
                        </span>
                        {w.willing_to_travel && (
                          <span style={{ fontSize: "11px", color: "var(--as-text-muted)", background: "rgba(255,255,255,0.06)", padding: "2px 8px", borderRadius: "999px" }}>Will travel</span>
                        )}
                      </div>
                      {w.note && <p style={{ fontSize: "12px", color: "var(--as-text-muted)", marginTop: "4px" }}>{w.note}</p>}
                    </div>
                    {bookable && (
                      <button
                        onClick={() => openBooking(w)}
                        className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                        style={{ background: "rgba(255,215,0,0.12)", color: "#ffd700", border: "1px solid rgba(255,215,0,0.3)" }}
                      >
                        Book this window
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Booking Modal */}
      {showBooking && (
        <div
          onClick={() => setShowBooking(false)}
          style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px", background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ width: "100%", maxWidth: "440px", borderRadius: "20px", padding: "28px", background: "rgba(22,22,24,0.97)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.1)" }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "18px" }}>
              <h3 style={{ fontSize: "20px", fontWeight: 700, color: "#fff", margin: 0 }}>Book {talent.name}</h3>
              <button onClick={() => setShowBooking(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--as-text-muted)" }}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div style={{ display: "flex", gap: "10px" }}>
                <div style={{ flex: 2 }}>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--as-text-muted)", display: "block", marginBottom: "5px" }}>Offer Amount</label>
                  <input value={bookForm.amount} onChange={e => setBookForm(p => ({ ...p, amount: e.target.value }))} placeholder="e.g. 2500/day"
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "10px", background: "#0e0e0f", border: "1px solid rgba(255,255,255,0.1)", color: "var(--as-text)", fontSize: "14px", outline: "none" }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--as-text-muted)", display: "block", marginBottom: "5px" }}>Currency</label>
                  <select value={bookForm.currency} onChange={e => setBookForm(p => ({ ...p, currency: e.target.value }))}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "10px", background: "#0e0e0f", border: "1px solid rgba(255,255,255,0.1)", color: "var(--as-text)", fontSize: "14px", outline: "none" }}>
                    {["USD", "EUR", "GBP"].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: "flex", gap: "10px" }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--as-text-muted)", display: "block", marginBottom: "5px" }}>Start date</label>
                  <input type="date" value={bookForm.start_date} onChange={e => setBookForm(p => ({ ...p, start_date: e.target.value }))}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "10px", background: "#0e0e0f", border: "1px solid rgba(255,255,255,0.1)", color: "var(--as-text)", fontSize: "14px", outline: "none" }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--as-text-muted)", display: "block", marginBottom: "5px" }}>End date</label>
                  <input type="date" value={bookForm.end_date} onChange={e => setBookForm(p => ({ ...p, end_date: e.target.value }))}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "10px", background: "#0e0e0f", border: "1px solid rgba(255,255,255,0.1)", color: "var(--as-text)", fontSize: "14px", outline: "none" }} />
                </div>
              </div>

              <div>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--as-text-muted)", display: "block", marginBottom: "5px" }}>Message (optional)</label>
                <textarea value={bookForm.message} onChange={e => setBookForm(p => ({ ...p, message: e.target.value }))} rows={3} placeholder="Tell them about the role and dates…"
                  style={{ width: "100%", padding: "10px 12px", borderRadius: "10px", background: "#0e0e0f", border: "1px solid rgba(255,255,255,0.1)", color: "var(--as-text)", fontSize: "14px", outline: "none", resize: "vertical" }} />
              </div>

              {bookingResult && (
                <p style={{ fontSize: "13px", fontWeight: 500, margin: 0, color: bookingResult.ok ? "#00dbe8" : "#ffb4ab" }}>{bookingResult.text}</p>
              )}

              <button
                onClick={submitBooking}
                disabled={bookingSubmitting || bookingResult?.ok === true}
                style={{ width: "100%", padding: "12px", borderRadius: "12px", background: "#ffd700", color: "#221b00", border: "none", fontWeight: 700, fontSize: "15px", cursor: bookingSubmitting ? "not-allowed" : "pointer", opacity: bookingSubmitting ? 0.7 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
              >
                {bookingSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Briefcase className="w-4 h-4" />}
                Send Booking Offer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Training */}
      <div>
        <SectionHeading editSection="training" isOwner={isOwner}>Education &amp; Training</SectionHeading>
        <div className="as-surface rounded-lg divide-y divide-[var(--as-border)]">
          {training.map((t, i) => (
            <div key={i} className="flex items-start gap-4 p-4">
              <div className="w-10 h-10 rounded-full bg-[rgba(255,215,0,0.1)] flex items-center justify-center shrink-0 mt-0.5">
                <GraduationCap className="w-5 h-5 as-accent" />
              </div>
              <div>
                <h4 className="font-semibold text-sm as-text">{t.school}</h4>
                <p className="text-xs as-text-muted">{t.program}{t.year ? ` · ${t.year}` : ''}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Travel */}
      <div>
        <SectionHeading editSection="location" isOwner={isOwner}>Travel &amp; Logistics</SectionHeading>
        <div className="as-surface rounded-lg p-5 space-y-5">
          {(travel.passport_countries ?? []).length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-[0.1em] as-text-muted mb-2">Passport / Citizenship</p>
              <div className="flex flex-wrap gap-2">{(travel.passport_countries ?? []).map(c => <Pill key={c}>{c}</Pill>)}</div>
            </div>
          )}
          {(travel.works_local_cities ?? []).length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-[0.1em] as-text-muted mb-2">Works Local In</p>
              <div className="flex flex-wrap gap-2">
                {(travel.works_local_cities ?? []).map(c => (
                  <span key={c} className="inline-flex items-center gap-1.5 text-sm px-3 py-1 rounded-full border border-[var(--as-border)] bg-[var(--as-surface)] as-text-secondary">
                    <MapPinned className="w-3 h-3 as-accent" />{c}
                  </span>
                ))}
              </div>
            </div>
          )}
          {travel.visa_notes && (
            <div>
              <p className="text-[10px] uppercase tracking-[0.1em] as-text-muted mb-2">Visa Status</p>
              <p className="text-sm as-text-secondary flex items-center gap-2"><Globe className="w-4 h-4 as-accent" />{travel.visa_notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Equipment */}
      {isCrew && (
        <div>
          <SectionHeading editSection="equipment" isOwner={isOwner}>Owned Equipment &amp; Gear</SectionHeading>
          <div className="as-surface rounded-lg divide-y divide-[var(--as-border)]">
            {equipment.map((item, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3">
                <Wrench className="w-4 h-4 as-accent shrink-0" />
                <span className="text-sm as-text">{item}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skill entries (grouped by category) */}
      {artist?.skill_entries && artist.skill_entries.length > 0 && (() => {
        const grouped: Record<string, typeof artist.skill_entries> = {};
        artist.skill_entries!.forEach(s => {
          if (!grouped[s.category]) grouped[s.category] = [];
          grouped[s.category]!.push(s);
        });
        const labels: Record<string, string> = { language: "Languages", accent: "Accents & Dialects", instrument: "Instruments", dance_style: "Dance Styles", vocal: "Vocal", physical: "Physical Skills", driving: "Driving", specialty: "Specialties" };
        return (
          <div>
            <SectionHeading editSection="disciplines" isOwner={isOwner}>Skills &amp; Abilities</SectionHeading>
            <div className="as-surface rounded-lg p-5 space-y-4">
              {Object.entries(grouped).map(([cat, entries]) => (
                <div key={cat}>
                  <p className="text-[10px] uppercase tracking-[0.1em] as-text-muted mb-2">{labels[cat] ?? cat}</p>
                  <div className="flex flex-wrap gap-2">
                    {entries!.map(s => (
                      <span key={s.id} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F0EDE8] border border-[var(--as-border)] text-xs as-text">
                        {s.name}
                        {s.proficiency && <span className="as-text-muted">· {s.proficiency}</span>}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Press mentions */}
      {(talent.press_mentions ?? []).length > 0 && (
        <div>
          <SectionHeading editSection="awards" isOwner={isOwner}>Press</SectionHeading>
          <div className="as-surface rounded-lg divide-y divide-[var(--as-border)]">
            {(talent.press_mentions ?? []).map((pm, i) => (
              <div key={i} className="flex items-start gap-4 p-4">
                <div className="w-8 h-8 rounded-full bg-[rgba(255,215,0,0.1)] flex items-center justify-center shrink-0">
                  <Newspaper className="w-4 h-4 as-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  {pm.url ? (
                    <a href={pm.url} target="_blank" rel="noopener noreferrer" className="font-medium text-sm as-text hover:as-accent transition-colors">{pm.headline}</a>
                  ) : (
                    <p className="font-medium text-sm as-text">{pm.headline}</p>
                  )}
                  <p className="text-xs as-text-muted mt-0.5">{pm.publication}{pm.date ? ` · ${pm.date}` : ""}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Headshots gallery (real uploads) */}
      {(artist?.headshots?.length ?? 0) > 0 && (
        <div>
          <SectionHeading editSection="media" isOwner={isOwner}>Headshots</SectionHeading>
          <LightboxGallery images={artist!.headshots!} />
        </div>
      )}
    </div>
  );
}

/* ═══════════════ AWARDS TAB ═════════════════════════════════════ */
function AwardsTab({ talent, isOwner }: { talent: Talent; isOwner?: boolean }) {
  const awards = talent.awards ?? [];
  const winners = awards.filter(a => a.award_type !== 'selection');
  const selections = awards.filter(a => a.award_type === 'selection');

  return (
    <div className="space-y-10">
      {winners.length > 0 && (
        <div>
          <SectionHeading editSection="awards" isOwner={isOwner}>Awards &amp; Wins</SectionHeading>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {winners.map((award, i) => (
              <div key={i} className="as-surface p-5 rounded-lg hover:shadow-sm transition-shadow as-verified-bar">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#E8F5EF] flex items-center justify-center shrink-0">
                    <Trophy className="w-5 h-5 as-verified-color" />
                  </div>
                  <div>
                    {award.url ? (
                      <a href={award.url} target="_blank" rel="noopener noreferrer" className="font-semibold as-text hover:as-accent transition-colors">{award.name}</a>
                    ) : (
                      <h4 className="font-semibold as-text">{award.name}</h4>
                    )}
                    {award.festival && <p className="text-sm as-accent font-medium mt-0.5">{award.festival}</p>}
                    {award.project && <p className="text-xs as-text-muted mt-1">{award.project}{award.year ? ` · ${award.year}` : ''}</p>}
                    <Pill active className="mt-2">🏆 Winner</Pill>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {selections.length > 0 && (
        <div>
          <SectionHeading editSection="awards" isOwner={isOwner}>Festival Selections</SectionHeading>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {selections.map((award, i) => (
              <div key={i} className="as-surface p-5 rounded-lg hover:shadow-sm transition-shadow">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-[rgba(255,215,0,0.1)] flex items-center justify-center shrink-0">
                    <Award className="w-5 h-5 as-accent" />
                  </div>
                  <div>
                    {award.url ? (
                      <a href={award.url} target="_blank" rel="noopener noreferrer" className="font-semibold as-text hover:as-accent transition-colors">{award.name}</a>
                    ) : (
                      <h4 className="font-semibold as-text">{award.name}</h4>
                    )}
                    {award.festival && <p className="text-sm as-accent font-medium mt-0.5">{award.festival}</p>}
                    {award.project && <p className="text-xs as-text-muted mt-1">{award.project}{award.year ? ` · ${award.year}` : ''}</p>}
                    <Pill className="mt-2">⭐ Official Selection</Pill>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════ ENDORSEMENTS TAB ═══════════════════════════════ */
function EndorsementsTab({ talentId, isOwner, currentUserId }: { talentId: string; isOwner: boolean; currentUserId: number | null }) {
  const [endorsements, setEndorsements] = useState<EndorsementRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formText, setFormText] = useState("");
  const [formCategory, setFormCategory] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    apiClient.get<EndorsementRecord[]>(`/endorsements/?talent=${talentId}`)
      .then(data => setEndorsements(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [talentId]);

  const canEndorse = !isOwner && !!currentUserId && !endorsements.some(e => e.author === currentUserId);

  async function submitEndorsement() {
    if (!formText.trim()) return;
    setSubmitting(true); setError("");
    try {
      const created = await apiClient.post<EndorsementRecord>("/endorsements/", {
        talent: talentId, text: formText.trim(), skill_category: formCategory,
      });
      setEndorsements(prev => [created, ...prev]);
      setFormText(""); setFormCategory(""); setShowForm(false);
    } catch (e: any) { setError(e?.message ?? "Failed to submit."); }
    finally { setSubmitting(false); }
  }

  async function removeEndorsement(id: number) {
    try {
      await apiClient.delete(`/endorsements/${id}/`);
      setEndorsements(prev => prev.filter(e => e.id !== id));
    } catch {}
  }

  if (loading) return <div className="py-8 text-center as-text-muted text-sm">Loading endorsements…</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm as-text-muted">{endorsements.length} endorsement{endorsements.length !== 1 ? "s" : ""}</p>
        {canEndorse && !showForm && (
          <button onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-1.5 text-sm px-4 py-2 rounded-lg border border-[var(--as-accent)] as-accent font-medium hover:bg-[rgba(255,215,0,0.1)] transition-colors">
            <Plus className="w-4 h-4" /> Endorse
          </button>
        )}
      </div>

      {showForm && (
        <div className="as-surface p-5 rounded-lg border border-[var(--as-accent)]/30 space-y-3">
          <p className="font-semibold text-sm as-text">Write an endorsement</p>
          {error && <p className="text-xs text-[#e10111]">{error}</p>}
          <textarea value={formText} onChange={e => setFormText(e.target.value)} rows={4}
            placeholder="Describe your experience working with this artist…"
            className="w-full bg-[var(--as-bg)] border border-[var(--as-border)] rounded-lg px-3 py-2 text-sm outline-none focus:border-[var(--as-accent)]/50 resize-none" />
          <select value={formCategory} onChange={e => setFormCategory(e.target.value)}
            className="bg-[var(--as-bg)] border border-[var(--as-border)] rounded-lg px-3 py-2 text-sm as-text-muted outline-none w-full">
            <option value="">Skill area (optional)</option>
            {["acting", "singing", "dancing", "directing", "writing", "music", "comedy", "other"].map(c => (
              <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
            ))}
          </select>
          <div className="flex gap-2">
            <button onClick={submitEndorsement} disabled={submitting}
              className="px-4 py-2 bg-[var(--as-accent)] text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-60 flex items-center gap-1.5">
              {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null} Submit
            </button>
            <button onClick={() => { setShowForm(false); setFormText(""); setError(""); }}
              className="px-4 py-2 rounded-lg border border-[var(--as-border)] text-sm as-text-muted hover:bg-[#F0EDE8] transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      {endorsements.length === 0 && (
        <p className="text-sm as-text-muted py-8 text-center">No endorsements yet.</p>
      )}
      {endorsements.map(e => (
        <div key={e.id} className="as-surface p-6 rounded-lg relative">
          <Quote className="absolute top-4 right-5 w-8 h-8 text-[var(--as-border)]" />
          <p className="as-display italic text-[15px] leading-relaxed as-text-secondary mb-5">&ldquo;{e.text}&rdquo;</p>
          {e.skill_category && (
            <span className="inline-block text-[10px] px-2 py-0.5 rounded-full border border-[var(--as-border)] as-text-muted mb-3 capitalize">{e.skill_category}</span>
          )}
          <div className="flex items-center gap-3 pt-4 border-t border-[var(--as-border)]">
            <div className="w-9 h-9 rounded-full bg-[rgba(255,215,0,0.1)] flex items-center justify-center font-semibold as-accent text-sm shrink-0">
              {e.author_name?.charAt(0) ?? "?"}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm as-text">{e.author_name}</p>
              {e.verified && (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium as-verified-color">
                  <CheckCircle2 className="w-3 h-3" /> Verified
                </span>
              )}
            </div>
            {(isOwner || e.author === currentUserId) && (
              <button onClick={() => removeEndorsement(e.id)}
                className="text-[var(--as-text-muted)] hover:text-red-500 transition-colors">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════ CONTENT TAB ════════════════════════════════════ */
function ContentTab({
  talent,
  profileLiveStreams,
  profilePosts,
  profileReels,
}: {
  talent: Talent;
  profileLiveStreams: any[];
  profilePosts: any[];
  profileReels: any[];
}) {
  const router = useRouter();
  const liveNow = profileLiveStreams.filter((s: any) => s.is_live);
  const scheduled = profileLiveStreams.filter((s: any) => !s.is_live && s.scheduled_for);

  return (
    <div className="space-y-10">
      {/* Current Lives */}
      <div>
        <SectionHeading>Current Lives</SectionHeading>
        {liveNow.length === 0 ? (
          <p className="text-sm as-text-muted">No active livestreams.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {liveNow.map((stream: any) => (
              <div key={stream.id} onClick={() => router.push(`/lives/${stream.id}`)} className="as-surface p-4 rounded-lg border border-[var(--as-accent)] relative overflow-hidden group cursor-pointer hover:shadow-md transition-shadow">
                <div className="absolute top-2 right-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded animate-pulse">LIVE</div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center shrink-0">
                    <Video className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold as-text text-sm group-hover:as-accent transition-colors">{stream.title}</h4>
                    <p className="text-xs as-text-muted mt-1">{stream.viewer_count} watching now</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>



      {/* Reels */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="as-display text-[22px] font-semibold as-text tracking-tight">Reels</h3>
          <Link href={`/profile/${talent.id}/reels`} className="text-sm font-medium as-accent hover:underline flex items-center gap-1">
            View All <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {profileReels.length > 0 ? profileReels.slice(0, 4).map((reel: any) => (
            <Link key={reel.id} href={`/profile/${talent.id}/reels`}>
              <div className="aspect-[9/16] bg-black rounded-xl relative overflow-hidden group cursor-pointer ring-1 ring-white/10 hover:ring-[#ffe16d]/30 transition-all duration-300">
                {reel.thumbnail_url
                  ? <img src={reel.thumbnail_url} alt={reel.title} className="w-full h-full object-cover opacity-75 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300" />
                  : <div className="w-full h-full bg-gradient-to-br from-[#2a1a08] to-[#0e0e0f]" />
                }
                {/* type chip */}
                {reel.type && (
                  <div className="absolute top-2 left-2 text-[10px] font-semibold uppercase tracking-wide bg-black/60 backdrop-blur-sm text-white/80 px-2 py-0.5 rounded-full z-10">
                    {reel.type.replace(/_/g, " ")}
                  </div>
                )}
                {/* bottom gradient + title (always visible) */}
                <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/80 to-transparent" />
                <div className="absolute bottom-2 left-2 right-2 flex items-center gap-1 text-white text-xs font-medium z-10">
                  <Play className="w-3 h-3 fill-white shrink-0" /> <span className="truncate">{reel.title}</span>
                </div>
                {/* centered play on hover */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20">
                  <div className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
                    <Play className="w-5 h-5 fill-white" />
                  </div>
                </div>
              </div>
            </Link>
          )) : (
            <div className="col-span-4">
              <div className="flex flex-col items-center justify-center p-10 text-center rounded-2xl bg-black/40 border border-[#ffd700]/10 shadow-[0_0_30px_rgba(255,215,0,0.03)] backdrop-blur-md">
                <Film className="w-8 h-8 mb-3 text-[#ffd700]/40" />
                <p className="text-sm font-medium text-[var(--as-text)]">No reels yet</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Posts */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="as-display text-[22px] font-semibold as-text tracking-tight">Recent Posts</h3>
          <Link href={`/profile/${talent.id}/posts`} className="text-sm font-medium as-accent hover:underline flex items-center gap-1">
            View All <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        {profilePosts.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-10 text-center rounded-2xl bg-black/40 border border-[#ffd700]/10 shadow-[0_0_30px_rgba(255,215,0,0.03)] backdrop-blur-md">
            <FileText className="w-8 h-8 mb-3 text-[#ffd700]/40" />
            <p className="text-sm font-medium text-[var(--as-text)]">No posts yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {profilePosts.map((post: any) => {
              const ago = post.created_at
                ? new Date(post.created_at).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })
                : '';
              return (
                <div key={post.id} className="as-surface p-5 rounded-lg border border-[var(--as-border)]">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-[#E8F5EF] flex items-center justify-center font-bold text-xs as-accent overflow-hidden">
                        {talent.avatar
                          ? <img src={talent.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                          : talent.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-sm as-text">{talent.name}</p>
                        <p className="text-[10px] as-text-muted">{ago}</p>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm as-text-secondary leading-relaxed mb-3">{post.content}</p>
                  <div className="flex items-center gap-4 pt-3 border-t border-[var(--as-border)]">
                    <button className="flex items-center gap-1.5 text-xs font-medium as-text-muted hover:as-accent transition-colors">
                      <Heart className="w-4 h-4" /> {post.stats?.likes ?? 0}
                    </button>
                    <button className="flex items-center gap-1.5 text-xs font-medium as-text-muted hover:as-accent transition-colors">
                      <MessageSquare className="w-4 h-4" /> {post.stats?.comments ?? 0}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════ ANALYTICS PANEL ════════════════════════════════ */
function AnalyticsPanel({ analytics }: {
  analytics: { profile_views: number; submission_count: number; shortlisted_count: number; active_briefs: number; } | null;
}) {
  const stats = [
    { label: "Profile views", value: analytics?.profile_views ?? '—', icon: Eye },
    { label: "Submissions", value: analytics?.submission_count ?? '—', icon: TrendingUp },
    { label: "Shortlisted", value: analytics?.shortlisted_count ?? '—', icon: Users },
    { label: "Active briefs", value: analytics?.active_briefs ?? '—', icon: BarChart3 },
  ];
  return (
    <div className="as-surface rounded-lg p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 as-accent" />
          <h3 className="font-semibold as-text">Profile Insights</h3>
        </div>
        <Pill>Only you can see this</Pill>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        {stats.map((stat, i) => (
          <div key={i} className="bg-[var(--as-bg)] rounded-lg p-4 text-center border border-[var(--as-border)]">
            <stat.icon className="w-5 h-5 as-accent mx-auto mb-2" />
            <p className="text-2xl font-bold as-text">{stat.value}</p>
            <p className="text-[10px] as-text-muted mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>
      <div className="bg-[var(--as-bg)] rounded-lg p-4 border border-[var(--as-border)]">
        <p className="text-[10px] uppercase tracking-[0.1em] as-text-muted mb-3">Top search queries</p>
        <div className="flex flex-wrap gap-2">
          {['Bilingual Arabic Actress', 'Drama · Cairo', 'SAG-AFTRA Verified', 'Available Summer 2025'].map(q => (
            <Pill key={q}>{q}</Pill>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════ MAIN PROFILE PAGE ══════════════════════════════ */
export default function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const currentUser = getUser();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [talent, setTalent] = useState<Talent | null>(null);
  const [artist, setArtist] = useState<ArtistProfile | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [creditVerifications, setCreditVerifications] = useState<CreditVerification[]>([]);
  const [analytics, setAnalytics] = useState<{
    profile_views: number;
    submission_count: number;
    shortlisted_count: number;
    active_briefs: number;
  } | null>(null);
  const [profileLiveStreams, setProfileLiveStreams] = useState<any[]>([]);
  const [profilePosts, setProfilePosts] = useState<any[]>([]);
  const [sharedPosts, setSharedPosts] = useState<any[]>([]);
  const [profileReels, setProfileReels] = useState<any[]>([]);
  const [myTalentId, setMyTalentId] = useState<string | null>(null);
  const [orgJobs, setOrgJobs] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibilityBlock, setVisibilityBlock] = useState<null | { code: number; message: string }>(null);
  const [connecting, setConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'PENDING' | 'ACCEPTED' | null>(null);
  const [connectionId, setConnectionId] = useState<number | null>(null);
  const [isIncomingConnection, setIsIncomingConnection] = useState(false);
  const [activeTab, setActiveTab] = useState("content");

  useEffect(() => {
    const sessionUser = getUser();
    Promise.all([
      apiClient.get<Talent>(`/talents/${id}/`),
      apiClient.get<Application[]>(`/applications/?talent=${id}`),
      apiClient.get<Opportunity[]>('/opportunities/').catch(() => [] as Opportunity[]),
    ])
      .then(([t, apps, allJobs]) => {
        // Visibility enforcement
        const vis = t.profile_visibility ?? "public";
        const isOwner = t.owner === sessionUser?.user_id;
        if (!isOwner) {
          if (vis === "stealth") { setVisibilityBlock({ code: 404, message: "This profile doesn't exist or has been hidden." }); setLoading(false); return; }
          if (vis === "platform_only" && !sessionUser) { router.push("/login"); return; }
          if (vis === "industry_only" && (!sessionUser || !["HIRER", "AGENCY"].includes(sessionUser.role ?? ""))) {
            setVisibilityBlock({ code: 403, message: "This profile is only visible to industry professionals." }); setLoading(false); return;
          }
        }
        setTalent(t);
        setApplications(apps);
        
        // Load organization's jobs
        if (t.owner) {
          const matchingJobs = allJobs.filter(j => String(j.owner) === String(t.owner));
          setOrgJobs(matchingJobs);
        }

        // Default tab to posts for Hirer profile
        if (t.owner_role === 'HIRER') {
          setActiveTab("posts");
        }

        // Fetch ArtistProfile if username available
        if (t.artstage_username) {
          apiClient.get<ArtistProfile>(`/artists/${t.artstage_username}/`).then(setArtist).catch(() => {});
        }
        // Fetch Connection status
        if (sessionUser && t.owner && !isOwner) {
          apiClient.get<Connection[]>('/connections/')
            .then(conns => {
              const conn = conns.find(c => 
                (String(c.from_user) === String(sessionUser.user_id) && String(c.to_user) === String(t.owner)) ||
                (String(c.from_user) === String(t.owner) && String(c.to_user) === String(sessionUser.user_id))
              );
              if (conn) {
                setConnectionStatus(conn.status as 'PENDING' | 'ACCEPTED');
                setConnectionId(conn.id);
                setIsIncomingConnection(String(conn.to_user) === String(sessionUser.user_id));
              }
            })
            .catch(console.error);
        }
      })
      .catch(() => router.push('/explore'))
      .finally(() => setLoading(false));
    apiClient.get<CreditVerification[]>(`/credit-verifications/?talent=${id}`).then(setCreditVerifications).catch(() => {});
    apiClient.get<any[]>(`/posts/?artist=${id}`).then(setProfilePosts).catch(() => {});
    apiClient.get<any[]>('/lives/').then((lives: any[]) =>
      setProfileLiveStreams(lives.filter((l: any) => String(l.artist) === String(id)))
    ).catch(() => {});
    apiClient.get<any[]>(`/reels/?talent=${id}`).then(setProfileReels).catch(() => {});
  }, [id, router]);

  useEffect(() => {
    if (talent?.owner) {
      apiClient.get<any[]>(`/feed/?owner=${talent.owner}`).then(setSharedPosts).catch(() => {});
    }
  }, [talent?.owner]);

  useEffect(() => {
    if (currentUser) {
      apiClient.get<any>('/profile/').then(t => setMyTalentId(t.id ?? null)).catch(() => {});
    }
  }, [currentUser?.user_id]);

  useEffect(() => {
    if (!talent) return;
    const owner =
      (talent.owner != null && talent.owner === currentUser?.user_id) ||
      (myTalentId != null && myTalentId === id);
    if (!owner) return;
    apiClient
      .get<{ profile_views: number; submission_count: number; shortlisted_count: number; active_briefs: number }>('/analytics/dashboard/')
      .then(setAnalytics)
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [talent?.owner, myTalentId, id]);

  const handleConnect = async () => {
    if (!currentUser || !talent?.owner) return;
    setConnecting(true);
    try { 
      const res = await apiClient.post<Connection>('/connections/', { to_user: talent.owner }); 
      setConnectionStatus('PENDING'); 
      setConnectionId(res.id);
    }
    catch (err) { 
      console.error(err);
    }
    finally { setConnecting(false); }
  };

  const handleAcceptConnection = async () => {
    if (!connectionId) return;
    setConnecting(true);
    try {
      await apiClient.patch(`/connections/${connectionId}/accept/`, {});
      setConnectionStatus('ACCEPTED');
    } catch (err) {
      console.error(err);
    } finally { setConnecting(false); }
  };

  const handleRejectConnection = async () => {
    if (!connectionId) return;
    setConnecting(true);
    try {
      await apiClient.delete(`/connections/${connectionId}/`);
      setConnectionStatus(null);
      setConnectionId(null);
      setIsIncomingConnection(false);
    } catch (err) {
      console.error(err);
    } finally { setConnecting(false); }
  };

  // --- Derive Tabs Unconditionally (Rules of Hooks) ---
  const isOwner = !!(
    talent && (
      (talent.owner != null && talent.owner === currentUser?.user_id) ||
      (myTalentId != null && myTalentId === id)
    )
  );

  const primaryDiscipline = artist?.primary_discipline;
  const disciplineDetailsData = primaryDiscipline ? (talent?.discipline_data?.[primaryDiscipline] ?? null) : null;
  const hasDisciplineDetails = !!(disciplineDetailsData && Object.keys(disciplineDetailsData).length > 0);

  const isHirerProfile = talent?.owner_role === 'HIRER';

  const hirerTabs = [
    ...(profilePosts.length > 0 || isOwner ? [{ id: "posts", label: "Posts", icon: Tv }] : []),
    ...(sharedPosts.length > 0 || isOwner ? [{ id: "shared", label: "Shared Posts", icon: Repeat }] : []),
    ...(isOwner ? [{ id: "job_posts", label: "Job Posts", icon: Briefcase }] : []),
    { id: "employees", label: "Employees", icon: Users },
  ];

  const artistTabs = [
    ...(profilePosts.length > 0 || profileReels.length > 0 || profileLiveStreams.length > 0 || isOwner ? [{ id: "content", label: "Content", icon: Tv }] : []),
    ...(sharedPosts.length > 0 || isOwner ? [{ id: "shared", label: "Shared Posts", icon: Repeat }] : []),
    { id: "about", label: "About", icon: BookOpen },
    ...(hasDisciplineDetails ? [{ id: "details", label: DISCIPLINE_LABELS[primaryDiscipline!] ?? "Details", icon: Sliders }] : []),
    ...( (talent?.credits?.length ?? 0) > 0 || isOwner ? [{ id: "credits", label: "Credits", icon: Star }] : []),
    ...( (talent?.awards?.length ?? 0) > 0 || isOwner ? [{ id: "awards", label: "Awards", icon: Trophy }] : []),
    ...( (talent?.endorsements?.length ?? 0) > 0 || isOwner ? [{ id: "endorsements", label: "Endorsements", icon: Heart }] : []),
    ...( isOwner ? [{ id: "jobs", label: "Jobs", icon: Briefcase }] : []),
  ];

  const tabs = talent ? (isHirerProfile ? hirerTabs : artistTabs) : [];

  useEffect(() => {
    // If the currently active tab is not in the allowed tabs list, switch to the first available tab
    if (tabs.length > 0 && !tabs.some(t => t.id === activeTab)) {
      setActiveTab(tabs[0].id);
    }
  }, [tabs, activeTab]);
  // --- End Derive Tabs Unconditionally ---

  if (loading) return (
    <div className="artstage flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <div className="w-12 h-12 rounded-full as-skeleton mx-auto mb-4" />
        <div className="w-48 h-4 as-skeleton mx-auto mb-2" />
        <div className="w-32 h-3 as-skeleton mx-auto" />
      </div>
    </div>
  );

  if (visibilityBlock) return (
    <div className="artstage flex items-center justify-center min-h-[60vh]">
      <div className="text-center max-w-xs">
        <div className="w-14 h-14 rounded-full bg-[#F0EDE8] flex items-center justify-center mx-auto mb-4">
          <Eye className="w-7 h-7 as-text-muted" />
        </div>
        <h2 className="as-display text-xl font-semibold as-text mb-2">
          {visibilityBlock.code === 404 ? "Profile not found" : "Access restricted"}
        </h2>
        <p className="text-sm as-text-muted">{visibilityBlock.message}</p>
      </div>
    </div>
  );

  if (!talent) return null;

  function renderTabContent() {

    return (
      <>
        {/* ══════════ ANALYTICS (owner-only) ══════════ */}
        {isOwner && <div className="mb-6"><AnalyticsPanel analytics={analytics} /></div>}

        {/* ══════════ TABS ══════════ */}
        <div className="as-sticky-tabs mb-8 -mx-4 sm:-mx-6 px-4 sm:px-6">
          <div className="flex gap-6 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`shrink-0 flex items-center gap-1.5 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id ? 'border-[var(--as-accent)] as-accent' : 'border-transparent as-text-muted hover:as-text-secondary hover:border-[var(--as-border)]'}`}
              >
                <tab.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ══════════ TAB CONTENT ══════════ */}
        {activeTab === "posts" && (
          <div className="space-y-6">
            <h3 className="as-display text-[22px] font-semibold as-text tracking-tight mb-4">Organization Updates</h3>
            {profilePosts.length === 0 ? (
              <p className="text-sm as-text-muted">No updates posted yet.</p>
            ) : (
              <div className="space-y-4">
                {profilePosts.map((post: any) => {
                  const ago = post.created_at
                    ? new Date(post.created_at).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })
                    : '';
                  return (
                    <div key={post.id} className="as-surface p-5 rounded-lg border border-[var(--as-border)]">
                      <p className="text-sm as-text-secondary leading-relaxed mb-3">{post.content}</p>
                      <div className="flex items-center justify-between pt-3 border-t border-[var(--as-border)] text-xs as-text-muted">
                        <span>Posted on {ago}</span>
                        <div className="flex gap-4">
                          <span className="flex items-center gap-1.5"><Heart className="w-4 h-4" /> {post.stats?.likes ?? 0}</span>
                          <span className="flex items-center gap-1.5"><MessageSquare className="w-4 h-4" /> {post.stats?.comments ?? 0}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === "job_posts" && (
          <div className="space-y-6">
            <h3 className="as-display text-[22px] font-semibold as-text tracking-tight mb-4">Active Casting Calls &amp; Gigs</h3>
            {orgJobs.length === 0 ? (
              <p className="text-sm as-text-muted">No active casting calls or jobs listed.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {orgJobs.map(job => (
                  <Link key={job.id} href={`/opportunities/${job.id}`} className="group bg-[var(--as-surface)] border border-[var(--as-border)] rounded-2xl p-5 hover:border-[var(--as-accent)] hover:shadow-lg transition-all">
                    <div className="flex gap-4">
                      <div className="w-12 h-12 rounded-xl bg-[rgba(255,215,0,0.1)] flex items-center justify-center shrink-0">
                        <Briefcase className="w-6 h-6 as-accent" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-base text-[var(--as-text)] truncate group-hover:text-[var(--as-accent)] transition-colors mb-1">{job.title}</h4>
                        <p className="text-xs text-[var(--as-text-secondary)]">{job.company}</p>
                        <div className="flex flex-wrap items-center gap-3 mt-3 text-[11px] text-[var(--as-text-muted)]">
                          <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{job.location}</span>
                          <span className="flex items-center gap-1"><DollarSign className="w-3.5 h-3.5" />{job.compensation}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "employees" && (
          <div className="space-y-6">
            <h3 className="as-display text-[22px] font-semibold as-text tracking-tight mb-4">Our Team &amp; Associates</h3>
            <div className="as-surface rounded-xl p-12 text-center as-text-muted">
              <Users className="w-8 h-8 mx-auto mb-3 opacity-40" />
              <p className="text-sm">No team members listed yet.</p>
            </div>
          </div>
        )}

        {activeTab === "shared" && (
          <div className="space-y-6 max-w-2xl mx-auto">
            {sharedPosts.length === 0 ? (
              <div className="as-surface rounded-xl p-12 text-center as-text-muted">
                No shared posts or network activity.
              </div>
            ) : (
              sharedPosts.map(post => (
                <div key={post.id} className="as-surface rounded-xl overflow-hidden mb-4 border border-[var(--as-border)] shadow-sm">
                  {/* Header */}
                  {post.repost_of_detail && (
                    <div className="px-4 py-2 border-b border-[var(--as-border)] flex items-center gap-2 text-xs as-text-muted">
                      <Repeat className="w-3.5 h-3.5" />
                      <span className="font-semibold as-text">{post.author_name}</span> reposted this
                      <span className="ml-auto text-[10px] tracking-wider">{formatTimeAgo(post.created_at || post.time)}</span>
                    </div>
                  )}

                  {!post.repost_of_detail ? (
                    <div className="flex items-center justify-between p-4 pb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[var(--as-border)] flex items-center justify-center text-sm font-bold as-accent shrink-0 overflow-hidden">
                          {post.author_avatar ? (
                            <img src={post.author_avatar} alt="" className="w-full h-full object-cover" />
                          ) : (
                            post.author_name?.[0] ?? '?'
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-1">
                            <span className="font-semibold as-text text-sm hover:as-accent transition-colors cursor-pointer">
                              {post.author_name}
                            </span>
                            {post.verified && <CheckCircle2 className="w-3.5 h-3.5 as-verified-color" />}
                          </div>
                          <span className="text-xs as-text-muted block">{post.author_role}</span>
                          <span className="text-[10px] as-text-muted tracking-wider block mt-0.5">{formatTimeAgo(post.created_at || post.time)}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    post.description ? (
                      <div className="px-4 pt-3 pb-2">
                        <p className="text-sm as-text whitespace-pre-wrap">{post.description}</p>
                      </div>
                    ) : null
                  )}

                  {/* Caption */}
                  {!post.repost_of_detail && post.description && (
                    <div className="px-4 pb-3">
                      <p className="text-sm as-text whitespace-pre-wrap">{post.description}</p>
                    </div>
                  )}

                  {/* Media or Embedded Repost */}
                  {post.repost_of_detail ? (
                    <div className="mx-4 mb-3 mt-1 border border-[var(--as-border)] rounded-xl overflow-hidden bg-[rgba(255,255,255,0.02)]">
                      <div className="flex items-start p-3 gap-3">
                        <div className="w-10 h-10 rounded-xl overflow-hidden bg-[var(--as-border)] flex items-center justify-center">
                          {post.repost_of_detail.author_avatar ? (
                            <img src={post.repost_of_detail.author_avatar} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-sm font-bold as-accent">{post.repost_of_detail.author_name[0]}</span>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-1">
                            <span className="font-semibold as-text text-sm hover:as-accent transition-colors cursor-pointer">{post.repost_of_detail.author_name}</span>
                          </div>
                          <span className="text-xs as-text-muted block">{post.repost_of_detail.author_role}</span>
                        </div>
                      </div>
                      
                      {post.repost_of_detail.description && (
                        <div className="px-3 pb-3">
                          <p className="text-sm as-text line-clamp-3 whitespace-pre-wrap">{post.repost_of_detail.description}</p>
                        </div>
                      )}

                      {post.repost_of_detail.attachments && post.repost_of_detail.attachments.length > 0 && (
                        <div className={`w-full bg-[#201f20] ${post.repost_of_detail.attachments.length === 1 ? '' : 'grid grid-cols-2 gap-0.5'}`}>
                          {post.repost_of_detail.attachments.slice(0, 4).map((att: any, i: number) => (
                            <img
                              key={i}
                              src={att.url}
                              className={`w-full object-cover ${post.repost_of_detail.attachments!.length === 1 ? 'max-h-[400px]' : 'aspect-square'}`}
                              alt=""
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    post.attachments && post.attachments.length > 0 && (
                      <div className={`w-full bg-[#201f20] overflow-hidden ${post.attachments.length === 1 ? '' : 'grid grid-cols-2 gap-0.5'}`}>
                        {post.attachments.slice(0, 4).map((att: any, i: number) => (
                          <img
                            key={i}
                            src={att.url}
                            className={`w-full object-cover hover:scale-[1.02] transition-transform duration-500 ${post.attachments!.length === 1 ? 'max-h-[500px]' : 'aspect-square'}`}
                            alt="Post image"
                          />
                        ))}
                      </div>
                    )
                  )}

                  {/* Stats */}
                  <div className="px-4 py-3 flex items-center justify-between text-xs as-text-muted border-b border-[var(--as-border)]">
                    <div className="flex items-center gap-1.5">
                      {post.likes > 0 ? (
                        <>
                          <div className="w-4 h-4 rounded-full bg-[#e10111] flex items-center justify-center">
                            <Heart className="w-2.5 h-2.5 text-white" fill="currentColor" />
                          </div>
                          <span className="font-medium hover:as-accent cursor-pointer transition-colors">{post.likes.toLocaleString()} {post.likes === 1 ? 'like' : 'likes'}</span>
                        </>
                      ) : (
                        <span></span>
                      )}
                    </div>
                    <div className="flex gap-3">
                      {post.comments > 0 && (
                        <span className="font-medium">
                          {(post.comment_count || post.comments) || 0} comment{post.comments !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons (Read-only for profile page) */}
                  <div className="px-2 py-1 flex justify-between items-center relative">
                    <button className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg transition-all font-medium text-[13px] hover:bg-[rgba(255,255,255,0.04)] as-text-muted hover:as-text">
                      <Heart className="w-5 h-5" />
                      Like
                    </button>
                    <button className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg transition-all font-medium text-[13px] hover:bg-[rgba(255,255,255,0.04)] as-text-muted hover:as-text">
                      <MessageSquare className="w-5 h-5" />
                      Comment
                    </button>
                    <button className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg transition-all font-medium text-[13px] hover:bg-[rgba(255,255,255,0.04)] as-text-muted hover:as-text">
                      <Repeat className="w-5 h-5" />
                      Repost
                    </button>
                    <button className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg transition-all font-medium text-[13px] hover:bg-[rgba(255,255,255,0.04)] as-text-muted hover:as-text">
                      <Bookmark className="w-5 h-5" />
                      Save
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "content" && <ContentTab talent={talent!} profileLiveStreams={profileLiveStreams} profilePosts={profilePosts} profileReels={profileReels} />}


        {activeTab === "about" && <AboutTab talent={talent!} artist={artist} isOwner={isOwner} />}

        {activeTab === "details" && primaryDiscipline && disciplineDetailsData && (
          <div>
            <SectionHeading editSection="discipline_details" isOwner={isOwner}>{DISCIPLINE_LABELS[primaryDiscipline] ?? primaryDiscipline} — Craft Details</SectionHeading>
            <div className="as-surface rounded-lg p-6">
              <DisciplineDetails discipline={primaryDiscipline} data={disciplineDetailsData} />
            </div>
          </div>
        )}

        {activeTab === "credits" && (
          <div>
            <SectionHeading editSection="credits" isOwner={isOwner}>Verified Credits</SectionHeading>
            {talent!.credits?.length > 0 ? (
              <div className="space-y-3">
                {talent!.credits.map((credit, i) => {
                  const title = typeof credit === 'string' ? credit : credit.title;
                  const role = typeof credit === 'string' ? 'Role' : credit.role;
                  const year = typeof credit === 'string' ? '' : credit.year;
                  const verification = creditVerifications.find(v => v.credit_title === title);
                  const verStatus = verification?.status ?? 'SELF_ASSERTED';
                  const barClass = verStatus === 'VERIFIED' ? 'as-verified-bar' : verStatus === 'PENDING' ? 'as-pending-bar' : 'as-self-asserted-bar';
                  return (
                    <div key={i} className={`as-surface p-4 rounded-lg flex items-start gap-4 ${barClass}`}>
                      <div className="w-10 h-10 rounded-full bg-[rgba(255,215,0,0.1)] flex items-center justify-center shrink-0">
                        <FileVideo className="w-5 h-5 as-accent" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-0.5">
                          <h4 className="font-semibold as-text text-sm">{title}</h4>
                          {verStatus === 'VERIFIED' && <span className="text-[10px] font-semibold as-verified-color">✓ Verified</span>}
                          {verStatus === 'PENDING' && <span className="text-[10px] font-semibold text-[#C8A882]">⏳ Pending</span>}
                          {verStatus === 'SELF_ASSERTED' && <span className="text-[10px] as-text-muted">Self-Asserted</span>}
                        </div>
                        <p className="text-xs as-text-muted">{role}{year ? ` · ${year}` : ''}</p>
                        {typeof credit !== 'string' && credit.collaborators && credit.collaborators.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {credit.collaborators.map((c, ci) => (
                              <span key={ci} className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#F0EDE8] border border-[var(--as-border)] as-text-muted">{c}</span>
                            ))}
                          </div>
                        )}
                      </div>
                      {isOwner && verStatus !== 'VERIFIED' && (
                        <button className="as-btn-outline text-xs !py-1.5 !px-3 shrink-0"
                          onClick={() => {
                            apiClient.post<CreditVerification>('/credit-verifications/', { credit_title: title })
                              .then(updated => setCreditVerifications(prev => {
                                const exists = prev.find(v => v.credit_title === updated.credit_title);
                                return exists ? prev.map(v => v.credit_title === updated.credit_title ? updated : v) : [...prev, updated];
                              })).catch(() => {});
                          }}>Verify</button>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : <p className="text-sm as-text-muted">No credits listed yet.</p>}
          </div>
        )}

        {activeTab === "awards" && <AwardsTab talent={talent!} isOwner={isOwner} />}
        {activeTab === "endorsements" && <EndorsementsTab talentId={id} isOwner={isOwner} currentUserId={currentUser?.user_id ?? null} />}

        {activeTab === "jobs" && (
          <div>
            <SectionHeading>Active Applications &amp; Jobs</SectionHeading>
            {applications.length > 0 ? (
              <div className="space-y-3">
                {applications.map(app => (
                  <div key={app.id} className="as-surface p-4 rounded-lg hover:shadow-sm transition-shadow">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="font-semibold as-text text-sm">Application #{app.opportunity}</h4>
                      <Pill>{app.stage}</Pill>
                    </div>
                    <p className="text-sm as-text-muted line-clamp-1">{app.cover_note}</p>
                    <Link
                      href={`/opportunities/${app.opportunity}`}
                      style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "12px", fontWeight: 600, color: "#ffe16d", textDecoration: "none", marginTop: "8px" }}
                      onClick={e => e.stopPropagation()}
                    >
                      View Job →
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 as-text-muted">
                <Briefcase className="w-8 h-8 mx-auto mb-3 opacity-40" />
                <p className="text-sm">No active jobs or applications.</p>
              </div>
            )}
          </div>
        )}
      </>
    );
  }

  // ── TALENT / CINEMATIC PROFILE ──
  if (!isHirerProfile) {
    return (
      <CinematicProfile 
        talent={talent!} 
        isOwner={isOwner}
        currentUser={currentUser}
        connectionStatus={connectionStatus}
        connectionId={connectionId}
        isIncomingConnection={isIncomingConnection}
        connecting={connecting}
        onConnect={handleConnect}
        onAcceptConnection={handleAcceptConnection}
        onRejectConnection={handleRejectConnection}
      >
        <div className="bg-[rgba(22,22,24,0.7)] backdrop-blur-[20px] border border-white/5 p-8 rounded-2xl mt-4">
          {renderTabContent()}
        </div>
      </CinematicProfile>
    );
  }

  // ── HIRER / STUDIO PROFILE ──
  return (
    <div className="artstage">
      {/* COVER */}
      <div className="h-48 md:h-56 w-full bg-gradient-to-br from-[#F0EDE8] via-[#E8E5DE] to-[#DDD8CE] relative overflow-hidden">
        <div className="absolute inset-0 opacity-30" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.2' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.08'/%3E%3C/svg%3E")` }} />
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 -mt-24 relative z-10 pb-16">
        {/* HERO CARD */}
        <div className="as-surface rounded-xl p-6 md:p-8 shadow-sm mb-6">
          <div className="flex flex-col md:flex-row gap-6 md:items-start">
            {/* Avatar */}
            <div className="w-28 h-28 md:w-36 md:h-36 rounded-xl bg-[#F0EDE8] border-4 border-white shadow-lg overflow-hidden shrink-0 -mt-16 md:-mt-20">
              {talent.avatar ? (
                <img src={talent.avatar} alt={talent.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-3xl font-bold as-accent bg-[rgba(255,215,0,0.1)]">
                  {talent.name.substring(0, 2).toUpperCase()}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="as-display text-3xl md:text-4xl font-semibold as-text tracking-tight">{talent.name}</h1>
                {talent.verified && (
                  <span className="inline-flex items-center gap-1 text-xs font-medium as-verified-color bg-[#E8F5EF] px-2 py-0.5 rounded-full">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                  </span>
                )}
                {talent.name_audio_url && (
                  <button onClick={() => { if (audioRef.current) { audioRef.current.currentTime = 0; audioRef.current.play(); } }} className="w-7 h-7 rounded-full border border-[var(--as-border)] bg-[var(--as-surface)] flex items-center justify-center hover:border-[var(--as-accent)] transition-colors" title="Hear name pronunciation">
                    <Volume2 className="w-3.5 h-3.5 as-text-muted" />
                  </button>
                )}
                {talent.name_audio_url && <audio ref={audioRef} src={talent.name_audio_url} />}
              </div>

              <p className="as-text-secondary text-sm mb-2">
                Organization Location: <span className="font-semibold text-gray-900">{talent.location}</span>
                {talent.agency && <span> · {talent.agency}</span>}
              </p>

              <div className="flex flex-wrap items-center gap-4 text-sm as-text-muted mb-4">
                <span className="flex items-center gap-1.5"><Users className="w-4 h-4" /><strong className="as-text">{talent.followers.toLocaleString()}</strong> followers</span>
                <span className="flex items-center gap-1.5"><Star className="w-4 h-4 text-[#C8A882]" /><strong className="as-text">{talent.rating}</strong> rating</span>
                {isOwner && <span className="flex items-center gap-1.5"><Eye className="w-4 h-4" /><strong className="as-text">{talent.views.toLocaleString()}</strong> views</span>}
              </div>

              <p className="text-sm as-text-secondary leading-relaxed mb-4 max-w-2xl">{talent.bio}</p>

              <div className="flex flex-wrap gap-2 mb-4">
                {talent.skills?.map(skill => <Pill key={skill}>{skill}</Pill>)}
                {talent.union_name && <Pill active>{talent.union_name}</Pill>}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col gap-2 shrink-0 items-center">
              {isOwner ? (
                <>
                  <Link href="/profile/edit"><button className="as-btn-outline w-full flex items-center justify-center gap-2"><Pencil className="w-4 h-4" /> Edit Profile</button></Link>
                  <Link href="/verify"><button className="as-btn-outline w-full flex items-center justify-center gap-2"><ShieldCheck className="w-4 h-4" /> Get Verified</button></Link>
                </>
              ) : currentUser ? (
                <>
                  {connectionStatus === 'PENDING' && isIncomingConnection ? (
                    <div className="w-full md:w-auto flex gap-2">
                      <button className="flex-1 rounded-[24px] bg-[#4ade80]/20 text-[#4ade80] border border-[#4ade80]/50 font-bold py-2.5 px-6 flex items-center justify-center gap-2 hover:bg-[#4ade80]/30 transition-colors disabled:opacity-50" onClick={handleAcceptConnection} disabled={connecting}>
                        Accept
                      </button>
                      <button className="flex-1 rounded-[24px] bg-red-500/20 text-red-500 border border-red-500/50 font-bold py-2.5 px-6 flex items-center justify-center gap-2 hover:bg-red-500/30 transition-colors disabled:opacity-50" onClick={handleRejectConnection} disabled={connecting}>
                        Reject
                      </button>
                    </div>
                  ) : (
                    <button className="w-full md:w-auto rounded-[24px] bg-[#a80000] text-white font-bold py-2.5 px-8 flex items-center justify-center gap-2 hover:bg-[#8b0000] transition-colors disabled:opacity-50" onClick={handleConnect} disabled={connecting || connectionStatus !== null || !talent.owner}>
                      {connectionStatus === null && <Plus className="w-5 h-5" />}
                      {connectionStatus === 'ACCEPTED' ? "Connected" : connectionStatus === 'PENDING' ? "Requested" : "Request connection"}
                    </button>
                  )}
                  <button className="w-full md:w-auto rounded-[24px] bg-[var(--as-bg)] text-[var(--as-text)] border-[1.5px] border-[var(--as-border)] font-bold py-2.5 px-8 flex items-center justify-center gap-2 hover:bg-white/5 transition-colors disabled:opacity-50 shadow-sm" onClick={() => talent.owner ? router.push(`/messages/${talent.owner}`) : alert("This talent has not yet claimed their profile.")}>
                    <MessageSquare className="w-5 h-5" /> Message
                  </button>
                </>
              ) : (
                <button className="w-full md:w-auto rounded-[24px] bg-[#a80000] text-white font-bold py-2.5 px-8 flex items-center justify-center gap-2 hover:bg-[#8b0000] transition-colors" onClick={() => router.push('/login')}>
                  Sign in to connect
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Analytics + Tabs */}
        {isOwner && <div className="mb-6"><AnalyticsPanel analytics={analytics} /></div>}
        <div className="as-sticky-tabs mb-8 -mx-4 sm:-mx-6 px-4 sm:px-6">
          <div className="flex gap-6 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`shrink-0 flex items-center gap-1.5 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id ? 'border-[var(--as-accent)] as-accent' : 'border-transparent as-text-muted hover:as-text-secondary hover:border-[var(--as-border)]'}`}
              >
                <tab.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
        {renderTabContent()}
      </div>
    </div>
  );
}

