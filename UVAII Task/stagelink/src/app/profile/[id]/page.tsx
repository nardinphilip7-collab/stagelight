"use client";

import { use, useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api";
import { getUser } from "@/lib/auth";
import Link from "next/link";
import {
  CheckCircle2, MapPin, Users, FileVideo, MessageSquare, Plus, Star, Award,
  Briefcase, Video, ShieldCheck, Pencil, ExternalLink, Film, Scissors,
  Palette, Image as ImageIcon, Headphones, FileText, Tv, Camera,
  Volume2, Globe, Plane, GraduationCap, Wrench, Trophy, Quote, BarChart3,
  TrendingUp, Eye, X, ChevronLeft, ChevronRight, Calendar,
  Ruler, Zap, Package, Heart, BookOpen, MapPinned, ArrowDownToLine, Play,
} from "lucide-react";

/* ═══════════════════════════════ TYPES ════════════════════════════ */
interface Talent {
  id: string;
  owner: number | null;
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
  credits: Array<{ title: string; role: string; year: number } | string>;
  badges: string[];
  reel_url: string | null;
  union_name: string | null;
  social_links: Record<string, string>;
  discipline_data?: Record<string, unknown>;
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
  awards: Array<{ name: string; project?: string; year?: string; festival?: string; award_type?: string }>;
  equipment: string[];
  availability_status: string;
  availability_until: string;
  endorsements: Array<{ author_name: string; author_role: string; author_avatar?: string; text: string }>;
  pinned_post_id: string;
  name_audio_url: string | null;
  languages: string[];
}

interface CreditVerification { id: number; credit_title: string; status: string; }
interface Application { id: string; stage: string; opportunity: string; cover_note: string; }

const GALLERY_IMAGES = [
  "https://images.unsplash.com/photo-1594909122845-11baa439b7bf?q=80&w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1516280440502-a7f45c2690d7?q=80&w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1464375117522-1311d6a5b81f?q=80&w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1503095396549-807759245b35?q=80&w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?q=80&w=1200&auto=format&fit=crop",
];

/* ═══════════════ SHARED UI (ArtStage styled) ═════════════════════ */

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="as-display text-[22px] font-semibold as-text tracking-tight mb-4">
      {children}
    </h3>
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
function LightboxGallery() {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <>
      <div className="grid grid-cols-3 gap-3">
        {GALLERY_IMAGES.map((src, i) => (
          <button key={i} onClick={() => setOpen(i)}
            className="aspect-square overflow-hidden rounded-lg bg-[#F0EDE8] group relative cursor-pointer">
            <img src={src} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
          </button>
        ))}
      </div>
      {open !== null && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setOpen(null)}>
          <button className="absolute top-4 right-4 text-white/60 hover:text-white" onClick={() => setOpen(null)}>
            <X className="w-8 h-8" />
          </button>
          <button className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white"
            onClick={e => { e.stopPropagation(); setOpen(Math.max(0, open - 1)); }}>
            <ChevronLeft className="w-10 h-10" />
          </button>
          <img src={GALLERY_IMAGES[open]} alt="" className="max-h-[85vh] max-w-[85vw] object-contain rounded-lg"
            onClick={e => e.stopPropagation()} />
          <button className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white"
            onClick={e => { e.stopPropagation(); setOpen(Math.min(GALLERY_IMAGES.length - 1, open + 1)); }}>
            <ChevronRight className="w-10 h-10" />
          </button>
          <span className="absolute bottom-6 text-white/40 text-sm">{open + 1} / {GALLERY_IMAGES.length}</span>
        </div>
      )}
    </>
  );
}

/* ═══════════════ ROLE-SPECIFIC PORTFOLIO ════════════════════════ */
const ReelCard = ({ label, subtitle }: { label: string; subtitle?: string }) => (
  <div className="as-surface as-reel-card relative overflow-hidden rounded-lg group cursor-pointer">
    <div className="aspect-video bg-[#1A1A1A] flex items-center justify-center relative">
      <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center group-hover:scale-110 group-hover:bg-white/30 transition-all">
        <Play className="w-6 h-6 text-white ml-0.5" />
      </div>
      <div className="as-reel-overlay absolute inset-0 flex flex-col justify-end p-4">
        <p className="text-white text-sm font-medium">{label}</p>
        {subtitle && <p className="text-white/60 text-xs">{subtitle}</p>}
      </div>
    </div>
  </div>
);

