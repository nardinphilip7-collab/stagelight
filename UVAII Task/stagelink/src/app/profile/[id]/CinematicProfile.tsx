import React from "react";
import Link from "next/link";
import { Edit2, Share2, Play, Verified, Building2, Mail, Globe, UserPlus, Check, X, CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api";

interface CinematicProfileProps {
  talent: any;
  isOwner: boolean;
  children?: React.ReactNode;
  currentUser?: any;
  connectionStatus?: 'PENDING' | 'ACCEPTED' | null;
  connectionId?: number | null;
  isIncomingConnection?: boolean;
  connecting?: boolean;
  creditsCount?: number;
  onConnect?: () => void;
  onAcceptConnection?: () => void;
  onRejectConnection?: () => void;
}

export default function CinematicProfile({ 
  talent, 
  isOwner, 
  children,
  currentUser,
  connectionStatus,
  connectionId,
  isIncomingConnection,
  connecting,
  creditsCount,
  onConnect,
  onAcceptConnection,
  onRejectConnection
}: CinematicProfileProps) {
  const [endorsements, setEndorsements] = useState<any[]>([]);
  const [showConnectConfirm, setShowConnectConfirm] = useState(false);
  const [showWithdrawConfirm, setShowWithdrawConfirm] = useState(false);

  useEffect(() => {
    if (talent?.id) {
      apiClient.get(`/endorsements/?talent=${talent.id}`)
        .then((data: any) => setEndorsements(Array.isArray(data) ? data : []))
        .catch(() => {});
    }
  }, [talent?.id]);
  // Safe fallbacks
  const name = talent.name || "Talent Name";
  const category = talent.category || "Creative Professional";
  const avatar = talent.avatar || null;
  // Neutral dark gradient fallback — never present a stranger's photo as the user's cover.
  const coverFallback = "linear-gradient(135deg, #1a1a1b 0%, #131314 45%, #0e0e0f 100%)";
  const coverBg = talent.cover_gradient && /^https?:\/\//.test(talent.cover_gradient) ? talent.cover_gradient : null;
  const bio = talent.bio || "No professional narrative provided yet.";
  
  const credits = Array.isArray(talent.credits) ? talent.credits : [];
  const skills = Array.isArray(talent.skills) ? talent.skills : [];
  const rating = talent.rating ? talent.rating.toFixed(1) : "—";
  // Prefer the real credit count (Credit rows) passed from the parent; fall back to legacy JSON.
  const productions = creditsCount ?? credits.length;

  const height = talent.physical_stats?.height || "—";
  const hair = talent.physical_stats?.hair_color || "—";
  const eyes = talent.physical_stats?.eye_color || "—";

  return (
    <div className="font-[var(--font-outfit)] bg-[var(--color-surface-dim)] min-h-screen text-[var(--color-on-surface)] pb-20">
      
      {/* ─── SECTION 1: CINEMATIC HERO ─── */}
      <section className="relative h-[614px] md:h-[716px] flex items-end overflow-hidden">
        <div className="absolute inset-0 z-0 bg-[#0e0e0f]">
          {/* Same gradient found in login without the picture */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#ffd700]/10 blur-[120px] rounded-full pointer-events-none"></div>
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_20%_30%,_rgba(255,215,0,0.05)_0%,_transparent_50%)]"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-surface)] via-transparent to-transparent" />
        </div>
        
        <div className="relative z-10 w-full px-5 md:px-16 pb-12 max-w-[1440px] mx-auto flex flex-col items-start md:flex-row md:items-end gap-8">
          <div className="relative group shrink-0">
            <div className="absolute -inset-1 bg-[var(--color-primary-container)] rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
            <img 
              alt="Portrait" 
              className="relative w-32 h-44 md:w-48 md:h-64 object-cover rounded-lg border-2 border-[var(--color-primary-container)]/50 shadow-2xl" 
              src={avatar} 
            />
          </div>
          
          <div className="flex-grow">
            <h1 className="font-[var(--font-syne)] text-[40px] md:text-[64px] text-white mb-2 tracking-tight font-extrabold leading-tight">
              {name}
            </h1>
            <p className="font-[var(--font-syne)] text-[24px] md:text-[32px] font-bold text-[var(--color-primary-fixed)] mb-6">
              {category} {talent.union_name ? `| ${talent.union_name}` : ""}
            </p>
            
            <div className="flex flex-wrap gap-4">
              {isOwner ? (
                <Link href={`/profile/edit`} className="px-8 py-3 bg-[var(--color-primary-container)] text-[var(--color-on-primary-fixed)] font-bold rounded-lg hover:shadow-[0_0_20px_rgba(255,215,0,0.15)] transition-all active:scale-95 flex items-center gap-2">
                  <Edit2 className="w-5 h-5" /> Edit Profile
                </Link>
              ) : null}
              {currentUser && !isOwner && (
                <>
                  {connectionStatus === 'PENDING' && isIncomingConnection ? (
                    <div className="flex gap-2">
                      <button onClick={onAcceptConnection} disabled={connecting} className="px-8 py-3 bg-[#4ade80]/20 text-[#4ade80] border border-[#4ade80]/50 font-bold rounded-lg hover:bg-[#4ade80]/30 transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                        <Check className="w-5 h-5" /> Accept
                      </button>
                      <button onClick={onRejectConnection} disabled={connecting} className="px-8 py-3 bg-red-500/20 text-red-500 border border-red-500/50 font-bold rounded-lg hover:bg-red-500/30 transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                        <X className="w-5 h-5" /> Reject
                      </button>
                    </div>
                  ) : connectionStatus === 'PENDING' && !isIncomingConnection ? (
                    <button onClick={() => setShowWithdrawConfirm(true)} disabled={connecting} className="px-8 py-3 bg-white/5 text-[var(--color-on-surface-variant)] border border-white/10 font-bold rounded-lg hover:bg-white/10 hover:text-white transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                      <X className="w-5 h-5" /> Withdraw Request
                    </button>
                  ) : (
                    <button onClick={() => setShowConnectConfirm(true)} disabled={connecting || connectionStatus !== null || !talent.owner} className="px-8 py-3 bg-[#a80000] text-white font-bold rounded-lg border border-[#a80000] hover:bg-[#8b0000] transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                      {connectionStatus === 'ACCEPTED' ? <CheckCircle2 className="w-5 h-5" /> : connectionStatus === 'PENDING' ? null : <UserPlus className="w-5 h-5" />}
                      {connectionStatus === 'ACCEPTED' ? "Connected" : connectionStatus === 'PENDING' ? "Requested" : "Request Connection"}
                    </button>
                  )}
                </>
              )}

            </div>
          </div>
        </div>
      </section>

      <div className="px-5 md:px-16 max-w-[1440px] mx-auto py-16 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* ─── MAIN COLUMN ─── */}
        <div className="lg:col-span-8 flex flex-col gap-16">
          {children}
        </div>

        {/* ─── SIDEBAR COLUMN ─── */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          {/* Professional Stats */}
          <section className="bg-[rgba(22,22,24,0.7)] backdrop-blur-[20px] border border-white/5 p-8 rounded-2xl flex flex-col gap-8">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-[var(--color-surface-container-low)] border border-[var(--color-outline-variant)]/10 text-center">
                <p className="font-[var(--font-syne)] text-[64px] font-extrabold text-[var(--color-primary)] mb-1 leading-none">{productions}</p>
                <p className="font-semibold text-sm text-[var(--color-on-surface-variant)] uppercase tracking-widest">Productions</p>
              </div>
              <div className="p-4 rounded-xl bg-[var(--color-surface-container-low)] border border-[var(--color-outline-variant)]/10 text-center">
                <p className="font-[var(--font-syne)] text-[64px] font-extrabold text-[var(--color-primary)] mb-1 leading-none">{rating}</p>
                <p className="font-semibold text-sm text-[var(--color-on-surface-variant)] uppercase tracking-widest">Talent Rating</p>
              </div>
            </div>
            
            {talent.verified && (
              <div className="flex items-center justify-between p-4 rounded-xl bg-[var(--color-primary-container)]/10 border border-[var(--color-primary-container)]/20">
                <div className="flex items-center gap-3">
                  <Verified className="w-6 h-6 text-[var(--color-primary-container)]" />
                  <span className="font-bold text-white">Verified Profile</span>
                </div>
                <span className="font-semibold text-sm text-[var(--color-primary)]">Active</span>
              </div>
            )}
            
            <div className="space-y-4">
              <h3 className="font-semibold text-sm text-[var(--color-on-surface-variant)] uppercase tracking-widest">Attributes</h3>
              <div className="flex flex-col gap-3">
                <div className="flex justify-between">
                  <span className="text-[var(--color-on-surface-variant)]">Height</span>
                  <span className="text-white">{height}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--color-on-surface-variant)]">Hair</span>
                  <span className="text-white">{hair}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--color-on-surface-variant)]">Eyes</span>
                  <span className="text-white">{eyes}</span>
                </div>
              </div>
            </div>
          </section>

          {/* Endorsements */}
          <section className="bg-[rgba(22,22,24,0.7)] backdrop-blur-[20px] border border-white/5 p-8 rounded-2xl">
            <h3 className="font-[var(--font-syne)] text-[32px] font-bold text-white mb-6">Industry Endorsements</h3>
            <div className="flex flex-col gap-6">
              {endorsements.length === 0 ? (
                <p className="text-[var(--color-on-surface-variant)] text-sm">No endorsements yet.</p>
              ) : (
                endorsements.slice(0, 3).map((e: any, idx: number) => (
                  <div key={idx} className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-[var(--color-surface-container)] shrink-0 flex items-center justify-center">
                      {e.author_avatar ? (
                        <img src={e.author_avatar} alt={e.author_name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="font-bold text-white">{e.author_name?.charAt(0)}</span>
                      )}
                    </div>
                    <div>
                      <p className="text-white font-bold">{e.author_name}</p>
                      <p className="font-semibold text-sm text-[var(--color-primary)] mb-2 italic">{e.author_role || "Industry Professional"}</p>
                      <p className="text-[16px] text-[var(--color-on-surface-variant)] line-clamp-3">"{e.text}"</p>
                    </div>
                  </div>
                ))
              )}
            </div>
            {endorsements.length > 3 && (
              <button className="w-full mt-8 py-3 border border-[var(--color-outline-variant)]/30 text-white font-semibold text-sm rounded-lg hover:bg-white/5 transition-all">
                View All {endorsements.length} Endorsements
              </button>
            )}
          </section>

          {/* Booking & Management */}
          <section className="bg-[rgba(22,22,24,0.7)] backdrop-blur-[20px] border border-white/5 p-8 rounded-2xl bg-gradient-to-br from-[var(--color-surface-container-high)] to-[var(--color-surface)]">
            <h3 className="font-[var(--font-syne)] text-[32px] font-bold text-white mb-6">Booking &amp; Management</h3>
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3 text-[var(--color-on-surface-variant)]">
                <Building2 className="w-5 h-5 text-[var(--color-primary)]" />
                <span>{talent.agency || "Independent Representation"}</span>
              </div>
              <div className="flex items-center gap-3 text-[var(--color-on-surface-variant)]">
                <Mail className="w-5 h-5 text-[var(--color-primary)]" />
                <span>Contact via StageLight Direct</span>
              </div>
              {Object.entries(talent.social_links || {}).map(([platform, url]) => (
                <div key={platform} className="flex items-center gap-3 text-[var(--color-on-surface-variant)]">
                  <Globe className="w-5 h-5 text-[var(--color-primary)]" />
                  <a href={url as string} target="_blank" rel="noreferrer" className="hover:text-white transition-colors">
                    {String(url).replace(/^https?:\/\//, '')}
                  </a>
                </div>
              ))}
            </div>
          </section>
          
        </div>
      </div>

      {/* Confirmation Modals */}
      {showConnectConfirm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="relative w-full max-w-sm bg-[#201f20]/90 backdrop-blur-2xl border border-white/10 rounded-2xl p-6 shadow-2xl">
            <h3 className="font-[var(--font-syne)] text-[#fff6df] text-xl font-bold mb-2">Send Connection Request</h3>
            <p className="text-[#d0c6ab] font-outfit text-sm mb-6">Are you sure you want to connect with {name}?</p>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowConnectConfirm(false)}
                className="flex-1 py-2.5 rounded-full border border-white/10 text-[#d0c6ab] hover:text-[#fff6df] hover:bg-white/5 transition-all font-outfit text-sm font-semibold"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  setShowConnectConfirm(false);
                  if (onConnect) onConnect();
                }}
                className="flex-1 py-2.5 rounded-full bg-[#a80000] text-white hover:brightness-110 transition-all font-outfit text-sm font-semibold shadow-lg shadow-[#a80000]/20"
              >
                Connect
              </button>
            </div>
          </div>
        </div>
      )}

      {showWithdrawConfirm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="relative w-full max-w-sm bg-[#201f20]/90 backdrop-blur-2xl border border-white/10 rounded-2xl p-6 shadow-2xl">
            <h3 className="font-[var(--font-syne)] text-[#fff6df] text-xl font-bold mb-2">Withdraw Request</h3>
            <p className="text-[#d0c6ab] font-outfit text-sm mb-6">Are you sure you want to withdraw this connection request? This action cannot be undone.</p>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowWithdrawConfirm(false)}
                className="flex-1 py-2.5 rounded-full border border-white/10 text-[#d0c6ab] hover:text-[#fff6df] hover:bg-white/5 transition-all font-outfit text-sm font-semibold"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  setShowWithdrawConfirm(false);
                  if (onRejectConnection) onRejectConnection();
                }}
                className="flex-1 py-2.5 rounded-full bg-[#e10111] text-white hover:brightness-110 transition-all font-outfit text-sm font-semibold shadow-lg shadow-[#e10111]/20"
              >
                Withdraw
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
