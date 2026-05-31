"use client";

import { useEffect, useState, useRef, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { apiClient } from "@/lib/api";
import { getUser } from "@/lib/auth";
import {
  Search, Users, Briefcase, MapPin, Loader2, Star, ChevronRight,
  Filter, X, CheckCircle2, SlidersHorizontal, Clock, Bookmark,
  BookmarkCheck, Bell, BellOff, Film, Trash2, History, Shield,
  Music, Mic, Drama, Plus, BookOpen, Building2,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Talent {
  id: string; name: string; category: string; avatar: string;
  location: string; verified: boolean; rating: number;
  union_name?: string; availability_status?: string;
}

interface Opportunity {
  id: string; title: string; company: string; company_logo: string;
  type: string; location: string; compensation: string; deadline: string; category: string;
}

interface HirerResult {
  id: number; name: string; email: string; role: string; date_joined: string;
}

interface ReelResult {
  id: number; title: string; type: string; description: string;
  thumbnail_url: string; talent_id: string; talent_name: string; talent_avatar: string;
}

interface ArtistFilters {
  discipline: string; location: string; radius: string; travelWilling: boolean;
  union: string; training: string; verified: boolean; available: boolean;
  disciplines: string[];
}

interface BriefFilters {
  discipline: string; roleType: string; payRange: string;
  location: string; union: string; deadline: string;
}

interface ContentFilters { type: string; title: string; }

interface SavedSearch {
  id: string; name: string; query: string;
  tab: "all" | "artists" | "briefs" | "content" | "studios";
  artistFilters: ArtistFilters; briefFilters: BriefFilters; contentFilters: ContentFilters;
  notification: "none" | "daily" | "hourly" | "instant";
  createdAt: string;
}

interface TypeaheadResults {
  talents: Talent[]; opportunities: Opportunity[]; reels: ReelResult[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DISCIPLINES = [
  { value: "actor", label: "Actor" },
  { value: "singer", label: "Singer" },
  { value: "dancer", label: "Dancer" },
  { value: "musician", label: "Musician" },
  { value: "voice_actor", label: "Voice Actor" },
  { value: "comedian", label: "Comedian" },
  { value: "presenter", label: "Presenter" },
  { value: "director", label: "Director" },
];

const RADIUS_OPTIONS = [
  { value: "", label: "Any radius" },
  { value: "10", label: "10 mi" },
  { value: "25", label: "25 mi" },
  { value: "50", label: "50 mi" },
  { value: "100", label: "100 mi" },
  { value: "200", label: "200 mi" },
];

const DEADLINE_OPTIONS = [
  { value: "", label: "Any" },
  { value: "this week", label: "This week" },
  { value: "this month", label: "This month" },
  { value: "rolling", label: "Rolling" },
];

const CONTENT_TYPES = [
  { value: "", label: "All types" },
  { value: "song", label: "Song" },
  { value: "monologue", label: "Monologue" },
  { value: "dance", label: "Dance" },
  { value: "voice_demo", label: "Voice Demo" },
  { value: "comedy", label: "Comedy" },
  { value: "reel", label: "Showreel" },
  { value: "cover", label: "Cover" },
];

const EMPTY_ARTIST: ArtistFilters = {
  discipline: "", location: "", radius: "", travelWilling: false,
  union: "", training: "", verified: false, available: false, disciplines: [],
};
const EMPTY_BRIEF: BriefFilters = {
  discipline: "", roleType: "", payRange: "", location: "", union: "", deadline: "",
};
const EMPTY_CONTENT: ContentFilters = { type: "", title: "" };

// ─── localStorage helpers ─────────────────────────────────────────────────────

function loadLS<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
  catch { return fallback; }
}
function saveLS(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

// ─── Filter active counts ─────────────────────────────────────────────────────

function artistCount(f: ArtistFilters) {
  return [f.discipline, f.location, f.union, f.training].filter(Boolean).length +
    f.disciplines.length + (f.verified ? 1 : 0) + (f.available ? 1 : 0) + (f.travelWilling ? 1 : 0);
}
function briefCount(f: BriefFilters) {
  return Object.values(f).filter(Boolean).length;
}
function contentCount(f: ContentFilters) {
  return Object.values(f).filter(Boolean).length;
}

// ─── URL builders ─────────────────────────────────────────────────────────────

function talentUrl(q: string, f: ArtistFilters) {
  const p = new URLSearchParams();
  const disciplineList = f.disciplines.length ? f.disciplines : f.discipline ? [f.discipline] : [];
  const terms = [q, f.training].filter(Boolean).join(" ");
  if (terms) p.set("search", terms);
  if (disciplineList.length === 1) p.set("discipline", disciplineList[0]);
  if (f.location) p.set("location", f.location);
  if (f.union) p.set("union", f.union);
  if (f.verified) p.set("verified", "true");
  if (f.available) p.set("available", "true");
  return `/talents/?${p}`;
}

function briefUrl(q: string, f: BriefFilters) {
  const p = new URLSearchParams();
  if (q) p.set("search", q);
  if (f.discipline) p.set("category", f.discipline);
  if (f.roleType) p.set("role_type", f.roleType);
  if (f.payRange) p.set("pay_range", f.payRange);
  if (f.location) p.set("location", f.location);
  if (f.union) p.set("union", f.union);
  if (f.deadline) p.set("deadline", f.deadline);
  return `/opportunities/?${p}`;
}

function contentUrl(q: string, f: ContentFilters) {
  const p = new URLSearchParams();
  const term = [q, f.title].filter(Boolean).join(" ");
  if (term) p.set("search", term);
  if (f.type) p.set("type", f.type);
  return `/reels/?${p}`;
}

// ─── Toggle component ─────────────────────────────────────────────────────────

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      className={`w-10 h-5 rounded-full transition-colors relative shrink-0 ${on ? "bg-[var(--as-accent)]" : "bg-[var(--as-border)]"}`}
    >
      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-[var(--as-surface)] shadow transition-transform ${on ? "translate-x-5" : "translate-x-0.5"}`} />
    </button>
  );
}

// ─── Filter sidebars ──────────────────────────────────────────────────────────

const labelCls = "block text-[11px] font-bold uppercase tracking-wide text-[var(--as-text-muted)] mb-1.5";
const inputCls = "w-full px-3 py-2 rounded-xl border border-[var(--as-border)] bg-[var(--as-bg)] text-sm text-[var(--as-text)] outline-none focus:border-[var(--as-accent)] transition-colors";

function ArtistFilterSidebar({
  f, onChange, onClear,
}: { f: ArtistFilters; onChange: (f: ArtistFilters) => void; onClear: () => void }) {
  const count = artistCount(f);
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <span className="font-bold text-[var(--as-text)] flex items-center gap-2 text-sm">
          <SlidersHorizontal className="w-4 h-4 text-[var(--as-accent)]" />
          Artist Filters
          {count > 0 && <span className="bg-[var(--as-accent)] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{count}</span>}
        </span>
        {count > 0 && <button onClick={onClear} className="text-xs text-[var(--as-accent)] hover:underline font-semibold">Clear</button>}
      </div>

      {/* Discipline multi-select */}
      <div>
        <label className={labelCls}>Disciplines</label>
        <div className="flex flex-wrap gap-1.5">
          {DISCIPLINES.map(d => {
            const active = f.disciplines.includes(d.value);
            return (
              <button
                key={d.value}
                type="button"
                onClick={() => {
                  const next = active ? f.disciplines.filter(v => v !== d.value) : [...f.disciplines, d.value];
                  onChange({ ...f, disciplines: next, discipline: next.length === 1 ? next[0] : "" });
                }}
                className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all ${active ? "bg-[var(--as-accent)] text-white border-[var(--as-accent)]" : "border-[var(--as-border)] text-[var(--as-text-muted)] hover:border-[var(--as-accent)] hover:text-[var(--as-accent)]"}`}
              >
                {d.label}
              </button>
            );
          })}
        </div>
        <p className="text-[10px] text-[var(--as-text-muted)] mt-1.5">Select multiple to match any discipline</p>
      </div>

      {/* Location + radius */}
      <div>
        <label className={labelCls}>Location</label>
        <input type="text" value={f.location} onChange={e => onChange({ ...f, location: e.target.value })}
          placeholder="City, region…" className={inputCls} />
        {f.location && (
          <select value={f.radius} onChange={e => onChange({ ...f, radius: e.target.value })}
            className={`${inputCls} mt-2`}>
            {RADIUS_OPTIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        )}
      </div>

      {/* Union */}
      <div>
        <label className={labelCls}>Union / Guild</label>
        <input type="text" value={f.union} onChange={e => onChange({ ...f, union: e.target.value })}
          placeholder="SAG-AFTRA, Equity…" className={inputCls} />
      </div>

      {/* Training */}
      <div>
        <label className={labelCls}>Training / School</label>
        <input type="text" value={f.training} onChange={e => onChange({ ...f, training: e.target.value })}
          placeholder="RADA, Juilliard…" className={inputCls} />
      </div>

      {/* Toggles */}
      <div className="space-y-3 pt-1 border-t border-[var(--as-border)]">
        {[
          { key: "verified" as const, label: "Verified only" },
          { key: "available" as const, label: "Available now" },
          { key: "travelWilling" as const, label: "Willing to travel" },
        ].map(({ key, label }) => (
          <label key={key} className="flex items-center gap-3 cursor-pointer group">
            <Toggle on={f[key]} onChange={v => onChange({ ...f, [key]: v })} />
            <span className="text-sm text-[var(--as-text)] font-medium group-hover:text-[var(--as-accent)] transition-colors">{label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

function BriefFilterSidebar({
  f, onChange, onClear,
}: { f: BriefFilters; onChange: (f: BriefFilters) => void; onClear: () => void }) {
  const count = briefCount(f);
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <span className="font-bold text-[var(--as-text)] flex items-center gap-2 text-sm">
          <SlidersHorizontal className="w-4 h-4 text-[var(--as-accent)]" />
          Brief Filters
          {count > 0 && <span className="bg-[var(--as-accent)] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{count}</span>}
        </span>
        {count > 0 && <button onClick={onClear} className="text-xs text-[var(--as-accent)] hover:underline font-semibold">Clear</button>}
      </div>

      <div>
        <label className={labelCls}>Discipline</label>
        <select value={f.discipline} onChange={e => onChange({ ...f, discipline: e.target.value })} className={inputCls}>
          <option value="">Any discipline</option>
          {DISCIPLINES.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
        </select>
      </div>

      <div>
        <label className={labelCls}>Role Type</label>
        <input type="text" value={f.roleType} onChange={e => onChange({ ...f, roleType: e.target.value })}
          placeholder="Lead, Supporting, Extra…" className={inputCls} />
      </div>

      <div>
        <label className={labelCls}>Pay Range</label>
        <input type="text" value={f.payRange} onChange={e => onChange({ ...f, payRange: e.target.value })}
          placeholder="e.g. 500, union scale…" className={inputCls} />
      </div>

      <div>
        <label className={labelCls}>Location</label>
        <input type="text" value={f.location} onChange={e => onChange({ ...f, location: e.target.value })}
          placeholder="City, region…" className={inputCls} />
      </div>

      <div>
        <label className={labelCls}>Union / Guild</label>
        <input type="text" value={f.union} onChange={e => onChange({ ...f, union: e.target.value })}
          placeholder="SAG-AFTRA, Equity…" className={inputCls} />
      </div>

      <div>
        <label className={labelCls}>Deadline</label>
        <select value={f.deadline} onChange={e => onChange({ ...f, deadline: e.target.value })} className={inputCls}>
          {DEADLINE_OPTIONS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
        </select>
      </div>
    </div>
  );
}

function ContentFilterSidebar({
  f, onChange, onClear,
}: { f: ContentFilters; onChange: (f: ContentFilters) => void; onClear: () => void }) {
  const count = contentCount(f);
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <span className="font-bold text-[var(--as-text)] flex items-center gap-2 text-sm">
          <SlidersHorizontal className="w-4 h-4 text-[var(--as-accent)]" />
          Content Filters
          {count > 0 && <span className="bg-[var(--as-accent)] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{count}</span>}
        </span>
        {count > 0 && <button onClick={onClear} className="text-xs text-[var(--as-accent)] hover:underline font-semibold">Clear</button>}
      </div>

      <div>
        <label className={labelCls}>Content Type</label>
        <select value={f.type} onChange={e => onChange({ ...f, type: e.target.value })} className={inputCls}>
          {CONTENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </div>

      <div>
        <label className={labelCls}>Title / Keywords</label>
        <input type="text" value={f.title} onChange={e => onChange({ ...f, title: e.target.value })}
          placeholder="Song title, scene, monologue…" className={inputCls} />
        <p className="text-[10px] text-[var(--as-text-muted)] mt-1.5">Searches titles, transcriptions, and descriptions</p>
      </div>
    </div>
  );
}

// ─── Save Search Panel ────────────────────────────────────────────────────────

function SavedSearchesPanel({
  savedSearches, onLoad, onDelete, onUpdateNotification, onClose,
}: {
  savedSearches: SavedSearch[];
  onLoad: (s: SavedSearch) => void;
  onDelete: (id: string) => void;
  onUpdateNotification: (id: string, n: SavedSearch["notification"]) => void;
  onClose: () => void;
}) {
  const notifLabels: Record<SavedSearch["notification"], string> = {
    none: "No alerts", daily: "Daily", hourly: "Hourly", instant: "Instant",
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative ml-auto w-80 h-full bg-[var(--as-surface)] shadow-2xl flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-[var(--as-border)]">
          <span className="font-bold text-[var(--as-text)] flex items-center gap-2">
            <Bookmark className="w-4 h-4 text-[var(--as-accent)]" />
            Saved Searches
          </span>
          <button onClick={onClose}><X className="w-5 h-5 text-[var(--as-text-muted)]" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {savedSearches.length === 0 ? (
            <div className="text-center py-12">
              <Bookmark className="w-10 h-10 text-[var(--as-text-muted)] opacity-30 mx-auto mb-3" />
              <p className="text-sm text-[var(--as-text-muted)]">No saved searches yet.</p>
              <p className="text-xs text-[var(--as-text-muted)] mt-1">Use the sidebar to save a search.</p>
            </div>
          ) : savedSearches.map(s => (
            <div key={s.id} className="bg-[var(--as-bg)] border border-[var(--as-border)] rounded-xl p-3">
              <div className="flex items-start justify-between gap-2 mb-2">
                <button onClick={() => { onLoad(s); onClose(); }}
                  className="text-sm font-semibold text-[var(--as-text)] hover:text-[var(--as-accent)] transition-colors text-left leading-tight">
                  {s.name}
                </button>
                <button onClick={() => onDelete(s.id)} className="shrink-0 text-[var(--as-text-muted)] hover:text-red-500 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              {s.query && <p className="text-xs text-[var(--as-text-muted)] mb-2">"{s.query}"</p>}
              <div className="flex items-center gap-2">
                <Bell className="w-3 h-3 text-[var(--as-text-muted)] shrink-0" />
                <select
                  value={s.notification}
                  onChange={e => onUpdateNotification(s.id, e.target.value as SavedSearch["notification"])}
                  className="text-[11px] border border-[var(--as-border)] rounded-lg px-1.5 py-0.5 bg-[var(--as-surface)] text-[var(--as-text)] outline-none"
                >
                  {(["none", "instant", "hourly", "daily"] as const).map(n => (
                    <option key={n} value={n}>{notifLabels[n]}</option>
                  ))}
                </select>
                <span className="text-[10px] text-[var(--as-text-muted)] capitalize">{s.tab}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Save Search Inline Form ──────────────────────────────────────────────────

function SaveSearchForm({
  onSave, onCancel,
}: { onSave: (name: string, notif: SavedSearch["notification"]) => void; onCancel: () => void }) {
  const [name, setName] = useState("");
  const [notif, setNotif] = useState<SavedSearch["notification"]>("none");
  return (
    <div className="mt-4 p-4 bg-[var(--as-bg)] border border-[var(--as-border)] rounded-xl space-y-3">
      <p className="text-xs font-bold text-[var(--as-text)] uppercase tracking-wide">Save this search</p>
      <input
        type="text" value={name} onChange={e => setName(e.target.value)}
        placeholder="Name this search…" autoFocus
        className={inputCls}
      />
      <div>
        <label className={labelCls}>New match alerts</label>
        <select value={notif} onChange={e => setNotif(e.target.value as SavedSearch["notification"])} className={inputCls}>
          <option value="none">No alerts</option>
          <option value="instant">Instant</option>
          <option value="hourly">Hourly digest</option>
          <option value="daily">Daily digest</option>
        </select>
      </div>
      <div className="flex gap-2">
        <button onClick={() => name.trim() && onSave(name.trim(), notif)}
          className="flex-1 py-2 rounded-xl bg-[var(--as-accent)] text-white text-sm font-bold hover:shadow-md transition-all disabled:opacity-50"
          disabled={!name.trim()}>
          Save
        </button>
        <button onClick={onCancel}
          className="px-3 py-2 rounded-xl border border-[var(--as-border)] text-sm text-[var(--as-text-muted)] hover:border-[var(--as-accent)] transition-all">
          Cancel
        </button>
      </div>
    </div>
  );
}

// ─── Content type icon helper ─────────────────────────────────────────────────

function ContentTypeIcon({ type }: { type: string }) {
  const icons: Record<string, React.ReactNode> = {
    song: <Music className="w-4 h-4" />,
    monologue: <BookOpen className="w-4 h-4" />,
    voice_demo: <Mic className="w-4 h-4" />,
    comedy: <Drama className="w-4 h-4" />,
  };
  return <>{icons[type] || <Film className="w-4 h-4" />}</>;
}

// ─── Main Search Component ────────────────────────────────────────────────────

function SearchResults() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQuery = searchParams.get("q") || "";

  // Committed query (drives API calls)
  const [query, setQuery] = useState(initialQuery);
  // Input value (typeahead)
  const [inputValue, setInputValue] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState<"all" | "artists" | "briefs" | "content" | "studios">("all");

  // Filters per tab
  const [artistFilters, setArtistFilters] = useState<ArtistFilters>(EMPTY_ARTIST);
  const [briefFilters, setBriefFilters] = useState<BriefFilters>(EMPTY_BRIEF);
  const [contentFilters, setContentFilters] = useState<ContentFilters>(EMPTY_CONTENT);

  // Results
  const [talents, setTalents] = useState<Talent[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [reels, setReels] = useState<ReelResult[]>([]);
  const [hirers, setHirers] = useState<HirerResult[]>([]);
  const [loading, setLoading] = useState(false);

  // Typeahead
  const [typeahead, setTypeahead] = useState<TypeaheadResults>({ talents: [], opportunities: [], reels: [] });
  const [typeaheadLoading, setTypeaheadLoading] = useState(false);
  const [showTypeahead, setShowTypeahead] = useState(false);
  const typeaheadTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const typeaheadRef = useRef<HTMLDivElement>(null);

  // Recent searches (localStorage)
  const [recentSearches, setRecentSearches] = useState<string[]>(() =>
    loadLS<string[]>("sl_recent_searches", [])
  );
  // Saved searches (localStorage)
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>(() =>
    loadLS<SavedSearch[]>("sl_saved_searches", [])
  );
  const [showSavedPanel, setShowSavedPanel] = useState(false);
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);

  useEffect(() => {
    if (!getUser()) { router.replace("/login"); return; }
  }, [router]);

  // Close typeahead on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (
        inputRef.current && !inputRef.current.contains(e.target as Node) &&
        typeaheadRef.current && !typeaheadRef.current.contains(e.target as Node)
      ) setShowTypeahead(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  // Typeahead debounce
  useEffect(() => {
    if (typeaheadTimer.current) clearTimeout(typeaheadTimer.current);
    if (inputValue.length < 2) { setTypeahead({ talents: [], opportunities: [], reels: [] }); return; }
    typeaheadTimer.current = setTimeout(async () => {
      setTypeaheadLoading(true);
      try {
        const [t, o, r] = await Promise.all([
          apiClient.get<Talent[]>(`/talents/?search=${encodeURIComponent(inputValue)}`),
          apiClient.get<Opportunity[]>(`/opportunities/?search=${encodeURIComponent(inputValue)}`),
          apiClient.get<ReelResult[]>(`/reels/?search=${encodeURIComponent(inputValue)}`),
        ]);
        setTypeahead({ talents: t.slice(0, 3), opportunities: o.slice(0, 3), reels: r.slice(0, 3) });
      } catch { setTypeahead({ talents: [], opportunities: [], reels: [] }); }
      finally { setTypeaheadLoading(false); }
    }, 300);
    return () => { if (typeaheadTimer.current) clearTimeout(typeaheadTimer.current); };
  }, [inputValue]);

  // Main search effect
  useEffect(() => {
    const hasActivity = !!query || artistCount(artistFilters) > 0 || briefCount(briefFilters) > 0 || contentCount(contentFilters) > 0;
    if (!hasActivity) { setTalents([]); setOpportunities([]); setReels([]); return; }

    setLoading(true);
    const fetchArtists = (activeTab === "all" || activeTab === "artists")
      ? apiClient.get<Talent[]>(talentUrl(query, artistFilters)) : Promise.resolve<Talent[]>([]);
    const fetchBriefs = (activeTab === "all" || activeTab === "briefs")
      ? apiClient.get<Opportunity[]>(briefUrl(query, briefFilters)) : Promise.resolve<Opportunity[]>([]);
    const fetchContent = (activeTab === "all" || activeTab === "content")
      ? apiClient.get<ReelResult[]>(contentUrl(query, contentFilters)) : Promise.resolve<ReelResult[]>([]);
    const fetchHirers = (activeTab === "all" || activeTab === "studios")
      ? apiClient.get<HirerResult[]>(`/hirers/${query ? `?search=${encodeURIComponent(query)}` : ""}`) : Promise.resolve<HirerResult[]>([]);

    Promise.all([fetchArtists, fetchBriefs, fetchContent, fetchHirers])
      .then(([t, o, r, h]) => { setTalents(t); setOpportunities(o); setReels(r); setHirers(h); })
      .catch(() => { setTalents([]); setOpportunities([]); setReels([]); setHirers([]); })
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, artistFilters, briefFilters, contentFilters, activeTab]);

  const handleSearch = useCallback((term: string) => {
    const q = term.trim();
    if (!q) return;
    setQuery(q);
    setInputValue(q);
    setShowTypeahead(false);
    router.push(`/search?q=${encodeURIComponent(q)}`);
    // Add to recent searches
    const next = [q, ...recentSearches.filter(r => r !== q)].slice(0, 8);
    setRecentSearches(next);
    saveLS("sl_recent_searches", next);
  }, [recentSearches, router]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(inputValue);
  };

  const clearHistory = () => {
    setRecentSearches([]);
    saveLS("sl_recent_searches", []);
  };

  const saveCurrentSearch = (name: string, notification: SavedSearch["notification"]) => {
    const s: SavedSearch = {
      id: Date.now().toString(),
      name, query, tab: activeTab,
      artistFilters, briefFilters, contentFilters,
      notification, createdAt: new Date().toISOString(),
    };
    const next = [s, ...savedSearches];
    setSavedSearches(next);
    saveLS("sl_saved_searches", next);
    setShowSaveForm(false);
  };

  const loadSavedSearch = (s: SavedSearch) => {
    setQuery(s.query);
    setInputValue(s.query);
    setActiveTab(s.tab);
    setArtistFilters(s.artistFilters);
    setBriefFilters(s.briefFilters);
    setContentFilters(s.contentFilters);
    if (s.query) router.push(`/search?q=${encodeURIComponent(s.query)}`);
  };

  const deleteSavedSearch = (id: string) => {
    const next = savedSearches.filter(s => s.id !== id);
    setSavedSearches(next);
    saveLS("sl_saved_searches", next);
  };

  const updateSavedNotification = (id: string, notification: SavedSearch["notification"]) => {
    const next = savedSearches.map(s => s.id === id ? { ...s, notification } : s);
    setSavedSearches(next);
    saveLS("sl_saved_searches", next);
  };

  const totalArtistFilters = artistCount(artistFilters);
  const totalBriefFilters = briefCount(briefFilters);
  const totalContentFilters = contentCount(contentFilters);
  const totalFilters = totalArtistFilters + totalBriefFilters + totalContentFilters;

  const hasResults = talents.length > 0 || opportunities.length > 0 || reels.length > 0 || hirers.length > 0;
  const hasActivity = !!query || totalFilters > 0;

  const typeaheadHasContent = typeahead.talents.length > 0 || typeahead.opportunities.length > 0 || typeahead.reels.length > 0;

  const currentFilterCount = activeTab === "artists" ? totalArtistFilters : activeTab === "briefs" ? totalBriefFilters : activeTab === "content" ? totalContentFilters : totalFilters;

  return (
    <div className="artstage min-h-screen bg-[var(--as-bg)] pb-20">

      {/* Sticky search header */}
      <div className="bg-[var(--as-surface)] border-b border-[var(--as-border)] sticky top-[56px] z-30 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4">

          {/* Search bar row */}
          <div className="flex items-center gap-3">
            <form onSubmit={handleFormSubmit} className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--as-text-muted)]" />
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={e => { setInputValue(e.target.value); setShowTypeahead(true); }}
                onFocus={() => setShowTypeahead(true)}
                placeholder="Search artists, productions, briefs, and content…"
                className="w-full pl-10 pr-24 py-3 rounded-2xl border border-[var(--as-border)] bg-[var(--as-bg)] text-[var(--as-text)] focus:outline-none focus:border-[var(--as-accent)] focus:ring-4 focus:ring-[var(--as-accent)]/10 transition-all text-sm"
              />
              <button type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-[var(--as-accent)] text-white px-4 py-1.5 rounded-xl font-bold hover:shadow-lg transition-all text-sm">
                Search
              </button>

              {/* Typeahead dropdown */}
              {showTypeahead && (
                <div ref={typeaheadRef}
                  className="absolute left-0 right-0 top-full mt-2 bg-[var(--as-surface)] border border-[var(--as-border)] rounded-2xl shadow-xl overflow-hidden z-50">

                  {/* Recent searches (shown when input is short/empty) */}
                  {inputValue.length < 2 && recentSearches.length > 0 && (
                    <div className="p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold uppercase tracking-wide text-[var(--as-text-muted)] flex items-center gap-1.5">
                          <History className="w-3 h-3" /> Recent
                        </span>
                        <button onClick={clearHistory} className="text-[10px] text-[var(--as-text-muted)] hover:text-red-500 flex items-center gap-1 transition-colors">
                          <Shield className="w-3 h-3" /> Clear history
                        </button>
                      </div>
                      {recentSearches.map(r => (
                        <button key={r} onClick={() => handleSearch(r)}
                          className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-sm text-[var(--as-text)] hover:bg-[var(--as-bg)] transition-colors text-left">
                          <Clock className="w-3.5 h-3.5 text-[var(--as-text-muted)] shrink-0" />
                          {r}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Saved searches (shown when input is empty) */}
                  {inputValue.length < 2 && savedSearches.length > 0 && (
                    <div className="p-3 border-t border-[var(--as-border)]">
                      <span className="text-[11px] font-bold uppercase tracking-wide text-[var(--as-text-muted)] flex items-center gap-1.5 mb-2">
                        <Bookmark className="w-3 h-3" /> Saved Searches
                      </span>
                      {savedSearches.slice(0, 4).map(s => (
                        <button key={s.id} onClick={() => { loadSavedSearch(s); setShowTypeahead(false); }}
                          className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-sm text-[var(--as-text)] hover:bg-[var(--as-bg)] transition-colors text-left">
                          <BookmarkCheck className="w-3.5 h-3.5 text-[var(--as-accent)] shrink-0" />
                          <span className="flex-1 truncate">{s.name}</span>
                          {s.notification !== "none" && <Bell className="w-3 h-3 text-[var(--as-text-muted)]" />}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Live typeahead results */}
                  {inputValue.length >= 2 && (
                    <div>
                      {typeaheadLoading ? (
                        <div className="flex items-center gap-2 px-4 py-3 text-sm text-[var(--as-text-muted)]">
                          <Loader2 className="w-4 h-4 animate-spin" /> Searching…
                        </div>
                      ) : !typeaheadHasContent ? (
                        <div className="px-4 py-3 text-sm text-[var(--as-text-muted)]">No results for "{inputValue}"</div>
                      ) : (
                        <div className="divide-y divide-[var(--as-border)]">
                          {typeahead.talents.length > 0 && (
                            <div className="p-3">
                              <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--as-text-muted)] mb-2 flex items-center gap-1"><Users className="w-3 h-3" /> Artists</p>
                              {typeahead.talents.map(t => (
                                <Link key={t.id} href={`/profile/${t.id}`} onClick={() => setShowTypeahead(false)}
                                  className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-[var(--as-bg)] transition-colors">
                                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[var(--as-accent)] to-[#C8A882] shrink-0 overflow-hidden">
                                    {t.avatar ? <img src={t.avatar} alt="" className="w-full h-full object-cover" /> :
                                      <span className="w-full h-full flex items-center justify-center text-white text-xs font-bold">{t.name[0]}</span>}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-[var(--as-text)] truncate">{t.name}</p>
                                    <p className="text-xs text-[var(--as-text-muted)] truncate">{t.category}</p>
                                  </div>
                                  {t.verified && <CheckCircle2 className="w-3.5 h-3.5 text-[var(--as-accent)] shrink-0" />}
                                </Link>
                              ))}
                            </div>
                          )}
                          {typeahead.opportunities.length > 0 && (
                            <div className="p-3">
                              <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--as-text-muted)] mb-2 flex items-center gap-1"><Briefcase className="w-3 h-3" /> Briefs</p>
                              {typeahead.opportunities.map(o => (
                                <Link key={o.id} href={`/opportunities/${o.id}`} onClick={() => setShowTypeahead(false)}
                                  className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-[var(--as-bg)] transition-colors">
                                  <div className="w-7 h-7 rounded-lg bg-[var(--as-bg)] border border-[var(--as-border)] flex items-center justify-center text-[10px] font-bold text-[var(--as-text-muted)] shrink-0">
                                    {o.company[0]}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-[var(--as-text)] truncate">{o.title}</p>
                                    <p className="text-xs text-[var(--as-text-muted)] truncate">{o.company}</p>
                                  </div>
                                </Link>
                              ))}
                            </div>
                          )}
                          {typeahead.reels.length > 0 && (
                            <div className="p-3">
                              <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--as-text-muted)] mb-2 flex items-center gap-1"><Film className="w-3 h-3" /> Content</p>
                              {typeahead.reels.map(r => (
                                <Link key={r.id} href={`/profile/${r.talent_id}`} onClick={() => setShowTypeahead(false)}
                                  className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-[var(--as-bg)] transition-colors">
                                  <div className="w-7 h-7 rounded-lg bg-[var(--as-bg)] border border-[var(--as-border)] overflow-hidden flex items-center justify-center shrink-0">
                                    {r.thumbnail_url ? <img src={r.thumbnail_url} alt="" className="w-full h-full object-cover" /> :
                                      <Film className="w-3.5 h-3.5 text-[var(--as-text-muted)]" />}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-[var(--as-text)] truncate">{r.title}</p>
                                    <p className="text-xs text-[var(--as-text-muted)] truncate capitalize">{r.type} · {r.talent_name}</p>
                                  </div>
                                </Link>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                      <div className="border-t border-[var(--as-border)] px-4 py-2">
                        <button onClick={() => handleSearch(inputValue)}
                          className="text-sm text-[var(--as-accent)] font-semibold hover:underline flex items-center gap-1">
                          <Search className="w-3.5 h-3.5" /> See all results for "{inputValue}"
                        </button>
                      </div>
                    </div>
                  )}

                  {inputValue.length < 2 && recentSearches.length === 0 && savedSearches.length === 0 && (
                    <div className="px-4 py-3 text-sm text-[var(--as-text-muted)]">Start typing to search…</div>
                  )}
                </div>
              )}
            </form>

            {/* Saved searches button */}
            <button onClick={() => setShowSavedPanel(true)}
              className="shrink-0 flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-[var(--as-border)] text-sm font-semibold text-[var(--as-text-muted)] hover:border-[var(--as-accent)] hover:text-[var(--as-accent)] transition-all">
              <Bookmark className="w-4 h-4" />
              <span className="hidden sm:inline">Saved</span>
              {savedSearches.length > 0 && <span className="bg-[var(--as-accent)] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{savedSearches.length}</span>}
            </button>
          </div>

          {/* Tabs + mobile filter toggle */}
          <div className="flex items-center justify-between mt-4">
            <div className="flex gap-1.5 flex-wrap">
              {([
                { id: "all",     label: "All" },
                { id: "artists", label: "Artists",  icon: Users,      count: talents.length },
                { id: "briefs",  label: "Briefs",   icon: Briefcase,  count: opportunities.length },
                { id: "studios", label: "Studios",  icon: Building2,  count: hirers.length },
                { id: "content", label: "Content",  icon: Film,       count: reels.length },
              ] as const).map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-bold transition-all ${
                    activeTab === tab.id ? "bg-[var(--as-accent)] text-white shadow-md" : "bg-[var(--as-bg)] text-[var(--as-text-muted)] hover:text-[var(--as-accent)] border border-[var(--as-border)]"
                  }`}>
                  {"icon" in tab && <tab.icon className="w-3.5 h-3.5" />}
                  {tab.label}
                  {"count" in tab && !loading && tab.count > 0 && (
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${activeTab === tab.id ? "bg-[var(--as-surface)]/20" : "bg-[var(--as-border)] text-[var(--as-text)]"}`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
            <button onClick={() => setFilterOpen(o => !o)}
              className="flex lg:hidden items-center gap-2 px-3 py-2 rounded-full border border-[var(--as-border)] text-sm font-semibold text-[var(--as-text-muted)] hover:border-[var(--as-accent)] hover:text-[var(--as-accent)] transition-all">
              <Filter className="w-4 h-4" /> Filters
              {currentFilterCount > 0 && <span className="bg-[var(--as-accent)] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{currentFilterCount}</span>}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 flex gap-6 items-start">

        {/* Desktop sidebar */}
        <div className="hidden lg:block w-64 shrink-0 sticky top-[160px]">
          <div className="bg-[var(--as-surface)] border border-[var(--as-border)] rounded-2xl p-5 space-y-0">
            {(activeTab === "all" || activeTab === "artists") && (
              <ArtistFilterSidebar f={artistFilters} onChange={setArtistFilters} onClear={() => setArtistFilters(EMPTY_ARTIST)} />
            )}
            {activeTab === "briefs" && (
              <BriefFilterSidebar f={briefFilters} onChange={setBriefFilters} onClear={() => setBriefFilters(EMPTY_BRIEF)} />
            )}
            {activeTab === "content" && (
              <ContentFilterSidebar f={contentFilters} onChange={setContentFilters} onClear={() => setContentFilters(EMPTY_CONTENT)} />
            )}

            {/* Save search */}
            <div className="pt-4 border-t border-[var(--as-border)] mt-4">
              {showSaveForm ? (
                <SaveSearchForm onSave={saveCurrentSearch} onCancel={() => setShowSaveForm(false)} />
              ) : (
                <button onClick={() => setShowSaveForm(true)}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-dashed border-[var(--as-border)] text-sm text-[var(--as-text-muted)] hover:border-[var(--as-accent)] hover:text-[var(--as-accent)] transition-all font-semibold">
                  <Plus className="w-4 h-4" /> Save this search
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Mobile filter drawer */}
        {filterOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            <div className="absolute inset-0 bg-black/40" onClick={() => setFilterOpen(false)} />
            <div className="relative ml-auto w-72 h-full bg-[var(--as-surface)] shadow-2xl p-5 overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <span className="font-bold text-[var(--as-text)]">Filters</span>
                <button onClick={() => setFilterOpen(false)}><X className="w-5 h-5 text-[var(--as-text-muted)]" /></button>
              </div>
              {(activeTab === "all" || activeTab === "artists") && (
                <ArtistFilterSidebar f={artistFilters} onChange={setArtistFilters} onClear={() => setArtistFilters(EMPTY_ARTIST)} />
              )}
              {activeTab === "briefs" && (
                <BriefFilterSidebar f={briefFilters} onChange={setBriefFilters} onClear={() => setBriefFilters(EMPTY_BRIEF)} />
              )}
              {activeTab === "content" && (
                <ContentFilterSidebar f={contentFilters} onChange={setContentFilters} onClear={() => setContentFilters(EMPTY_CONTENT)} />
              )}
            </div>
          </div>
        )}

        {/* Main results */}
        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-[var(--as-accent)] animate-spin mb-4" />
              <p className="text-[var(--as-text-muted)] font-medium">Searching…</p>
            </div>
          ) : !hasActivity ? (
            <div className="text-center py-20">
              <div className="w-20 h-20 mx-auto bg-gradient-to-br from-[rgba(255,215,0,0.05)] to-[#F0EDE8] rounded-3xl flex items-center justify-center mb-6 shadow-sm border border-[var(--as-border)]">
                <Search className="w-10 h-10 text-[var(--as-accent)] opacity-80" />
              </div>
              <h2 className="text-2xl font-bold font-display text-[var(--as-text)] mb-2">Find your next star or gig</h2>
              <p className="text-[var(--as-text-muted)] max-w-md mx-auto">
                Search across artists, casting briefs, and performance content — all in one place.
              </p>
              <div className="flex flex-wrap justify-center gap-2 mt-6">
                {["Actor", "Singer", "Dancer", "Voice Actor"].map(d => (
                  <button key={d} onClick={() => {
                    setArtistFilters(f => ({ ...f, disciplines: [d.toLowerCase().replace(" ", "_")] }));
                    setActiveTab("artists");
                  }}
                    className="px-3 py-1.5 rounded-full border border-[var(--as-border)] text-sm text-[var(--as-text-muted)] hover:border-[var(--as-accent)] hover:text-[var(--as-accent)] transition-all">
                    Browse {d}s
                  </button>
                ))}
              </div>
            </div>
          ) : !hasResults ? (
            <div className="text-center py-20">
              <div className="w-20 h-20 mx-auto bg-[var(--as-bg)] rounded-3xl flex items-center justify-center mb-6 border border-[var(--as-border)]">
                <Search className="w-10 h-10 text-[var(--as-text-muted)]" />
              </div>
              <h3 className="text-xl font-bold text-[var(--as-text)] mb-2">No results found</h3>
              <p className="text-[var(--as-text-muted)]">
                {query ? `Nothing matching "${query}"` : "No matches for these filters"} — try adjusting your search.
              </p>
            </div>
          ) : (
            <div className="space-y-10">

              {/* Artists section */}
              {(activeTab === "all" || activeTab === "artists") && talents.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-5">
                    <Users className="w-5 h-5 text-[var(--as-accent)]" />
                    <h3 className="text-xl font-bold font-display text-[var(--as-text)]">Artists</h3>
                    <span className="text-sm font-medium text-[var(--as-text-muted)] bg-[var(--as-border)] px-2 py-0.5 rounded-full">{talents.length}</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {talents.map(t => (
                      <Link key={t.id} href={`/profile/${t.id}`}
                        className="group bg-[var(--as-surface)] border border-[var(--as-border)] rounded-2xl p-4 flex items-center gap-4 hover:border-[var(--as-accent)] hover:shadow-lg transition-all">
                        <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-[var(--as-accent)] to-[#C8A882] shrink-0 overflow-hidden">
                          {t.avatar ? <img src={t.avatar} alt={t.name} className="w-full h-full object-cover" /> :
                            <div className="w-full h-full flex items-center justify-center text-white font-bold text-xl">{t.name[0]}</div>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <h4 className="font-bold text-[var(--as-text)] truncate group-hover:text-[var(--as-accent)] transition-colors">{t.name}</h4>
                            {t.verified && <CheckCircle2 className="w-3.5 h-3.5 text-[var(--as-accent)] shrink-0" />}
                          </div>
                          <p className="text-sm text-[var(--as-text-secondary)] truncate">{t.category}</p>
                          <div className="flex items-center gap-3 mt-1 text-[11px] font-medium text-[var(--as-text-muted)]">
                            {t.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{t.location}</span>}
                            <span className="flex items-center gap-1 text-[#D85A30]"><Star className="w-3 h-3 fill-current" />{t.rating}</span>
                            {t.availability_status === "Available" && (
                              <span className="px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 text-[10px] font-bold">Available</span>
                            )}
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-[var(--as-text-muted)] group-hover:text-[var(--as-accent)] group-hover:translate-x-1 transition-all shrink-0" />
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Studios section */}
              {(activeTab === "all" || activeTab === "studios") && hirers.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-5">
                    <Building2 className="w-5 h-5 text-[var(--as-accent)]" />
                    <h3 className="text-xl font-bold font-display text-[var(--as-text)]">Studios & Hirers</h3>
                    <span className="text-sm font-medium text-[var(--as-text-muted)] bg-[var(--as-border)] px-2 py-0.5 rounded-full">{hirers.length}</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {hirers.map(h => (
                      <Link key={h.id} href={`/profile/hirer/${h.id}`}
                        className="group bg-[var(--as-surface)] border border-[var(--as-border)] rounded-2xl p-4 flex items-center gap-4 hover:border-[var(--as-accent)] hover:shadow-lg transition-all">
                        <div className="w-16 h-16 rounded-xl bg-[var(--as-bg)] border border-[var(--as-border)] shrink-0 flex items-center justify-center">
                          <Building2 className="w-7 h-7 text-[var(--as-accent)]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <h4 className="font-bold text-[var(--as-text)] truncate group-hover:text-[var(--as-accent)] transition-colors">{h.name}</h4>
                          </div>
                          <p className="text-sm text-[var(--as-text-secondary)] truncate">{h.email}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[rgba(255,215,0,0.1)] border border-[rgba(255,215,0,0.2)] text-[var(--as-accent)]">
                              {h.role === "AGENCY" ? "Agency" : "Hirer"}
                            </span>
                            {h.date_joined && (
                              <span className="text-[11px] text-[var(--as-text-muted)]">
                                Since {new Date(h.date_joined).getFullYear()}
                              </span>
                            )}
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-[var(--as-text-muted)] group-hover:text-[var(--as-accent)] group-hover:translate-x-1 transition-all shrink-0" />
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Briefs section */}
              {(activeTab === "all" || activeTab === "briefs") && opportunities.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-5">
                    <Briefcase className="w-5 h-5 text-[var(--as-accent)]" />
                    <h3 className="text-xl font-bold font-display text-[var(--as-text)]">Casting Briefs</h3>
                    <span className="text-sm font-medium text-[var(--as-text-muted)] bg-[var(--as-border)] px-2 py-0.5 rounded-full">{opportunities.length}</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {opportunities.map(o => (
                      <Link key={o.id} href={`/opportunities/${o.id}`}
                        className="group bg-[var(--as-surface)] border border-[var(--as-border)] rounded-2xl p-5 hover:border-[var(--as-accent)] hover:shadow-lg transition-all relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-[var(--as-accent)]/10 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="flex gap-4">
                          <div className="w-12 h-12 rounded-xl border border-[var(--as-border)] bg-[var(--as-surface)] shrink-0 flex items-center justify-center font-bold text-lg text-[var(--as-text-muted)]">
                            {o.company_logo ? <img src={o.company_logo} alt="" className="w-full h-full object-contain rounded-xl" /> : o.company[0]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-[var(--as-text)] truncate group-hover:text-[var(--as-accent)] transition-colors mb-0.5">{o.title}</h4>
                            <p className="text-sm text-[var(--as-text-secondary)] truncate">{o.company}</p>
                            <div className="flex flex-wrap items-center gap-1.5 mt-2">
                              {o.type && <span className="px-2 py-0.5 rounded-md bg-[var(--as-bg)] border border-[var(--as-border)] text-[11px] font-medium text-[var(--as-text-muted)]">{o.type}</span>}
                              {o.location && <span className="px-2 py-0.5 rounded-md bg-[var(--as-bg)] border border-[var(--as-border)] text-[11px] font-medium text-[var(--as-text-muted)] flex items-center gap-1"><MapPin className="w-2.5 h-2.5" />{o.location}</span>}
                              {o.compensation && <span className="px-2 py-0.5 rounded-md bg-green-50 border border-green-200 text-[11px] font-medium text-green-700">{o.compensation}</span>}
                              {o.deadline && <span className="px-2 py-0.5 rounded-md bg-[var(--as-bg)] border border-[var(--as-border)] text-[11px] font-medium text-[var(--as-text-muted)]">Due: {o.deadline}</span>}
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Content section */}
              {(activeTab === "all" || activeTab === "content") && reels.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-5">
                    <Film className="w-5 h-5 text-[var(--as-accent)]" />
                    <h3 className="text-xl font-bold font-display text-[var(--as-text)]">Performance Content</h3>
                    <span className="text-sm font-medium text-[var(--as-text-muted)] bg-[var(--as-border)] px-2 py-0.5 rounded-full">{reels.length}</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {reels.map(r => (
                      <Link key={r.id} href={`/profile/${r.talent_id}`}
                        className="group bg-[var(--as-surface)] border border-[var(--as-border)] rounded-2xl overflow-hidden hover:border-[var(--as-accent)] hover:shadow-lg transition-all">
                        <div className="relative h-36 bg-gradient-to-br from-[#F0EDE8] to-[#FAF9F6] overflow-hidden">
                          {r.thumbnail_url ? (
                            <img src={r.thumbnail_url} alt={r.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ContentTypeIcon type={r.type} />
                            </div>
                          )}
                          <div className="absolute bottom-2 left-2">
                            <span className="px-2 py-0.5 rounded-full bg-black/60 text-white text-[10px] font-bold capitalize">{r.type}</span>
                          </div>
                        </div>
                        <div className="p-3">
                          <h4 className="font-bold text-sm text-[var(--as-text)] truncate group-hover:text-[var(--as-accent)] transition-colors">{r.title}</h4>
                          {r.talent_name && (
                            <p className="text-xs text-[var(--as-text-muted)] mt-0.5 truncate">{r.talent_name}</p>
                          )}
                          {r.description && (
                            <p className="text-xs text-[var(--as-text-muted)] mt-1 line-clamp-2">{r.description}</p>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Saved searches panel */}
      {showSavedPanel && (
        <SavedSearchesPanel
          savedSearches={savedSearches}
          onLoad={loadSavedSearch}
          onDelete={deleteSavedSearch}
          onUpdateNotification={updateSavedNotification}
          onClose={() => setShowSavedPanel(false)}
        />
      )}
    </div>
  );
}

// ─── Page wrapper ─────────────────────────────────────────────────────────────

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[var(--as-bg)] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--as-accent)]" />
      </div>
    }>
      <SearchResults />
    </Suspense>
  );
}