const VideoThumb = ({ label }: { label: string }) => (
  <div className="as-surface as-reel-card relative overflow-hidden rounded-lg group cursor-pointer">
    <div className="aspect-video bg-[#1A1A1A] flex items-center justify-center relative">
      <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center group-hover:scale-110 transition-transform">
        <Play className="w-4 h-4 text-white ml-0.5" />
      </div>
      <span className="absolute bottom-2 left-2 text-[11px] font-medium text-white/90 bg-black/50 px-2 py-0.5 rounded backdrop-blur-sm">{label}</span>
    </div>
  </div>
);

const ActorPortfolio = ({ talent }: { talent: Talent }) => (
  <div className="space-y-10">
    <div>
      <SectionHeading>Showreel</SectionHeading>
      <ReelCard label="Main reel · Auto-plays on visit" subtitle="1:45" />
    </div>
    <div>
      <SectionHeading>Scene Clips</SectionHeading>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <VideoThumb label="Drama scene" />
        <VideoThumb label="Comedy scene" />
        <VideoThumb label="Self-tape" />
      </div>
    </div>
    <div>
      <SectionHeading>Headshots &amp; Gallery</SectionHeading>
      <LightboxGallery />
    </div>
  </div>
);

const DirectorPortfolio = ({ talent }: { talent: Talent }) => (
  <div className="space-y-10">
    <div>
      <SectionHeading>Director's Reel</SectionHeading>
      <ReelCard label="Cinematic style overview" subtitle="2:30" />
    </div>
    <div>
      <SectionHeading>Full Projects</SectionHeading>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <VideoThumb label="Short film · 8 min" />
        <VideoThumb label="Documentary · 12 min" />
      </div>
    </div>
    <div>
      <SectionHeading>Director's Statement</SectionHeading>
      <div className="as-surface p-6 rounded-lg">
        <p className="as-display italic text-[15px] leading-relaxed as-text-secondary">
          "A focus on intimate character studies set against sprawling, brutalist landscapes. My work explores the intersection of human fragility and systemic isolation."
        </p>
      </div>
    </div>
    <div>
      <SectionHeading>Visual Gallery</SectionHeading>
      <LightboxGallery />
    </div>
  </div>
);

const EditorPortfolio = () => (
  <div className="space-y-10">
    <div>
      <SectionHeading>Edit Reel</SectionHeading>
      <ReelCard label="Pacing & rhythm focus" subtitle="2:15" />
    </div>
    <div>
      <SectionHeading>Full Project Samples</SectionHeading>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <VideoThumb label="Drama · 6 min" />
        <VideoThumb label="Doc · 4 min" />
        <VideoThumb label="Trailer cut" />
      </div>
    </div>
    <div>
      <SectionHeading>Software &amp; Skills</SectionHeading>
      <div className="flex flex-wrap gap-2">
        {['Avid Media Composer', 'Premiere Pro', 'DaVinci Resolve', 'Sound design', 'Colour grade'].map(s => (
          <Pill key={s}>{s}</Pill>
        ))}
      </div>
    </div>
  </div>
);

const DesignerPortfolio = () => (
  <div className="space-y-10">
    <div>
      <SectionHeading>Breakdown Reel</SectionHeading>
      <ReelCard label="VFX breakdown · Before / after split-screen" />
    </div>
    <div>
      <SectionHeading>Visual Portfolio</SectionHeading>
      <LightboxGallery />
    </div>
    <div>
      <SectionHeading>Process Case Study</SectionHeading>
      <div className="as-surface p-6 rounded-lg">
        <h4 className="font-semibold as-text mb-1">Desert sequence — Dust &amp; Light (2024)</h4>
        <p className="text-xs as-text-muted uppercase tracking-wider mb-3">Concept → Previs → Final composite</p>
        <p className="text-sm leading-relaxed as-text-secondary">
          Generated massive matte paintings for the background, transitioning into 3D fluid simulations. Rendered with Arnold, composited in Nuke with deep data for atmospheric depth.
        </p>
      </div>
    </div>
  </div>
);

