"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiClient } from "@/lib/api";
import { getUser } from "@/lib/auth";

interface HirerData {
  id: number;
  name: string;
  email: string;
  role: string;
  date_joined: string;
}

interface Opportunity {
  id: string;
  title: string;
  company: string;
  deadline: string;
  applicants: number;
  urgent: boolean;
  posted: string;
}

const T = {
  bg:            "#131314",
  surface:       "#201f20",
  surfaceLowest: "#0e0e0f",
  surfaceHigh:   "#2a2a2b",
  surfaceHighest:"#353436",
  gold:          "#ffd700",
  goldFixed:     "#ffe16d",
  onGold:        "#3a3000",
  red:           "#e10111",
  outline:       "#999077",
  text:          "#e5e2e3",
  muted:         "#d0c6ab",
  mutedDim:      "#999077",
  syne:          "var(--font-syne, 'Syne', sans-serif)",
  outfit:        "var(--font-outfit, 'Outfit', sans-serif)",
};

const GRADIENTS = [
  "linear-gradient(135deg, #1a0a2e 0%, #0a1a3e 50%, #0e1a2e 100%)",
  "linear-gradient(135deg, #1a1208 0%, #2a1e0a 50%, #1a1510 100%)",
  "linear-gradient(135deg, #0a1a1e 0%, #051818 50%, #091412 100%)",
  "linear-gradient(135deg, #1e0a0a 0%, #2a0808 50%, #1a0a10 100%)",
];

