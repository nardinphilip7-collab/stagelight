"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api";
import { getUser } from "@/lib/auth";

interface Connection {
  id: number;
  from_user: number;
  from_user_email: string;
  to_user: number;
  to_user_email: string;
  status: string;
  created_at: string;
}

interface TalentProfile {
  id: string;
  user: number;
  name: string;
  category: string;
  avatar: string;
  followers: number;
  owner: number | null;
}

export default function NetworkPage() {
  const router = useRouter();
  const currentUser = getUser();
  const [loading, setLoading] = useState(true);
  const [allTalents, setAllTalents] = useState<TalentProfile[]>([]);
  const [myProfile, setMyProfile] = useState<TalentProfile | null>(null);
  const [connections, setConnections] = useState<Connection[]>([]);
  
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState("All Talent");
  const [visibleCount, setVisibleCount] = useState(15);

  useEffect(() => {
    if (!currentUser) { router.replace("/login"); return; }
    Promise.all([
      apiClient.get<Connection[]>('/connections/'),
      apiClient.get<TalentProfile[]>('/talents/?mine=true'),
      apiClient.get<TalentProfile[]>('/talents/')
    ])
      .then(([conns, myProfData, allTalentsData]) => {
        setConnections(conns);
        const myProf = myProfData[0] || null;
        setMyProfile(myProf);
        setAllTalents(allTalentsData.filter(t => String(t.owner) !== String(currentUser.user_id)));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  function initials(str: string) {
    return str ? str.slice(0, 2).toUpperCase() : "??";
  }

  async function handleConnect(e: React.MouseEvent, talentUser: number) {
    e.stopPropagation();
    try {
      const conn = await apiClient.post<Connection>('/connections/', { to_user: talentUser });
      setConnections(prev => [...prev, conn]);
    } catch (err) {
      console.error(err);
    }
  }

  const getConnection = (talentUser: number) => {
    return connections.find(c =>
      (String(c.from_user) === String(currentUser?.user_id) && String(c.to_user) === String(talentUser)) ||
      (String(c.from_user) === String(talentUser) && String(c.to_user) === String(currentUser?.user_id))
    ) || null;
  };

  async function handleAcceptConnection(e: React.MouseEvent, connId: number) {
    e.stopPropagation();
    try {
      await apiClient.patch(`/connections/${connId}/accept/`, {});
      setConnections(prev => prev.map(c => c.id === connId ? { ...c, status: 'accepted' } : c));
    } catch (err) {
      console.error(err);
    }
  }

  // Derived State
  const recommendedTalents = allTalents.filter(t => myProfile && t.category === myProfile.category && t.category !== "");
  
  const filteredTalents = allTalents.filter(t => {
    if (activeCategory === "All Talent") return true;
    if (activeCategory === "Actors") return t.category?.toLowerCase().includes("actor");
    if (activeCategory === "Directors") return t.category?.toLowerCase().includes("director");
    if (activeCategory === "VFX Artists") return t.category?.toLowerCase().includes("vfx") || t.category?.toLowerCase().includes("visual");
    if (activeCategory === "Cinematographers") return t.category?.toLowerCase().includes("cinema") || t.category?.toLowerCase().includes("camera");
    return true;
  });

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=Outfit:wght@300;400;600&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap');

        .font-syne { font-family: 'Syne', sans-serif; }
        .font-outfit { font-family: 'Outfit', sans-serif; }

        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
            vertical-align: middle;
        }
        .glass-card {
            background: rgba(22, 22, 24, 0.7);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.05);
        }
        .spotlight-glow:hover {
            box-shadow: 0 0 15px rgba(255, 215, 0, 0.3);
        }
        .role-chip {
            background: #1c1b1c;
            border-left: 4px solid #ffd700;
        }
        .custom-scrollbar::-webkit-scrollbar {
            width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #353436;
            border-radius: 10px;
        }
      `}} />

      <div className="bg-[var(--as-bg)] text-[var(--as-text)] font-outfit text-[16px] leading-[1.6] min-h-screen">
        
        {/* Filter Modal Overlay */}
        {isFilterOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
            <div className="relative w-full max-w-md bg-[#201f20]/90 backdrop-blur-2xl border border-white/10 rounded-2xl p-6 md:p-8 shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
              
              <button 
                onClick={() => setIsFilterOpen(false)}
                className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-[#d0c6ab] hover:text-[#fff6df] transition-all"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>

              {/* Header */}
              <div className="flex items-center gap-4 mb-2 pb-6 border-b border-white/5">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#ffd700]/20 to-[#ffd700]/5 border border-[#ffd700]/20 flex items-center justify-center shadow-[0_0_15px_rgba(255,215,0,0.1)]">
                  <span className="material-symbols-outlined text-[#ffd700] text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>filter_list</span>
                </div>
                <div>
                  <h3 className="font-syne text-[#fff6df] text-[22px] font-bold tracking-tight">Filters</h3>
                  <p className="text-xs text-[#d0c6ab] font-outfit mt-0.5">Refine your search</p>
                </div>
              </div>

              {/* Craft Filter */}
              <div className="space-y-4 pt-4">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#ffd700]/50"></div>
                  <p className="font-outfit font-semibold text-[11px] text-[var(--as-text)] uppercase tracking-[0.15em]">Primary Craft</p>
                </div>
                <div className="flex flex-col gap-1.5">
                  {[
                    { label: "All Talent", icon: "group" },
                    { label: "Actors", icon: "theaters" },
                    { label: "Directors", icon: "movie_filter" },
                    { label: "VFX Artists", icon: "flare" },
                    { label: "Cinematographers", icon: "videocam" }
                  ].map((craft) => (
                    <button
                      key={craft.label}
                      onClick={() => { setActiveCategory(craft.label); setVisibleCount(15); }}
                      className={`flex items-center gap-3 px-4 py-3 text-left rounded-r-lg transition-all group border-l-2 ${
                        activeCategory === craft.label 
                          ? "bg-gradient-to-r from-[#ffd700]/10 to-transparent border-[#ffd700] text-[#ffd700] font-bold" 
                          : "border-transparent text-[#d0c6ab] hover:text-[#fff6df] hover:bg-white/5 hover:border-white/20"
                      }`}
                    >
                      <span className={`material-symbols-outlined text-[20px] ${activeCategory === craft.label ? "" : "text-[#8c8574] group-hover:text-[#fff6df] transition-colors"}`}>{craft.icon}</span>
                      <span className="font-outfit text-sm">{craft.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Union Status */}
              <div className="space-y-4 pt-4">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#d0c6ab]/30"></div>
                  <p className="font-outfit font-semibold text-[11px] text-[var(--as-text)] uppercase tracking-[0.15em]">Union Status</p>
                </div>
                <div className="flex flex-col gap-2.5">
                  {['SAG-AFTRA', 'Non-Union', 'Equity'].map((union, i) => (
                    <label key={union} className="flex items-center justify-between px-4 py-2.5 rounded-xl cursor-pointer hover:bg-white/[0.03] border border-transparent hover:border-white/5 transition-all group">
                      <span className="font-outfit text-sm text-[#d0c6ab] group-hover:text-[#fff6df] transition-colors">{union}</span>
                      <div className="relative flex items-center justify-center">
                        <input defaultChecked={i === 0} className="peer sr-only" type="checkbox"/>
                        <div className="w-5 h-5 rounded-[6px] border border-[#4d4732] bg-[var(--as-bg)] peer-checked:bg-[#ffd700] peer-checked:border-[#ffd700] transition-colors flex items-center justify-center">
                          <svg className="w-3.5 h-3.5 text-[#131314] opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Location */}
              <div className="space-y-4 pt-4">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#d0c6ab]/30"></div>
                  <p className="font-outfit font-semibold text-[11px] text-[var(--as-text)] uppercase tracking-[0.15em]">Location Hubs</p>
                </div>
                <div className="relative">
                  <select className="w-full bg-[var(--as-bg)]/80 backdrop-blur-md appearance-none border border-[#4d4732]/50 hover:border-[#4d4732] rounded-xl px-4 py-3.5 text-sm text-[var(--as-text)] focus:border-[#ffd700]/50 focus:ring-1 focus:ring-[#ffd700]/50 transition-all outline-none font-outfit shadow-inner cursor-pointer">
                    <option>Global Hubs</option>
                    <option>Los Angeles (LA)</option>
                    <option>New York City (NYC)</option>
                    <option>London</option>
                    <option>Vancouver</option>
                  </select>
                  <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-[#8c8574]">
                    <span className="material-symbols-outlined text-[20px]">expand_more</span>
                  </div>
                </div>
              </div>

              {/* Experience */}
              <div className="space-y-4 pt-4">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#d0c6ab]/30"></div>
                  <p className="font-outfit font-semibold text-[11px] text-[var(--as-text)] uppercase tracking-[0.15em]">Experience Level</p>
                </div>
                <div className="flex flex-wrap gap-2.5">
                  <button className="px-4 py-2 bg-[#2a2a2b]/50 border border-white/5 rounded-xl text-[13px] font-outfit text-[#d0c6ab] hover:border-[#ffd700]/50 hover:text-[#fff6df] hover:bg-[#ffd700]/5 transition-all">Emerging</button>
                  <button className="px-4 py-2 bg-[#ffd700]/10 border border-[#ffd700]/30 rounded-xl text-[13px] font-outfit font-medium text-[#ffe16d] shadow-[0_0_10px_rgba(255,215,0,0.1)]">Mid-Career</button>
                  <button className="px-4 py-2 bg-[#2a2a2b]/50 border border-white/5 rounded-xl text-[13px] font-outfit text-[#d0c6ab] hover:border-[#ffd700]/50 hover:text-[#fff6df] hover:bg-[#ffd700]/5 transition-all">Veteran</button>
                </div>
              </div>

              <button 
                onClick={() => setIsFilterOpen(false)}
                className="mt-8 w-full bg-gradient-to-r from-[#ffd700] to-[#e9c400] text-[#221b00] hover:shadow-[0_0_20px_rgba(255,215,0,0.3)] font-outfit font-bold tracking-wide text-[14px] py-4 rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                Apply Filters
              </button>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="px-[20px] md:px-[64px] max-w-[1600px] mx-auto py-12">
          <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div>
              <h1 className="font-syne text-[40px] md:text-[48px] leading-[1.2] font-bold text-[#fff6df] mb-2">Talent Directory</h1>
              <p className="font-outfit text-[18px] text-[#d0c6ab]">Showing {filteredTalents.length} Professionals</p>
            </div>
            <div className="flex items-center gap-4 bg-[#201f20] p-1 rounded-xl border border-white/5">
              <button
                onClick={() => setIsFilterOpen(true)}
                className="flex items-center gap-2 p-2 px-4 bg-[var(--as-bg)] hover:bg-white/5 border border-white/10 text-[#d0c6ab] hover:text-[#ffd700] rounded-lg transition-all font-outfit text-sm font-semibold"
              >
                <span className="material-symbols-outlined text-[18px]">tune</span>
                Filter
              </button>
            </div>
          </header>

          {/* Recommended Section (Only shows if they have matches and aren't heavily filtering) */}
          {!loading && recommendedTalents.length > 0 && activeCategory === "All Talent" && (
            <div className="mb-16">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1.5 h-6 rounded-full bg-gradient-to-b from-[#ffd700] to-[#e9c400]"></div>
                <h2 className="font-syne text-[24px] font-bold text-[#fff6df]">Recommended For You</h2>
                <span className="ml-2 px-3 py-1 bg-[#ffd700]/10 border border-[#ffd700]/20 rounded-full text-[11px] font-outfit text-[#ffe16d] uppercase tracking-wider">Similar Craft</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-[24px]">
                {recommendedTalents.slice(0, 4).map((talent) => (
                  <TalentCard key={talent.id} talent={talent} initials={initials} router={router} handleConnect={handleConnect} getConnection={getConnection} handleAccept={handleAcceptConnection} currentUser={currentUser} />
                ))}
              </div>
            </div>
          )}

          {/* All Talent Section */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <h2 className="font-syne text-[24px] font-bold text-[var(--as-text)]">{activeCategory === "All Talent" ? "Explore Network" : activeCategory}</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-[24px]">
              {loading ? (
                <p className="text-[#d0c6ab] font-outfit">Loading talent directory...</p>
              ) : filteredTalents.slice(0, visibleCount).map((talent) => (
                <TalentCard key={talent.id} talent={talent} initials={initials} router={router} handleConnect={handleConnect} getConnection={getConnection} handleAccept={handleAcceptConnection} currentUser={currentUser} />
              ))}
            </div>
          </div>

          {/* Pagination / Load More */}
          {!loading && filteredTalents.length > visibleCount && (
            <div className="mt-16 flex justify-center">
              <button
                onClick={() => setVisibleCount(c => c + 15)}
                className="group flex items-center gap-3 px-8 py-4 border border-white/10 rounded-full text-[#d0c6ab] hover:text-[#ffd700] hover:border-[#ffd700] transition-all"
              >
                <span className="font-outfit font-semibold text-[14px]">Load More Talent</span>
                <span className="material-symbols-outlined transition-transform group-hover:translate-y-1">expand_more</span>
              </button>
            </div>
          )}
        </main>

        {/* Mobile BottomNavBar */}
        <nav className="md:hidden fixed bottom-0 left-0 w-full bg-[#201f20]/90 backdrop-blur-2xl border-t border-white/10 px-6 py-3 flex justify-between items-center z-50">
          <button className="flex flex-col items-center gap-1 text-[#ffd700]">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>explore</span>
            <span className="text-[10px] font-bold font-outfit">Discover</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-[#d0c6ab] hover:text-[var(--as-text)] transition-colors">
            <span className="material-symbols-outlined">movie</span>
            <span className="text-[10px] font-outfit">Projects</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-[#d0c6ab] hover:text-[var(--as-text)] transition-colors">
            <span className="material-symbols-outlined">group</span>
            <span className="text-[10px] font-outfit">Network</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-[#d0c6ab] hover:text-[var(--as-text)] transition-colors">
            <span className="material-symbols-outlined">assignment_ind</span>
            <span className="text-[10px] font-outfit">Castings</span>
          </button>
        </nav>

      </div>
    </>
  );
}

// Extracted TalentCard component for clean reuse
function TalentCard({ talent, initials, router, handleConnect, getConnection, handleAccept, currentUser }: any) {
  const rawConn = getConnection ? getConnection(talent.owner) : null;
  const connStatus = rawConn ? String(rawConn.status).toUpperCase() : null; // 'PENDING' | 'ACCEPTED' | null
  const isIncoming = rawConn && String(rawConn.to_user) === String(currentUser?.user_id);
  const isSelf = currentUser && String(talent.owner) === String(currentUser.user_id);
  
  return (
    <div className="glass-card rounded-2xl overflow-hidden group flex flex-col h-full transition-all hover:translate-y-[-4px]">
      <div className="relative aspect-[2/3] overflow-hidden bg-[#0e0e0f]">
        {/* Cinematic gradient backdrop — always rendered (visible behind image or as standalone) */}
        <div
          className="absolute inset-0 transition-transform duration-700 group-hover:scale-110"
          style={{
            background: `
              radial-gradient(ellipse at 20% 30%, rgba(255,215,0,0.08) 0%, transparent 55%),
              radial-gradient(ellipse at 80% 70%, rgba(225,1,17,0.06) 0%, transparent 50%),
              linear-gradient(160deg, #1c1b1c 0%, #0e0e0f 40%, #131314 70%, #1a1800 100%)
            `,
          }}
        />
        {/* Subtle film-grain texture overlay */}
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
            backgroundSize: '120px 120px',
          }}
        />

        {talent.avatar ? (
          <img 
            alt={talent.name} 
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 mix-blend-luminosity opacity-70" 
            src={talent.avatar} 
          />
        ) : (
          /* No avatar — show large cinematic initials */
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <span
              className="font-syne font-extrabold text-[72px] leading-none select-none"
              style={{
                background: 'linear-gradient(135deg, #ffd700 0%, #e9c400 40%, #fff6df 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                filter: 'drop-shadow(0 0 30px rgba(255,215,0,0.25))',
                opacity: 0.9,
              }}
            >
              {initials(talent.name)}
            </span>
            {/* Spotlight ring under initials */}
            <div className="w-24 h-1 rounded-full" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,215,0,0.4), transparent)' }} />
          </div>
        )}

        {/* Bottom vignette — pulls card info up cinematically */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0e0e0f] via-[#131314]/40 to-transparent" />
        {/* Top vignette */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0e0e0f]/60 via-transparent to-transparent" />
        {/* Rim-light gold glow on hover */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(255,215,0,0.12) 0%, transparent 60%)' }}
        />

        <div className="absolute top-4 left-4 flex flex-col gap-2">
          <span className="bg-[#ffd700]/90 text-[#705e00] px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider backdrop-blur-md">Verified</span>
        </div>
        <button onClick={() => router.push(`/profile/${talent.id}`)} className="absolute bottom-4 right-4 w-12 h-12 bg-white/10 backdrop-blur-xl border border-white/20 rounded-full flex items-center justify-center text-white hover:bg-[#ffd700] hover:text-[#705e00] transition-all group/play">
          <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
        </button>
      </div>

      <div className="p-6 flex flex-col flex-1">
        <div className="mb-4">
          <h3 className="font-syne font-bold text-xl text-[#fff6df]">{talent.name}</h3>
          <p className="text-[#d0c6ab] font-outfit text-sm">{talent.category || "Industry Professional"}</p>
        </div>
        <div className="flex flex-wrap gap-2 mb-6">
          <div className="role-chip px-3 py-1 flex items-center gap-2 border-l-[#ffd700]">
            <span className="text-[11px] font-bold font-outfit text-[var(--as-text)]">SAG-AFTRA</span>
          </div>
          <div className="bg-[#353436]/50 border border-white/5 px-3 py-1 rounded text-[11px] font-outfit text-[#d0c6ab]">
            {talent.followers} Followers
          </div>
        </div>
        <div className="mt-auto flex gap-3">
          <button 
            onClick={() => router.push(`/profile/${talent.id}`)}
            className="flex-1 bg-[#ffd700] text-[#705e00] font-outfit font-semibold text-[14px] py-2.5 rounded-lg spotlight-glow transition-all"
          >
            View Profile
          </button>
          {!isSelf && talent.owner != null && (
            <div className="flex items-center gap-2">
              {connStatus === 'PENDING' && isIncoming ? (
                <button
                  onClick={(e) => handleAccept(e, rawConn.id)}
                  className="w-11 flex items-center justify-center border border-[#4ade80]/50 rounded-lg transition-all text-[#4ade80] bg-[#4ade80]/10 hover:bg-[#4ade80]/20 cursor-pointer"
                  title="Accept Connection"
                >
                  <span className="material-symbols-outlined">check</span>
                </button>
              ) : null}
              <button
                disabled={connStatus !== null}
                onClick={(e) => { if (!connStatus) handleConnect(e, talent.owner); }}
                className={`w-11 flex items-center justify-center border rounded-lg transition-all ${
                  connStatus === 'ACCEPTED' ? 'border-[#ffd700]/50 text-[#ffd700] bg-[#ffd700]/10 cursor-default' :
                  connStatus === 'PENDING' ? 'border-[#d0c6ab]/50 text-[#d0c6ab] bg-white/5 cursor-default' :
                  'border-white/10 text-[var(--as-text)] hover:bg-white/5 cursor-pointer'
                }`}
                title={connStatus === 'ACCEPTED' ? 'Connected' : connStatus === 'PENDING' ? 'Pending' : 'Connect'}
              >
                <span className="material-symbols-outlined">
                  {connStatus === 'ACCEPTED' ? 'how_to_reg' : connStatus === 'PENDING' ? 'schedule' : 'person_add'}
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