const MusicianPortfolio = () => (
  <div className="space-y-10">
    <div>
      <SectionHeading>Audio Demo</SectionHeading>
      <div className="as-surface rounded-lg divide-y divide-[var(--as-border)]">
        {[{ title: 'Tension suite — drama', time: '2:04' }, { title: 'Orchestral theme — epic', time: '1:48' }, { title: 'Ambient score — doc', time: '2:20' }].map((track, i) => (
          <div key={i} className="flex items-center gap-4 p-4 hover:bg-[#FAF9F6] transition-colors">
            <button className="w-10 h-10 rounded-full as-bg-accent flex items-center justify-center shrink-0 shadow-sm">
              <Play className="w-4 h-4 text-white ml-0.5" />
            </button>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-sm as-text truncate">{track.title}</h4>
              <p className="text-xs as-text-muted">{track.time}</p>
            </div>
            <div className="flex-1 max-w-[180px] h-1.5 bg-[#E8E5DE] rounded-full overflow-hidden hidden sm:block">
              <div className="h-full bg-[var(--as-accent)] rounded-full" style={{ width: i === 0 ? '40%' : '0%' }} />
            </div>
          </div>
        ))}
      </div>
    </div>
    <div>
      <SectionHeading>Sync to Picture</SectionHeading>
      <ReelCard label="Music against scene · Scoring instinct" />
    </div>
  </div>
);