export default function PublicHirerProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);

  const [hirer, setHirer] = useState<HirerData | null>(null);
  const [jobs, setJobs] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [connectionStatus, setConnectionStatus] = useState<'PENDING' | 'ACCEPTED' | null>(null);
  const [connectionId, setConnectionId] = useState<number | null>(null);
  const [isIncomingConnection, setIsIncomingConnection] = useState(false);
  const [connecting, setConnecting] = useState(false);
  
  const [editingBio, setEditingBio] = useState(false);
  const [customBio, setCustomBio] = useState("");

  
  const currentUser = getUser();
  const isOwner = currentUser && String(id) === String(currentUser.user_id);

  useEffect(() => {
    Promise.all([
      apiClient.get<HirerData[]>("/hirers/").then(res => res.find(h => h.id === Number(id)) || null),
      apiClient.get<Opportunity[]>(`/opportunities/?owner=${id}`).catch(() => [] as Opportunity[]),
      currentUser && String(id) !== String(currentUser.user_id) 
        ? apiClient.get<any[]>('/connections/').catch(() => [])
        : Promise.resolve([])
    ]).then(([hData, opps, conns]) => {
      if (!hData) {
        router.push("/search");
        return;
      }
      setHirer(hData);
      setJobs(opps);
      
      if (currentUser && String(id) !== String(currentUser.user_id) && conns.length > 0) {
        const conn = conns.find((c: any) => 
          (String(c.from_user) === String(currentUser.user_id) && String(c.to_user) === String(id)) ||
          (String(c.from_user) === String(id) && String(c.to_user) === String(currentUser.user_id))
        );
        if (conn) {
          setConnectionStatus(conn.status as 'PENDING' | 'ACCEPTED');
          setConnectionId(conn.id);
          setIsIncomingConnection(String(conn.to_user) === String(currentUser.user_id));
        }
      }
      const savedBio = localStorage.getItem(`hirer_bio_${id}`);
      if (savedBio) setCustomBio(savedBio);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [id, router]);

  const handleConnect = async () => {
    if (!currentUser || !hirer) return;
    setConnecting(true);
    try { 
      const res = await apiClient.post<any>('/connections/', { to_user: hirer.id }); 
      setConnectionStatus('PENDING'); 
      setConnectionId(res.id);
    }
    catch (err) { console.error(err); }
    finally { setConnecting(false); }
  };

  const handleAcceptConnection = async () => {
    if (!connectionId) return;
    setConnecting(true);
    try {
      await apiClient.patch(`/connections/${connectionId}/accept/`, {});
      setConnectionStatus('ACCEPTED');
    } catch (err) { console.error(err); } 
    finally { setConnecting(false); }
  };

  const handleRejectConnection = async () => {
    if (!connectionId) return;
    setConnecting(true);
    try {
      await apiClient.delete(`/connections/${connectionId}/`);
      setConnectionStatus(null);
      setConnectionId(null);
      setIsIncomingConnection(false);
    } catch (err) { console.error(err); } 
    finally { setConnecting(false); }
  };

  if (loading) {
    return (
      <div style={{ backgroundColor: T.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "16px", width: "400px", padding: "32px" }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ height: "80px", borderRadius: "12px", background: "linear-gradient(90deg,#1c1b1c 25%,#2a2a2b 50%,#1c1b1c 75%)", backgroundSize: "200% 100%", animation: "h-shimmer 1.5s infinite" }} />
          ))}
        </div>
      </div>
    );
  }

  if (!hirer) return null;

  return (
    <div style={{ backgroundColor: T.bg, minHeight: "100vh", color: T.text, fontFamily: T.outfit }}>
      <main className="hp-main">
        {/* Hero */}
        <section style={{ position: "relative", height: "clamp(340px, 50vh, 414px)", width: "100%", overflow: "hidden", backgroundColor: "#0e0e0f" }}>
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#ffd700]/10 blur-[120px] rounded-full pointer-events-none"></div>
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_20%_30%,_rgba(255,215,0,0.05)_0%,_transparent_50%)]"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-surface)] via-transparent to-transparent" style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "220px", background: `linear-gradient(to top, ${T.bg} 0%, transparent 100%)`, zIndex: 10 }} />

          <div style={{ position: "absolute", bottom: 0, left: 0, width: "100%", padding: "0 clamp(20px, 5vw, 64px) 48px", zIndex: 20, display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: "32px", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "flex-end", gap: "24px", flexWrap: "wrap" }}>
              <div className="hp-glass hp-rim" style={{ width: "100px", height: "100px", borderRadius: "16px", padding: "12px", flexShrink: 0 }}>
                <div style={{ width: "100%", height: "100%", backgroundColor: T.surfaceLowest, borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span className="material-symbols-outlined" style={{ color: T.goldFixed, fontSize: "42px", fontVariationSettings: "'FILL' 1" }}>public</span>
                </div>
              </div>
              <div>
                <h1 style={{ fontFamily: T.syne, fontSize: "clamp(28px, 3vw, 48px)", fontWeight: "800", color: T.goldFixed, margin: "0 0 10px", lineHeight: "1.05", letterSpacing: "-0.02em" }}>
                  {hirer.name}
                </h1>
                <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: "4px", color: T.muted, fontSize: "14px" }}>
                    <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>verified</span>
                    {hirer.role === "AGENCY" ? "Agency" : "Verified Organization"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Main Grid ── */}
        <div className="hp-grid" style={{ maxWidth: "1440px", margin: "0 auto", padding: "clamp(24px, 5vw, 64px)" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "48px" }}>
            <div className="hp-glass hp-rim" style={{ padding: "32px", borderRadius: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                <h2 style={{ fontFamily: T.syne, fontSize: "24px", fontWeight: "700", color: T.goldFixed, margin: 0 }}>About</h2>
                {isOwner && (
                  <button
                    onClick={() => {
                      if (editingBio) {
                        localStorage.setItem(`hirer_bio_${id}`, customBio);
                        setEditingBio(false);
                      } else {
                        setEditingBio(true);
                      }
                    }}
                    className="flex items-center gap-2 font-outfit text-[13px] font-bold text-[#ffd700] px-4 py-2 rounded-xl border border-[#ffd700]/30 bg-[#ffd700]/5 hover:bg-[#ffd700]/15 transition-all"
                  >
                    {editingBio ? "Save" : "Edit"}
                  </button>
                )}
              </div>
              
              {editingBio ? (
                <textarea
                  value={customBio}
                  onChange={(e) => setCustomBio(e.target.value)}
                  className="w-full bg-[rgba(255,255,255,0.05)] border border-white/10 rounded-xl p-4 text-[#d0c6ab] font-outfit text-[15px] focus:outline-none focus:border-[#ffd700]/50 min-h-[120px] mb-6"
                  placeholder="Tell us about your legacy..."
                />
              ) : customBio ? (
                <p style={{ color: T.muted, fontSize: "16px", lineHeight: "1.7", marginBottom: "24px", whiteSpace: "pre-wrap" }}>
                  {customBio}
                </p>
              ) : isOwner ? (
                <button
                  type="button"
                  onClick={() => setEditingBio(true)}
                  className="hover:bg-[#ffd700]/10 transition-all"
                  style={{ width: "100%", textAlign: "left", marginBottom: "24px", padding: "16px", borderRadius: "12px", border: "1px dashed rgba(255,215,0,0.3)", background: "rgba(255,215,0,0.04)", color: T.mutedDim, fontSize: "15px", lineHeight: "1.6", cursor: "pointer" }}
                >
                  + Add your legacy — tell talent about your {hirer.role === "AGENCY" ? "agency" : "production house"}, your mission, and what you are known for.
                </button>
              ) : (
                <p style={{ color: T.mutedDim, fontSize: "15px", marginBottom: "24px" }}>
                  No description added yet.
                </p>
              )}
              
              <div>
                {[
                  { label: "Member Since", value: hirer.date_joined ? new Date(hirer.date_joined).getFullYear().toString() : "—" },
                  { label: "Active Productions", value: String(jobs.length) },
                ].map(row => (
                  <div key={row.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0", borderBottom: "1px solid rgba(77,71,50,0.15)" }}>
                    <span style={{ color: T.mutedDim, fontSize: "14px", fontWeight: "600", letterSpacing: "0.03em" }}>{row.label}</span>
                    <span style={{ color: "#fff6df", fontSize: "16px", fontWeight: "600" }}>{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "64px" }}>
            <section>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "32px" }}>
                <div>
                  <h2 style={{ fontFamily: T.syne, fontSize: "28px", fontWeight: "700", color: T.goldFixed, margin: "0 0 6px" }}>Active Productions</h2>
                  <p style={{ color: T.mutedDim, fontSize: "14px", margin: 0 }}>Currently open or in active development.</p>
                </div>
              </div>

              {jobs.length === 0 ? (
                <div className="hp-glass" style={{ borderRadius: "16px", padding: "48px", textAlign: "center" }}>
                  <span className="material-symbols-outlined" style={{ color: T.mutedDim, fontSize: "48px", display: "block", marginBottom: "12px", opacity: 0.5 }}>movie_creation</span>
                  <p style={{ color: T.mutedDim, fontSize: "14px", marginBottom: "20px" }}>No active productions yet.</p>
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "24px" }}>
                  {jobs.slice(0, 4).map((job, idx) => {
                    const isUrgent = job.urgent;
                    const isPast = job.deadline ? new Date(job.deadline) < new Date() : false;
                    const statusLabel = isUrgent ? "Live Casting" : isPast ? "Wrapped" : "Pre-Production";
                    const statusBg = isUrgent ? T.red : isPast ? T.surfaceHighest : T.surfaceHigh;
                    const statusColor = isUrgent ? "#fff" : T.goldFixed;

                    return (
                      <Link key={job.id} href={`/opportunities/${job.id}`} className="hp-prod-card hp-glass" style={{ textDecoration: 'none' }}>
                        <div style={{ height: "192px", overflow: "hidden", position: "relative" }}>
                          <div className="hp-prod-thumb" style={{ background: GRADIENTS[idx % GRADIENTS.length], width: "100%", height: "100%" }} />
                          <div style={{ position: "absolute", top: "16px", left: "16px" }}>
                            <span style={{ backgroundColor: statusBg, color: statusColor, padding: "4px 10px", borderRadius: "4px", fontSize: "10px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                              {statusLabel}
                            </span>
                          </div>
                        </div>
                        <div style={{ padding: "24px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px" }}>
                            <div>
                              <h3 style={{ fontFamily: T.syne, fontSize: "18px", fontWeight: "700", color: "#fff6df", margin: "0 0 4px" }}>{job.title}</h3>
                              <p style={{ fontSize: "13px", color: T.mutedDim, margin: 0 }}>{job.company || "Independent"}</p>
                            </div>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
