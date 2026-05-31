"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Search, MapPin, Bookmark, BookmarkCheck,
  ChevronDown, ChevronUp, ChevronLeft, ChevronRight,
  Loader2, Briefcase, SlidersHorizontal, X,
  DollarSign, Clock, Building, Users, Calendar,
  CheckCircle2, Share2, Filter,
  Eye, TrendingUp, Award, Zap, Star,
} from "lucide-react";
import { DynamicIcon } from "@/components/ui/DynamicIcon";
import { apiClient } from "@/lib/api";
import { getUser } from "@/lib/auth";

/* ═══════════════════════════════ TYPES ════════════════════════════ */
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
}

/* ═══════════════ ARTSTAGE COMPONENTS ════════════════════════════ */
function Pill({ children, variant = "default", className = "" }: {
  children: React.ReactNode;
  variant?: "default" | "active" | "urgent" | "featured";
  className?: string;
}) {
  const variants = {
    default: "as-surface border border-[var(--as-border)] as-text-secondary",
    active: "bg-[var(--as-accent)] text-[#221b00] border-[var(--as-accent)]",
    urgent: "bg-[rgba(225,1,17,0.15)] text-[#e10111] border-[rgba(225,1,17,0.3)]",
    featured: "bg-[rgba(255,215,0,0.12)] text-[var(--as-accent)] border-[rgba(255,215,0,0.25)]",
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}

function StatBadge({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2.5 p-3 rounded-xl as-surface border border-[var(--as-border)]">
      <div className="w-8 h-8 rounded-lg bg-[rgba(255,215,0,0.1)] flex items-center justify-center">
        <Icon className="w-4 h-4 as-accent" />
      </div>
      <div>
        <p className="text-[10px] as-text-muted uppercase tracking-wider">{label}</p>
        <p className="text-sm font-semibold as-text">{value}</p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════ CONSTANTS ════════════════════════ */
const QUICK_TAGS = ["Actor", "Dancer", "Singer", "Voiceover", "Model", "Director", "Film", "Theatre", "Commercial", "Remote"];
const HIRER_QUICK_TAGS = ["Actor", "Singer", "Dancer", "Voiceover", "Model", "Director", "Choreographer", "Composer", "Screenwriter", "Remote"];
const EMPLOYMENT_OPTIONS = ["Fulltime", "Part-time", "Contract", "Freelance"];
const CATEGORY_OPTIONS = ["Acting", "Dance", "Music", "Modeling", "Voiceover", "Production"];
const JOBS_PER_PAGE = 6;

import { Suspense } from "react";

/* ═══════════════════════════════ MAIN COMPONENT ═══════════════════ */
function OpportunitiesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const currentUser = getUser();
  const canApply = currentUser?.role === 'ARTIST' || currentUser?.role === 'FAN';
  const isHirer = currentUser?.role === 'HIRER' || currentUser?.role === 'AGENCY';

  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<Opportunity | null>(null);

  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") ?? "");
  const [locationQuery, setLocationQuery] = useState("");

  const [activeTags, setActiveTags] = useState<Set<string>>(new Set());
  const [selectedEmployment, setSelectedEmployment] = useState<Set<string>>(new Set());
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);

  const [bookmarked, setBookmarked] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);

  const [hasApplied, setHasApplied] = useState<Set<string>>(new Set());

  const detailRef = useRef<HTMLDivElement>(null);
  const [isMounted, setIsMounted] = useState(false);

  const fetchOpportunities = useCallback((q: string) => {
    setLoading(true);
    const url = q.trim() ? `/opportunities/?search=${encodeURIComponent(q)}` : '/opportunities/';
    apiClient.get<Opportunity[]>(url)
      .then(data => {
        setOpportunities(data);
        if (data.length > 0 && !selectedJob) setSelectedJob(data[0]);
      })
      .finally(() => setLoading(false));
  }, [selectedJob]);

  useEffect(() => {
    setIsMounted(true);
    fetchOpportunities(searchParams.get("search") ?? "");
  }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const combined = [searchQuery, locationQuery].filter(Boolean).join(" ");
    fetchOpportunities(combined);
    setCurrentPage(1);
    const params = new URLSearchParams();
    if (combined) params.set("search", combined);
    router.replace(`/opportunities?${params.toString()}`, { scroll: false });
  }

  function toggleTag(tag: string) {
    setActiveTags(prev => { const n = new Set(prev); n.has(tag) ? n.delete(tag) : n.add(tag); return n; });
    setCurrentPage(1);
  }

  function toggleBookmark(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    setBookmarked(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  const filteredJobs = opportunities.filter(job => {
    if (activeTags.size > 0) {
      const haystack = `${job.type} ${job.category} ${job.location} ${job.tags?.join(' ')}`.toLowerCase();
      if (![...activeTags].some(t => haystack.includes(t.toLowerCase()))) return false;
    }
    if (selectedEmployment.size > 0) {
      if (![...selectedEmployment].some(e => job.type.toLowerCase().includes(e.toLowerCase()))) return false;
    }
    if (selectedCategories.size > 0) {
      if (![...selectedCategories].some(c => job.category.toLowerCase().includes(c.toLowerCase()))) return false;
    }
    return true;
  });

  const totalPages = Math.ceil(filteredJobs.length / JOBS_PER_PAGE);
  const paginatedJobs = filteredJobs.slice((currentPage - 1) * JOBS_PER_PAGE, currentPage * JOBS_PER_PAGE);

  const hasFilters = activeTags.size > 0 || selectedEmployment.size > 0 || selectedCategories.size > 0;

  return (
    <>
      <style>{`
        .glass-panel {
          background: rgba(22, 22, 24, 0.7);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.05);
        }
        .spotlight-hover {
          position: relative;
        }
        .spotlight-hover:hover {
          box-shadow: 0 0 25px -5px rgba(255, 215, 0, 0.15);
          border-color: rgba(255, 215, 0, 0.3);
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #131314;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #353436;
          border-radius: 10px;
        }
        .role-chip-gold {
          background: #201f20;
          border-left: 4px solid #ffd700;
        }
        .role-chip-silver {
          background: #201f20;
          border-left: 4px solid #999077;
        }
      `}</style>
      <div className="bg-[var(--as-bg)] text-[var(--as-text)] selection:bg-[#ffd700] selection:text-[#705e00] min-h-screen">
        <main className="pt-10 pb-12 max-w-[1440px] mx-auto px-6 lg:px-16 flex gap-6">
          
          {/* SideNavBar / Advanced Filters */}
          <aside className="hidden lg:flex flex-col gap-2 p-6 sticky top-24 bg-[var(--as-surface)]/70 backdrop-blur-2xl rounded-xl w-80 border border-white/10 shadow-2xl h-fit max-h-[calc(100vh-120px)] overflow-y-auto custom-scrollbar shrink-0">
            <div className="mb-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg overflow-hidden border border-white/10 bg-[#201f20] flex items-center justify-center text-[#ffd700] font-bold text-xl">
                {isMounted && currentUser?.email ? currentUser.email[0].toUpperCase() : 'U'}
              </div>
              <div>
                <h3 className="font-outfit text-[14px] font-semibold text-[var(--as-text)]">
                  {isMounted && currentUser?.email ? currentUser.email.split('@')[0] : 'User'}
                </h3>
                <p className="font-outfit text-[12px] text-[#d0c6ab]">Creative Professional</p>
              </div>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="font-outfit text-[14px] font-semibold tracking-wide text-[#ffd700] mb-3 block">Role Type</label>
                <div className="flex flex-col gap-2">
                  {CATEGORY_OPTIONS.map(opt => (
                    <label key={opt} className="flex items-center gap-3 cursor-pointer group">
                      <input 
                        type="checkbox" 
                        checked={selectedCategories.has(opt)}
                        onChange={() => {
                          setSelectedCategories(prev => { const n = new Set(prev); n.has(opt) ? n.delete(opt) : n.add(opt); return n; });
                          setCurrentPage(1);
                        }}
                        className="w-4 h-4 rounded bg-[var(--as-bg)] border-[#4d4732] text-[#ffd700] focus:ring-[#ffd700]" 
                      />
                      <span className="font-outfit text-[16px] text-[#d0c6ab] group-hover:text-[var(--as-text)] transition-colors">{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              <div className="pt-4 border-t border-white/5">
                <label className="font-outfit text-[14px] font-semibold tracking-wide text-[#ffd700] mb-3 block">Employment</label>
                <div className="flex flex-col gap-2">
                  {EMPLOYMENT_OPTIONS.map(opt => (
                    <label key={opt} className="flex items-center gap-3 cursor-pointer group">
                      <input 
                        type="checkbox" 
                        checked={selectedEmployment.has(opt)}
                        onChange={() => {
                          setSelectedEmployment(prev => { const n = new Set(prev); n.has(opt) ? n.delete(opt) : n.add(opt); return n; });
                          setCurrentPage(1);
                        }}
                        className="w-4 h-4 rounded bg-[var(--as-bg)] border-[#4d4732] text-[#ffd700] focus:ring-[#ffd700]" 
                      />
                      <span className="font-outfit text-[16px] text-[#d0c6ab] group-hover:text-[var(--as-text)] transition-colors">{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              <div className="pt-4 border-t border-white/5">
                <label className="font-outfit text-[14px] font-semibold tracking-wide text-[#ffd700] mb-3 block">Search Location</label>
                <div className="space-y-4">
                  <input 
                    type="text"
                    value={locationQuery}
                    onChange={e => setLocationQuery(e.target.value)}
                    placeholder="City, state, or remote"
                    className="w-full bg-[var(--as-bg)] border border-[#4d4732] rounded-lg font-outfit text-[var(--as-text)] px-3 py-2 focus:ring-2 focus:ring-[#ffd700] focus:border-transparent outline-none text-sm placeholder:text-[var(--as-text-muted)]"
                  />
                </div>
              </div>
            </div>
            
            <button 
              onClick={() => handleSearch(new Event('submit') as unknown as React.FormEvent)}
              className="mt-8 w-full py-3 bg-[#ffd700] text-[#3a3000] font-outfit text-[14px] rounded-xl font-bold hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-[#ffd700]/10"
            >
              Apply Filters
            </button>
          </aside>

          {/* Main Content Area */}
          <section className="flex-1 min-w-0">
            <header className="mb-10 flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
              <div>
                <h1 className="font-syne text-[48px] font-bold text-[var(--as-text)] tracking-tight">Open Castings</h1>
                <p className="font-outfit text-[18px] text-[#d0c6ab] mt-2">Discover {filteredJobs.length} curated roles in your network.</p>
              </div>

            </header>

            {/* Casting List */}
            <div className="space-y-6">
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin text-[#ffd700] mx-auto" />
                </div>
              ) : filteredJobs.length === 0 ? (
                <div className="text-center py-20">
                  <div className="text-[var(--as-text-muted)] mb-4 flex justify-center"><Briefcase className="w-16 h-16 opacity-50" /></div>
                  <h3 className="font-syne text-[24px] font-bold text-[var(--as-text)]">No opportunities found</h3>
                  <p className="font-outfit text-[#d0c6ab] mt-2">Try adjusting your filters or search terms.</p>
                </div>
              ) : (
                paginatedJobs.map((job, idx) => (
                  <article key={job.id} className="glass-panel spotlight-hover rounded-2xl p-6 transition-all duration-300 group">
                    <div className="flex flex-col md:flex-row gap-6">
                      <Link href={`/opportunities/${job.id}`} className="relative w-full md:w-48 h-32 md:h-48 bg-[#201f20] rounded-xl overflow-hidden shrink-0 flex items-center justify-center border border-white/5 cursor-pointer">
                        {/* Placeholder image representation since we only have logo string normally */}
                        <div className="absolute inset-0 bg-gradient-to-br from-[#1c1b1c] to-[#131314] opacity-80" />
                        <DynamicIcon name={job.company_logo || 'Briefcase'} className="w-16 h-16 text-[#ffd700]/40 relative z-10 group-hover:scale-110 transition-transform duration-500" />

                        {job.urgent && (
                          <div className="absolute top-3 left-3 flex gap-2 z-20">
                            <span className="bg-[#e10111] text-[#fff1ef] font-outfit font-semibold text-[10px] tracking-wider px-2 py-1 rounded flex items-center gap-1 animate-pulse">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#fff1ef]" />
                              URGENT CASTING
                            </span>
                          </div>
                        )}
                      </Link>

                      <div className="flex-1 flex flex-col min-w-0">
                        <div className="flex justify-between items-start">
                          <div className="truncate pr-4">
                            <Link href={`/opportunities/${job.id}`}>
                              <h2 className="font-syne text-[24px] font-bold text-[var(--as-text)] leading-tight truncate hover:text-[#ffd700] transition-colors cursor-pointer">{job.title}</h2>
                            </Link>
                            <div className="flex items-center gap-3 mt-2 flex-wrap">
                              <span className="font-outfit text-[16px] text-[#ffd700] font-bold truncate">{job.company}</span>
                              <span className="text-[#d0c6ab]/40">•</span>
                              <span className={`${job.featured ? 'role-chip-gold' : 'role-chip-silver'} px-3 py-0.5 font-outfit font-semibold tracking-wide text-[11px] rounded text-[#d0c6ab] uppercase`}>
                                {job.category} ROLE
                              </span>
                            </div>
                          </div>
                          <button 
                            onClick={(e) => toggleBookmark(job.id, e)}
                            className="text-[#d0c6ab] hover:text-[#ffd700] transition-colors mt-1 p-1"
                          >
                            {bookmarked.has(job.id) ? (
                              <BookmarkCheck className="w-6 h-6 text-[#ffd700]" />
                            ) : (
                              <Bookmark className="w-6 h-6" />
                            )}
                          </button>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pb-2">
                          <div className="flex flex-col gap-1">
                            <span className="font-outfit text-[11px] font-semibold text-[#d0c6ab] uppercase tracking-wider">Posted</span>
                            <span className="font-outfit text-[16px] text-[var(--as-text)] truncate">{job.posted}</span>
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="font-outfit text-[11px] font-semibold text-[#d0c6ab] uppercase tracking-wider">Compensation</span>
                            <span className="font-outfit text-[16px] text-[var(--as-text)] truncate">{job.compensation || 'Negotiable'}</span>
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="font-outfit text-[11px] font-semibold text-[#d0c6ab] uppercase tracking-wider">Location</span>
                            <span className="font-outfit text-[16px] text-[var(--as-text)] truncate">{job.location || 'Remote'}</span>
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="font-outfit text-[11px] font-semibold text-[#d0c6ab] uppercase tracking-wider">Type</span>
                            <span className="font-outfit text-[16px] text-[var(--as-text)] truncate">{job.type}</span>
                          </div>
                        </div>
                        
                        <div className="mt-auto pt-6 flex flex-col md:flex-row justify-between items-end md:items-center gap-4 border-t border-white/5 mt-6">
                          <div className="flex items-center gap-4">
                            {job.deadline && (
                              <div className="flex items-center gap-2 text-[#d0c6ab]">
                                <Calendar className="w-4 h-4" />
                                <span className="font-outfit text-[12px] font-semibold">Deadline: {job.deadline}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-2 text-[#d0c6ab]">
                              <Users className="w-4 h-4" />
                              <span className="font-outfit text-[12px] font-semibold">{job.applicants} applicants</span>
                            </div>
                          </div>
                          
                          {canApply ? (
                            hasApplied.has(job.id) ? (
                              <button disabled className="bg-[#006a70] text-white font-outfit text-[14px] py-2.5 px-8 rounded-xl font-bold opacity-90 cursor-not-allowed flex items-center gap-2">
                                <CheckCircle2 className="w-5 h-5" /> Applied
                              </button>
                            ) : (
                              <Link href={`/opportunities/${job.id}?apply=1`}>
                                <button
                                  className="bg-[#ffd700] text-[#3a3000] font-outfit text-[14px] py-2.5 px-8 rounded-xl font-bold hover:scale-105 active:scale-95 transition-all shadow-xl shadow-[#ffd700]/20"
                                >
                                  Apply Now
                                </button>
                              </Link>
                            )
                          ) : (
                            <Link href={`/opportunities/${job.id}`}>
                              <button className="border border-[#4d4732] text-[var(--as-text)] font-outfit text-[14px] py-2.5 px-8 rounded-xl font-bold hover:bg-white/5 active:scale-95 transition-all">
                                View Details
                              </button>
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  </article>
                ))
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <footer className="mt-12 flex justify-center items-center gap-4">
                <button 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="w-10 h-10 flex items-center justify-center rounded-lg border border-white/5 hover:bg-white/5 disabled:opacity-30 text-[var(--as-text)]"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-2">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let page = i + 1;
                    if (totalPages > 5 && currentPage > 3) {
                      page = currentPage - 3 + i;
                      if (page > totalPages) return null;
                    }
                    const isCurrent = page === currentPage;
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-10 h-10 flex items-center justify-center rounded-lg font-bold transition-colors ${
                          isCurrent 
                            ? 'bg-[#ffd700]/10 text-[#ffd700] border border-[#ffd700]/20' 
                            : 'hover:bg-white/5 text-[#d0c6ab]'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                </div>
                <button 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="w-10 h-10 flex items-center justify-center rounded-lg border border-white/5 hover:bg-white/5 disabled:opacity-30 text-[var(--as-text)]"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </footer>
            )}
          </section>
        </main>
      </div>
    </>
  );
}

export default function OpportunitiesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" /></div>}>
      <OpportunitiesContent />
    </Suspense>
  );
}