const ProducerPortfolio = ({ talent }: { talent: Talent }) => (
  <div className="space-y-10">
    <div>
      <SectionHeading>About</SectionHeading>
      <div className="as-surface p-6 rounded-lg">
        <p className="text-sm leading-relaxed as-text-secondary">{talent.bio || "Experienced producer bridging Middle Eastern and European funding."}</p>
      </div>
    </div>
    <div>
      <SectionHeading>Production Track Record</SectionHeading>
      <div className="space-y-4">
        {[{ title: "The Waiting Room · 2024", sub: "Feature · Budget $2.4M · Netflix release", tags: ["Lead producer", "Tribeca 2024"] },
          { title: "Gulf Futures · 2023", sub: "Documentary series · MBC · 6 episodes", tags: ["Executive producer"] }].map((p, i) => (
          <div key={i} className="as-surface p-5 rounded-lg hover:shadow-sm transition-shadow">
            <h4 className="font-semibold as-accent text-lg">{p.title}</h4>
            <p className="text-sm as-text-muted mt-1 mb-3">{p.sub}</p>
            <div className="flex gap-2">{p.tags.map(t => <Pill key={t}>{t}</Pill>)}</div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const WriterPortfolio = () => (
  <div className="space-y-10">
    <div>
      <SectionHeading>Writing Samples</SectionHeading>
      <div className="space-y-4">
        {[{ title: "The Bridge — feature script", sub: "Drama · 98 pages · 2024", tags: ["First 10 pages available"], hl: "Blacklist 8/10" },
          { title: "Borders — TV pilot", sub: "Thriller series · 52 pages · 2023", tags: ["Netflix · 6 episodes"], hl: "" }].map((s, i) => (
          <div key={i} className="as-surface p-5 rounded-lg hover:shadow-sm transition-shadow">
            <h4 className="font-semibold as-accent text-lg flex items-center gap-2"><FileText className="w-5 h-5" />{s.title}</h4>
            <p className="text-sm as-text-muted mt-1 mb-3">{s.sub}</p>
            <div className="flex gap-2">
              {s.tags.map(t => <Pill key={t}>{t}</Pill>)}
              {s.hl && <Pill active>{s.hl}</Pill>}
            </div>
          </div>
        ))}
      </div>
    </div>
    <div>
      <SectionHeading>Loglines</SectionHeading>
      <div className="as-surface p-6 rounded-lg space-y-5">
        <div><p className="font-semibold as-text mb-1">The Bridge</p><p className="text-sm as-text-secondary leading-relaxed">When a structural engineer discovers a fatal flaw in the city's newest megaproject, she must choose between exposing the truth and protecting her politically-connected family.</p></div>
        <div className="border-t border-[var(--as-border)] pt-5"><p className="font-semibold as-text mb-1">Night Shift</p><p className="text-sm as-text-secondary leading-relaxed">A graveyard shift radio host begins receiving calls from a serial killer who uses the show to broadcast clues to his next murders.</p></div>
      </div>
    </div>
  </div>
);

const PAPortfolio = ({ talent }: { talent: Talent }) => (
  <div className="space-y-10">
    <div>
      <SectionHeading>About</SectionHeading>
      <div className="as-surface p-6 rounded-lg">
        <p className="text-sm leading-relaxed as-text-secondary">{talent.bio || "Hard-working PA. Known for anticipating needs before they arise."}</p>
      </div>
    </div>
    <div>
      <SectionHeading>Experience</SectionHeading>
      <div className="as-surface rounded-lg divide-y divide-[var(--as-border)]">
        {[{ icon: Film, title: "Set PA — Dust & Light (2024)", sub: "Feature film · 6 weeks" },
          { icon: Tv, title: "Runner — MBC Drama (2023)", sub: "TV series · 3 months" },
          { icon: Camera, title: "Assistant — Ad shoot (2023)", sub: "Commercial · 2 days" }].map((e, i) => (
          <div key={i} className="flex items-center gap-4 p-4">
            <div className="w-10 h-10 rounded-full bg-[#FFF3EF] flex items-center justify-center shrink-0">
              <e.icon className="w-5 h-5 as-accent" />
            </div>
            <div><h4 className="font-semibold text-sm as-text">{e.title}</h4><p className="text-xs as-text-muted">{e.sub}</p></div>
          </div>
        ))}
      </div>
    </div>
    <div>
      <SectionHeading>Skills</SectionHeading>
      <div className="flex flex-wrap gap-2">
        {['Call sheets', 'Walkie operation', 'Script continuity', 'Location support', 'First aid certified'].map(s => (
          <Pill key={s}>{s}</Pill>
        ))}
      </div>
    </div>
  </div>
);

function RoleSpecificPortfolio({ talent }: { talent: Talent }) {
  const cat = talent.category.toLowerCase();
  if (cat.includes('director') || cat.includes('dp')) return <DirectorPortfolio talent={talent} />;
  if (cat.includes('editor')) return <EditorPortfolio />;
  if (cat.includes('designer') || cat.includes('vfx') || cat.includes('art')) return <DesignerPortfolio />;
  if (cat.includes('music') || cat.includes('composer') || cat.includes('sound')) return <MusicianPortfolio />;
  if (cat.includes('producer')) return <ProducerPortfolio talent={talent} />;
  if (cat.includes('writer') || cat.includes('screenwriter')) return <WriterPortfolio />;
  if (cat.includes('pa') || cat.includes('assistant') || cat.includes('runner')) return <PAPortfolio talent={talent} />;
  return <ActorPortfolio talent={talent} />;
}

/* ═══════════════ ABOUT TAB ═══════════════════════════════════════ */
function AboutTab({ talent }: { talent: Talent }) {
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
          <SectionHeading>Physical Stats</SectionHeading>
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
          <SectionHeading>Languages &amp; Accents</SectionHeading>
          <div className="flex flex-wrap gap-2">
            {talent.languages.map(lang => <Pill key={lang}>{lang}</Pill>)}
          </div>
        </div>
      )}

      {/* Availability */}
      <div>
        <SectionHeading>Availability</SectionHeading>
        <div className="as-surface rounded-lg p-5">
          <div className="flex items-center gap-4 flex-wrap">
            <AvailBadge status={talent.availability_status || "Available"} until={talent.availability_until || "Jun – Aug 2025"} />
            <span className="text-sm as-text-secondary">Based in {talent.location}</span>
          </div>
        </div>
      </div>

      {/* Training */}
      <div>
        <SectionHeading>Education &amp; Training</SectionHeading>
        <div className="as-surface rounded-lg divide-y divide-[var(--as-border)]">
          {training.map((t, i) => (
            <div key={i} className="flex items-start gap-4 p-4">
              <div className="w-10 h-10 rounded-full bg-[#FFF3EF] flex items-center justify-center shrink-0 mt-0.5">
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
        <SectionHeading>Travel &amp; Logistics</SectionHeading>
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
                  <span key={c} className="inline-flex items-center gap-1.5 text-sm px-3 py-1 rounded-full border border-[var(--as-border)] bg-white as-text-secondary">
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
          <SectionHeading>Owned Equipment &amp; Gear</SectionHeading>
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
    </div>
  );
}

/* ═══════════════ AWARDS TAB ═════════════════════════════════════ */
function AwardsTab({ talent }: { talent: Talent }) {
  const awards = talent.awards ?? [];
  const winners = awards.filter(a => a.award_type !== 'selection');
  const selections = awards.filter(a => a.award_type === 'selection');

  return (
    <div className="space-y-10">
      {winners.length > 0 && (
        <div>
          <SectionHeading>Awards &amp; Wins</SectionHeading>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {winners.map((award, i) => (
              <div key={i} className="as-surface p-5 rounded-lg hover:shadow-sm transition-shadow as-verified-bar">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#E8F5EF] flex items-center justify-center shrink-0">
                    <Trophy className="w-5 h-5 as-verified-color" />
                  </div>
                  <div>
                    <h4 className="font-semibold as-text">{award.name}</h4>
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
          <SectionHeading>Festival Selections</SectionHeading>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {selections.map((award, i) => (
              <div key={i} className="as-surface p-5 rounded-lg hover:shadow-sm transition-shadow">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#FFF3EF] flex items-center justify-center shrink-0">
                    <Award className="w-5 h-5 as-accent" />
                  </div>
                  <div>
                    <h4 className="font-semibold as-text">{award.name}</h4>
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
function EndorsementsTab({ talent }: { talent: Talent }) {
  const endorsements = talent.endorsements ?? [];
  return (
    <div className="space-y-6">
      <p className="text-sm as-text-muted">{endorsements.length} recommendation{endorsements.length !== 1 ? 's' : ''}</p>
      {endorsements.map((e, i) => (
        <div key={i} className="as-surface p-6 rounded-lg relative">
          <Quote className="absolute top-4 right-5 w-8 h-8 text-[var(--as-border)]" />
          <p className="as-display italic text-[15px] leading-relaxed as-text-secondary mb-5">"{e.text}"</p>
          <div className="flex items-center gap-3 pt-4 border-t border-[var(--as-border)]">
            <div className="w-9 h-9 rounded-full bg-[#FFF3EF] flex items-center justify-center font-semibold as-accent text-sm shrink-0">
              {e.author_name?.charAt(0) ?? '?'}
            </div>
            <div>
              <p className="font-semibold text-sm as-text">{e.author_name}</p>
              <p className="text-xs as-text-muted">{e.author_role}</p>
            </div>
            <span className="ml-auto inline-flex items-center gap-1 text-[11px] font-medium as-verified-color">
              <CheckCircle2 className="w-3.5 h-3.5" /> Verified
            </span>
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
}: {
  talent: Talent;
  profileLiveStreams: any[];
  profilePosts: any[];
}) {
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
              <div key={stream.id} className="as-surface p-4 rounded-lg border border-[var(--as-accent)] relative overflow-hidden group cursor-pointer hover:shadow-md transition-shadow">
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

      {/* Scheduled Lives */}
      <div>
        <SectionHeading>Scheduled Lives</SectionHeading>
        {scheduled.length === 0 ? (
          <p className="text-sm as-text-muted">No scheduled livestreams.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {scheduled.map((stream: any) => {
              const date = new Date(stream.scheduled_for);
              const month = date.toLocaleString('en', { month: 'short' });
              const day = date.getDate();
              const time = date.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' });
              return (
                <div key={stream.id} className="as-surface p-4 rounded-lg flex items-center gap-4 hover:border-[var(--as-border-hover)] transition-colors cursor-pointer">
                  <div className="w-12 h-12 bg-[#FFF3EF] rounded-lg flex flex-col items-center justify-center shrink-0">
                    <span className="text-[10px] font-bold as-accent uppercase">{month}</span>
                    <span className="text-sm font-bold as-text">{day}</span>
                  </div>
                  <div>
                    <h4 className="font-semibold as-text text-sm">{stream.title}</h4>
                    <p className="text-xs as-text-muted mt-1">{time}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Reels */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="as-display text-[22px] font-semibold as-text tracking-tight">Reels</h3>
          <Link href="/reels" className="text-sm font-medium as-accent hover:underline flex items-center gap-1">
            View All <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            "https://images.unsplash.com/photo-1516280440502-a7f45c2690d7?q=80&w=400&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1594909122845-11baa439b7bf?q=80&w=400&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1503095396549-807759245b35?q=80&w=400&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=400&auto=format&fit=crop",
          ].map((src, i) => (
            <div key={i} className="aspect-[9/16] bg-black rounded-lg relative overflow-hidden group cursor-pointer">
              <img src={src} alt="Reel" className="w-full h-full object-cover opacity-70 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="absolute bottom-2 left-2 flex items-center gap-1 text-white text-xs font-medium z-10">
                <Play className="w-3 h-3 fill-white" /> {(1.2 + i).toFixed(1)}k
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Posts */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="as-display text-[22px] font-semibold as-text tracking-tight">Recent Posts</h3>
          <Link href="#" className="text-sm font-medium as-accent hover:underline flex items-center gap-1">
            View All <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        {profilePosts.length === 0 ? (
          <p className="text-sm as-text-muted">No posts yet.</p>
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
          <div key={i} className="bg-[#FAF9F6] rounded-lg p-4 text-center border border-[var(--as-border)]">
            <stat.icon className="w-5 h-5 as-accent mx-auto mb-2" />
            <p className="text-2xl font-bold as-text">{stat.value}</p>
            <p className="text-[10px] as-text-muted mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>
      <div className="bg-[#FAF9F6] rounded-lg p-4 border border-[var(--as-border)]">
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
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(false);
  const [activeTab, setActiveTab] = useState("content");

  useEffect(() => {
    Promise.all([
      apiClient.get<Talent>(`/talents/${id}/`),
      apiClient.get<Application[]>(`/applications/?talent=${id}`),
    ])
      .then(([t, apps]) => {
        setTalent(t);
        setApplications(apps);
        const sessionUser = getUser();
        if (t.owner === sessionUser?.user_id) {
          apiClient.get<{ profile_views: number; submission_count: number; shortlisted_count: number; active_briefs: number; }>('/analytics/dashboard/').then(setAnalytics).catch(() => {});
        }
      })
      .catch(() => router.push('/explore'))
      .finally(() => setLoading(false));
    apiClient.get<CreditVerification[]>(`/credit-verifications/?talent=${id}`).then(setCreditVerifications).catch(() => {});
    apiClient.get<any[]>(`/posts/?artist=${id}`).then(setProfilePosts).catch(() => {});
    apiClient.get<any[]>('/lives/').then((lives: any[]) =>
      setProfileLiveStreams(lives.filter((l: any) => String(l.artist) === String(id)))
    ).catch(() => {});
  }, [id, router]);

  const handleConnect = async () => {
    if (!currentUser) return;
    setConnecting(true);
    try { await apiClient.post('/connections/', { to_user: talent!.owner }); setConnected(true); }
    catch { /* already connected or server error — don't mask as success */ }
    finally { setConnecting(false); }
  };

  if (loading) return (
    <div className="artstage flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <div className="w-12 h-12 rounded-full as-skeleton mx-auto mb-4" />
        <div className="w-48 h-4 as-skeleton mx-auto mb-2" />
        <div className="w-32 h-3 as-skeleton mx-auto" />
      </div>
    </div>
  );
  if (!talent) return null;

  const isOwner = talent.owner === currentUser?.user_id;

  const tabs = [
    { id: "content", label: "Content", icon: Tv },
    { id: "portfolio", label: "Portfolio", icon: FileVideo },
    { id: "about", label: "About", icon: BookOpen },
    { id: "credits", label: "Credits", icon: Star },
    { id: "awards", label: "Awards", icon: Trophy },
    { id: "endorsements", label: "Endorsements", icon: Heart },
    { id: "jobs", label: "Jobs", icon: Briefcase },
  ];

  return (
    <div className="artstage">
      {/* ══════════ COVER ══════════ */}
      <div className="h-48 md:h-56 w-full bg-gradient-to-br from-[#F0EDE8] via-[#E8E5DE] to-[#DDD8CE] relative overflow-hidden">
        <div className="absolute inset-0 opacity-30" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.2' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.08'/%3E%3C/svg%3E")` }} />
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 -mt-24 relative z-10 pb-16">

        {/* ══════════ HERO CARD ══════════ */}
        <div className="as-surface rounded-xl p-6 md:p-8 shadow-sm mb-6">
          <div className="flex flex-col md:flex-row gap-6 md:items-start">
            {/* Avatar */}
            <div className="w-28 h-28 md:w-36 md:h-36 rounded-xl bg-[#F0EDE8] border-4 border-white shadow-lg overflow-hidden shrink-0 -mt-16 md:-mt-20">
              {talent.avatar ? (
                <img src={talent.avatar} alt={talent.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-3xl font-bold as-accent bg-[#FFF3EF]">
                  {talent.name.substring(0, 2).toUpperCase()}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              {/* Name row */}
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="as-display text-3xl md:text-4xl font-semibold as-text tracking-tight">{talent.name}</h1>
                {talent.verified && (
                  <span className="inline-flex items-center gap-1 text-xs font-medium as-verified-color bg-[#E8F5EF] px-2 py-0.5 rounded-full">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                  </span>
                )}
                {talent.name_audio_url && (
                  <button
                    onClick={() => { if (audioRef.current) { audioRef.current.currentTime = 0; audioRef.current.play(); } }}
                    className="w-7 h-7 rounded-full border border-[var(--as-border)] bg-white flex items-center justify-center hover:border-[var(--as-accent)] transition-colors"
                    title="Hear name pronunciation"
                  >
                    <Volume2 className="w-3.5 h-3.5 as-text-muted" />
                  </button>
                )}
                {talent.name_audio_url && <audio ref={audioRef} src={talent.name_audio_url} />}
              </div>

              {/* Role tag */}
              <p className="as-text-secondary text-sm mb-3">
                {talent.category} · {talent.location}
                {talent.agency && <span> · {talent.agency}</span>}
              </p>

              {/* Meta row */}
              <div className="flex flex-wrap items-center gap-4 text-sm as-text-muted mb-4">
                <span className="flex items-center gap-1.5"><Users className="w-4 h-4" /><strong className="as-text">{talent.followers.toLocaleString()}</strong> followers</span>
                <span className="flex items-center gap-1.5"><Star className="w-4 h-4 text-[#C8A882]" /><strong className="as-text">{talent.rating}</strong> rating</span>
                {isOwner && <span className="flex items-center gap-1.5"><Eye className="w-4 h-4" /><strong className="as-text">{talent.views.toLocaleString()}</strong> views</span>}
                <AvailBadge status={talent.availability_status || "Available"} until={talent.availability_until || "Jun – Aug"} />
              </div>

              {/* Bio */}
              <p className="text-sm as-text-secondary leading-relaxed mb-4 max-w-2xl">{talent.bio}</p>

              {/* Skills & badges */}
              <div className="flex flex-wrap gap-2 mb-4">
                {talent.skills?.map(skill => <Pill key={skill}>{skill}</Pill>)}
                {talent.union_name && <Pill active>{talent.union_name}</Pill>}
              </div>

              {/* Social links */}
              {talent.social_links && Object.keys(talent.social_links).length > 0 && (
                <div className="flex flex-wrap gap-2 pt-3 border-t border-[var(--as-border)]">
                  {Object.entries(talent.social_links).map(([platform, url]) =>
                    url ? (
                      <a key={platform} href={url} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-[var(--as-border)] bg-white as-text-secondary hover:border-[var(--as-accent)] hover:as-accent transition-colors capitalize">
                        <ExternalLink className="w-3 h-3" />{platform}
                      </a>
                    ) : null
                  )}
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex flex-col gap-2 shrink-0">
              {isOwner ? (
                <>
                  <Link href="/profile/edit"><button className="as-btn-outline w-full flex items-center justify-center gap-2"><Pencil className="w-4 h-4" /> Edit Profile</button></Link>
                  <Link href="/verify"><button className="as-btn-outline w-full flex items-center justify-center gap-2"><ShieldCheck className="w-4 h-4" /> Get Verified</button></Link>
                </>
              ) : (
                <>
                  <button className="as-btn-primary flex items-center justify-center gap-2" onClick={handleConnect} disabled={connecting || connected}>
                    <Plus className="w-4 h-4" />{connected ? "Requested" : "Connect"}
                  </button>
                  <button className="as-btn-outline flex items-center justify-center gap-2"
                    onClick={() => talent.owner && router.push(`/messages/${talent.owner}`)}>
                    <MessageSquare className="w-4 h-4" /> Message
                  </button>
                  <button className="as-btn-outline flex items-center justify-center gap-2">
                    <ArrowDownToLine className="w-4 h-4" /> Download CV
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ══════════ ANALYTICS (owner-only) ══════════ */}
        {isOwner && <div className="mb-6"><AnalyticsPanel analytics={analytics} /></div>}

        {/* ══════════ TABS ══════════ */}
        <div className="as-sticky-tabs mb-8 -mx-4 sm:-mx-6 px-4 sm:px-6">
          <div className="flex gap-6 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`shrink-0 flex items-center gap-1.5 py-3 text-sm font-medium border-b-2 transition-colors
                  ${activeTab === tab.id
                    ? 'border-[var(--as-accent)] as-accent'
                    : 'border-transparent as-text-muted hover:as-text-secondary hover:border-[var(--as-border)]'
                  }`}
              >
                <tab.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ══════════ TAB CONTENT ══════════ */}
        {activeTab === "content" && <ContentTab talent={talent} profileLiveStreams={profileLiveStreams} profilePosts={profilePosts} />}

        {activeTab === "portfolio" && <RoleSpecificPortfolio talent={talent} />}

        {activeTab === "about" && <AboutTab talent={talent} />}

        {activeTab === "credits" && (
          <div>
            <SectionHeading>Verified Credits</SectionHeading>
            {talent.credits?.length > 0 ? (
              <div className="space-y-3">
                {talent.credits.map((credit, i) => {
                  const title = typeof credit === 'string' ? credit : credit.title;
                  const role = typeof credit === 'string' ? 'Role' : credit.role;
                  const year = typeof credit === 'string' ? '' : credit.year;
                  const verification = creditVerifications.find(v => v.credit_title === title);
                  const verStatus = verification?.status ?? 'SELF_ASSERTED';
                  const barClass = verStatus === 'VERIFIED' ? 'as-verified-bar' : verStatus === 'PENDING' ? 'as-pending-bar' : 'as-self-asserted-bar';
                  return (
                    <div key={i} className={`as-surface p-4 rounded-lg flex items-start gap-4 ${barClass}`}>
                      <div className="w-10 h-10 rounded-full bg-[#FFF3EF] flex items-center justify-center shrink-0">
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

        {activeTab === "awards" && <AwardsTab talent={talent} />}

        {activeTab === "endorsements" && <EndorsementsTab talent={talent} />}

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
      </div>
    </div>
  );
}
