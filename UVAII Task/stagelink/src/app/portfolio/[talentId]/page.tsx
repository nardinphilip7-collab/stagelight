"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiClient } from "@/lib/api";
import { getUser } from "@/lib/auth";
import {
  CheckCircle2, MapPin, Play, ExternalLink, Award, GraduationCap,
  Wrench, Globe, Users, Star, ArrowUpRight, Film, Loader2,
} from "lucide-react";

interface Talent {
  id: string;
  name: string;
  category: string;
  avatar: string;
  verified: boolean;
  location: string;
  bio: string;
  skills: string[];
  credits: Array<{ title: string; role: string; year: number } | string>;
  awards: Array<{ name: string; project?: string; year?: string; festival?: string; url?: string }>;
  training: Array<{ school: string; program: string; year?: string }>;
  equipment: string[];
  languages: string[];
  reel_url: string | null;
  physical_stats: {
    height?: string; weight?: string; hair_color?: string;
    eye_color?: string; age_range?: string; build?: string;
  };
  followers: number;
  views: number;
  availability_status: string;
}

interface Reel {
  id: number;
  title: string;
  thumbnail_url: string | null;
  video_url: string;
}

export default function PortfolioPage({ params }: { params: Promise<{ talentId: string }> }) {
  const { talentId } = use(params);
  const router = useRouter();
  const currentUser = getUser();

  const [talent, setTalent] = useState<Talent | null>(null);
  const [reels, setReels] = useState<Reel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      apiClient.get<Talent>(`/talents/${talentId}/`),
      apiClient.get<Reel[]>(`/reels/?talent=${talentId}`).catch(() => [] as Reel[]),
    ])
      .then(([t, r]) => {
        setTalent(t);
        setReels(r);
        apiClient.post(`/talents/${talentId}/view/`, {}).catch(() => {});
      })
      .catch(() => setError("Portfolio not found or no longer available."))
      .finally(() => setLoading(false));
  }, [talentId]);

  if (loading) {
    return (
      <div className="artstage min-h-screen bg-[var(--as-bg)] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-[#ffd700] mx-auto mb-3" />
          <p className="text-[var(--as-text-muted)] text-sm font-outfit">Loading portfolio…</p>
        </div>
      </div>
    );
  }

  if (error || !talent) {
    return (
      <div className="artstage min-h-screen bg-[var(--as-bg)] flex items-center justify-center">
        <div className="text-center px-8 py-12">
          <p className="text-[var(--as-text-muted)] text-sm mb-5">{error || "Portfolio not found."}</p>
          <button
            onClick={() => router.back()}
            className="px-6 py-2.5 rounded-full bg-[#ffd700] text-[#3a3000] font-outfit font-semibold text-sm hover:brightness-110 transition-all"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const initials = talent.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();
  const creditList = talent.credits.map(c => typeof c === "string" ? { title: c, role: "", year: 0 } : c);
  const hasPhysical = Object.values(talent.physical_stats ?? {}).some(Boolean);

  return (
    <div className="artstage min-h-screen bg-[var(--as-bg)] text-[var(--as-text)]">

      {/* ── Cinematic Banner ── */}
      <div className="relative h-48 overflow-hidden">
        {/* Base gradient matching login left panel */}
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse at 20% 30%, rgba(255,215,0,0.10) 0%, transparent 55%),
              radial-gradient(ellipse at 80% 70%, rgba(225,1,17,0.07) 0%, transparent 50%),
              linear-gradient(160deg, #1c1b1c 0%, #0e0e0f 40%, #131314 70%, #1a1800 100%)
            `,
          }}
        />
        {/* Film-grain texture */}
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
            backgroundSize: '120px 120px',
          }}
        />
        {/* Bottom fade */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#131314]" />
        {/* Spotlight rim */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(255,215,0,0.08) 0%, transparent 60%)' }} />
      </div>

      <div className="max-w-3xl mx-auto px-5 pb-20">

        {/* ── Identity Card ── */}
        <div className="relative -mt-16 mb-6 bg-[var(--as-surface)] border border-white/10 rounded-2xl p-6 shadow-2xl">
          <div className="flex flex-wrap items-start gap-5">

            {/* Avatar */}
            <div className="relative -mt-14 shrink-0">
              <div
                className="w-20 h-20 rounded-2xl border-[3px] border-[#131314] overflow-hidden shadow-xl flex items-center justify-center"
                style={{
                  background: talent.avatar
                    ? undefined
                    : 'linear-gradient(135deg, #ffd700 0%, #e9c400 50%, #1a1800 100%)',
                }}
              >
                {talent.avatar ? (
                  <img src={talent.avatar} alt={talent.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="font-syne font-extrabold text-2xl text-[#131314]">{initials}</span>
                )}
              </div>
              {talent.verified && (
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[var(--as-bg)] flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-[#00dbe8]" />
                </div>
              )}
            </div>

            {/* Name + meta */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="font-syne text-2xl font-bold text-[#fff6df] tracking-tight">{talent.name}</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold font-outfit bg-[#ffd700]/10 text-[#ffd700] border border-[#ffd700]/20">
                  {talent.category}
                </span>
                {talent.availability_status === "Available" && (
                  <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold font-outfit bg-[#006a70]/20 text-[#00dbe8] border border-[#00dbe8]/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00dbe8] animate-pulse" />
                    Available
                  </span>
                )}
              </div>

              {talent.location && (
                <p className="flex items-center gap-1.5 text-sm text-[var(--as-text-muted)] font-outfit mb-3">
                  <MapPin className="w-3.5 h-3.5" /> {talent.location}
                </p>
              )}

              <div className="flex flex-wrap gap-2">
                <Link href={`/profile/${talent.id}`}>
                  <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#ffd700] text-[#3a3000] font-outfit font-semibold text-sm hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-[#ffd700]/20">
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    Full Profile
                  </button>
                </Link>
                {currentUser && (
                  <Link href={`/messages/${talent.id}`}>
                    <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-white/10 text-[#d0c6ab] font-outfit font-semibold text-sm hover:bg-white/5 hover:border-white/20 transition-all">
                      Contact
                    </button>
                  </Link>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="flex gap-6 shrink-0 self-center">
              <div className="text-center">
                <p className="font-syne font-bold text-xl text-[#ffd700]">{talent.followers.toLocaleString()}</p>
                <p className="font-outfit text-[10px] text-[var(--as-text-muted)] uppercase tracking-widest mt-0.5">Followers</p>
              </div>
              <div className="text-center">
                <p className="font-syne font-bold text-xl text-[var(--as-text)]">{talent.views.toLocaleString()}</p>
                <p className="font-outfit text-[10px] text-[var(--as-text-muted)] uppercase tracking-widest mt-0.5">Views</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Bio ── */}
        {talent.bio && (
          <Section title="About">
            <p className="text-sm text-[#d0c6ab] font-outfit leading-relaxed">{talent.bio}</p>
          </Section>
        )}

        {/* ── Skills ── */}
        {talent.skills?.length > 0 && (
          <Section title="Skills">
            <div className="flex flex-wrap gap-2">
              {talent.skills.map((s, i) => (
                <span key={i} className="px-3 py-1.5 rounded-xl bg-[var(--as-bg)] border border-white/8 text-[13px] font-outfit text-[#d0c6ab] font-medium hover:border-[#ffd700]/30 hover:text-[var(--as-text)] transition-colors">
                  {s}
                </span>
              ))}
            </div>
          </Section>
        )}

        {/* ── Featured Reel / Reels ── */}
        {(talent.reel_url || reels.length > 0) && (
          <Section title="Reels" icon={<Film className="w-4 h-4" />}>
            {talent.reel_url && (
              <div className="aspect-video bg-black rounded-xl overflow-hidden mb-4 shadow-xl shadow-black/40">
                <iframe src={talent.reel_url} className="w-full h-full border-none" allowFullScreen title="Featured reel" />
              </div>
            )}
            {reels.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {reels.map(reel => (
                  <a key={reel.id} href={reel.video_url} target="_blank" rel="noreferrer" className="group relative block rounded-xl overflow-hidden aspect-[9/16] bg-[#0e0e0f] border border-white/5 hover:border-[#ffd700]/30 transition-colors shadow-lg">
                    {reel.thumbnail_url ? (
                      <img src={reel.thumbnail_url} alt={reel.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500" />
                    ) : (
                      <div
                        className="w-full h-full flex items-center justify-center"
                        style={{ background: 'radial-gradient(ellipse at 30% 30%, rgba(255,215,0,0.07) 0%, transparent 60%), linear-gradient(160deg, #1c1b1c, #0e0e0f)' }}
                      >
                        <Play className="w-8 h-8 text-[#ffd700]/50 group-hover:text-[#ffd700] transition-colors" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <p className="text-xs font-semibold font-outfit text-white truncate drop-shadow">{reel.title}</p>
                    </div>
                    <div className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Play className="w-3.5 h-3.5 text-white" fill="currentColor" />
                    </div>
                  </a>
                ))}
              </div>
            )}
          </Section>
        )}

        {/* ── Credits ── */}
        {creditList.length > 0 && (
          <Section title="Credits">
            <div className="flex flex-col gap-2">
              {creditList.map((c, i) => (
                <div key={i} className="flex items-center justify-between px-4 py-3 rounded-xl bg-[var(--as-bg)] border border-white/5 hover:border-[#ffd700]/20 transition-colors group">
                  <div>
                    <p className="font-semibold text-sm text-[var(--as-text)] font-outfit group-hover:text-[#fff6df] transition-colors">{c.title}</p>
                    {c.role && <p className="text-xs text-[var(--as-text-muted)] font-outfit mt-0.5">{c.role}</p>}
                  </div>
                  {c.year > 0 && (
                    <span className="text-xs font-semibold font-outfit text-[var(--as-text-muted)] bg-[#201f20] px-2 py-1 rounded-lg">{c.year}</span>
                  )}
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* ── Awards ── */}
        {talent.awards?.length > 0 && (
          <Section title="Awards & Recognition" icon={<Award className="w-4 h-4" />}>
            <div className="flex flex-col gap-2">
              {talent.awards.map((a, i) => (
                <div key={i} className="flex items-start gap-3 px-4 py-3 rounded-xl bg-[var(--as-bg)] border border-white/5 hover:border-[#ffd700]/20 transition-colors">
                  <Star className="w-4 h-4 text-[#ffd700] shrink-0 mt-0.5" fill="currentColor" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-sm text-[var(--as-text)] font-outfit">{a.name}</p>
                      {a.url && (
                        <a href={a.url} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} className="hover:opacity-70 transition-opacity">
                          <ExternalLink className="w-3 h-3 text-[#ffd700]" />
                        </a>
                      )}
                    </div>
                    {(a.project || a.festival) && (
                      <p className="text-xs text-[var(--as-text-muted)] font-outfit mt-1">
                        {[a.project, a.festival, a.year].filter(Boolean).join(" · ")}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* ── Training ── */}
        {talent.training?.length > 0 && (
          <Section title="Training & Education" icon={<GraduationCap className="w-4 h-4" />}>
            <div className="flex flex-col gap-2">
              {talent.training.map((t, i) => (
                <div key={i} className="flex items-center justify-between px-4 py-3 rounded-xl bg-[var(--as-bg)] border border-white/5 hover:border-[#ffd700]/20 transition-colors group">
                  <div>
                    <p className="font-semibold text-sm text-[var(--as-text)] font-outfit group-hover:text-[#fff6df] transition-colors">{t.school}</p>
                    <p className="text-xs text-[var(--as-text-muted)] font-outfit mt-0.5">{t.program}</p>
                  </div>
                  {t.year && <span className="text-xs font-semibold font-outfit text-[var(--as-text-muted)] bg-[#201f20] px-2 py-1 rounded-lg">{t.year}</span>}
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* ── Equipment ── */}
        {talent.equipment?.length > 0 && (
          <Section title="Equipment" icon={<Wrench className="w-4 h-4" />}>
            <div className="flex flex-wrap gap-2">
              {talent.equipment.map((e, i) => (
                <span key={i} className="px-3 py-1.5 rounded-xl bg-[var(--as-bg)] border border-white/8 text-[13px] font-outfit text-[#d0c6ab] font-medium hover:border-[#ffd700]/30 transition-colors">
                  {e}
                </span>
              ))}
            </div>
          </Section>
        )}

        {/* ── Languages + Physical ── */}
        {(talent.languages?.length > 0 || hasPhysical) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            {talent.languages?.length > 0 && (
              <div className="bg-[var(--as-surface)] border border-white/10 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Globe className="w-4 h-4 text-[#ffd700]" />
                  <h3 className="text-[11px] font-bold font-outfit uppercase tracking-widest text-[var(--as-text-muted)]">Languages</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {talent.languages.map((l, i) => (
                    <span key={i} className="px-3 py-1 rounded-xl bg-[var(--as-bg)] border border-white/8 text-[13px] font-outfit text-[#d0c6ab]">{l}</span>
                  ))}
                </div>
              </div>
            )}
            {hasPhysical && (
              <div className="bg-[var(--as-surface)] border border-white/10 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Users className="w-4 h-4 text-[#ffd700]" />
                  <h3 className="text-[11px] font-bold font-outfit uppercase tracking-widest text-[var(--as-text-muted)]">Physical Stats</h3>
                </div>
                <div className="flex flex-col gap-2">
                  {Object.entries(talent.physical_stats).filter(([, v]) => v).map(([k, v]) => (
                    <div key={k} className="flex justify-between items-center">
                      <span className="text-xs text-[var(--as-text-muted)] font-outfit capitalize">{k.replace("_", " ")}</span>
                      <span className="text-xs font-semibold font-outfit text-[var(--as-text)]">{v as string}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-[var(--as-surface)] border border-white/10 rounded-2xl p-5 mb-4">
      <div className="flex items-center gap-2 mb-4">
        {icon && <span className="text-[#ffd700]">{icon}</span>}
        <h2 className="text-[11px] font-bold font-outfit uppercase tracking-widest text-[var(--as-text-muted)]">{title}</h2>
        <div className="flex-1 h-px bg-white/5 ml-2" />
      </div>
      {children}
    </div>
  );
}
