"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiClient } from "@/lib/api";
import { getUser } from "@/lib/auth";

interface MeData {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
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

interface RosterItem {
  id: string;
  name: string;
  category: string;
  avatar: string;
}

interface Connection {
  id: number;
  status: string;
  from_user: number;
  to_user: number;
  from_user_email: string;
  to_user_email: string;
}

const T = {
  bg:            "#131314",
  surface:       "#201f20",
  surfaceLow:    "#1c1b1c",
  surfaceLowest: "#0e0e0f",
  surfaceHigh:   "#2a2a2b",
  surfaceHighest:"#353436",
  glass:         "rgba(22, 22, 24, 0.7)",
  border:        "rgba(77, 71, 50, 0.2)",
  primary:       "#fff6df",
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

export default function HirerProfilePage() {
  const router = useRouter();
  const currentUser = getUser();

  const [me, setMe] = useState<MeData | null>(null);
  const [jobs, setJobs] = useState<Opportunity[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [team, setTeam] = useState<RosterItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({ first_name: "", last_name: "" });
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState("");

  const [editingBio, setEditingBio] = useState(false);
  const [customBio, setCustomBio] = useState("");

  useEffect(() => {
    if (!currentUser) { router.push("/login"); return; }
    if (currentUser.role !== "HIRER" && currentUser.role !== "AGENCY") {
      router.replace("/profile/edit");
      return;
    }

    Promise.all([
      apiClient.get<MeData>("/auth/me/"),
      apiClient.get<Opportunity[]>("/opportunities/?owner=me").catch(() => [] as Opportunity[]),
      apiClient.get<Connection[]>("/connections/").catch(() => [] as Connection[]),
    ]).then(([meData, opps, conns]) => {
      setMe(meData);
      setEditForm({ first_name: meData.first_name || "", last_name: meData.last_name || "" });
      setJobs(opps);
      setConnections(conns);
      const savedBio = localStorage.getItem(`hirer_bio_${meData.id}`);
      if (savedBio) setCustomBio(savedBio);
    }).catch(() => {}).finally(() => setLoading(false));

    if (currentUser.role === "AGENCY") {
      apiClient.get<RosterItem[]>("/roster/").then(setTeam).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const displayName = me
    ? [me.first_name, me.last_name].filter(Boolean).join(" ") || me.email.split("@")[0]
    : "Studio";

  const acceptedConns = connections.filter(c => c.status === "ACCEPTED");

  const talentItems: Array<{ key: string; name: string; role: string }> =
    currentUser?.role === "AGENCY"
      ? team.slice(0, 3).map(t => ({ key: t.id, name: t.name, role: t.category }))
      : acceptedConns.slice(0, 3).map(c => {
          const email = c.from_user === currentUser?.user_id ? c.to_user_email : c.from_user_email;
          return { key: String(c.id), name: email.split("@")[0], role: "Connected" };
        });



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

  return (
    <div style={{ backgroundColor: T.bg, minHeight: "100vh", color: T.text, fontFamily: T.outfit }}>

      {/* ── Main ── */}
      <main className="hp-main">

        {/* Hero */}
        <section style={{ position: "relative", height: "clamp(440px, 70vh, 614px)", width: "100%", overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, #1a1a1b 0%, #131314 35%, #0e0e0f 100%)" }} />
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 80% 50% at 50% 100%, rgba(255,215,0,0.07) 0%, transparent 70%)" }} />
          <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(rgba(255,255,255,0.025) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "320px", background: `linear-gradient(to top, ${T.bg} 0%, transparent 100%)`, zIndex: 10 }} />

          <div style={{ position: "absolute", bottom: 0, left: 0, width: "100%", padding: "0 clamp(20px, 5vw, 64px) 48px", zIndex: 20, display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: "32px", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "flex-end", gap: "24px", flexWrap: "wrap" }}>
              {/* Studio logo */}
              <div className="hp-glass hp-rim" style={{ width: "128px", height: "128px", borderRadius: "16px", padding: "16px", flexShrink: 0 }}>
                <div style={{ width: "100%", height: "100%", backgroundColor: T.surfaceLowest, borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span className="material-symbols-outlined" style={{ color: T.goldFixed, fontSize: "56px", fontVariationSettings: "'FILL' 1" }}>public</span>
                </div>
              </div>
              {/* Studio info */}
              <div>
                <h1 style={{ fontFamily: T.syne, fontSize: "clamp(36px, 4vw, 64px)", fontWeight: "800", color: T.goldFixed, margin: "0 0 10px", lineHeight: "1.05", letterSpacing: "-0.02em" }}>
                  {displayName}
                </h1>
                <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: "4px", color: T.muted, fontSize: "14px" }}>
                    <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>location_on</span>
                    {me?.email?.split("@")[1] ?? "Studio Location"}
                  </span>
                  <span style={{ width: "4px", height: "4px", backgroundColor: T.outline, borderRadius: "50%", display: "inline-block" }} />
                  <span style={{ display: "flex", alignItems: "center", gap: "4px", color: T.muted, fontSize: "14px" }}>
                    <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>verified</span>
                    {me?.role === "AGENCY" ? "Agency" : "Verified Organization"}
                  </span>
                </div>
              </div>
            </div>

            {/* CTA buttons */}
            <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
              <button
                onClick={() => setShowEditModal(true)}
                style={{ padding: "12px 32px", backgroundColor: T.gold, color: T.onGold, borderRadius: "9999px", fontFamily: T.outfit, fontSize: "14px", fontWeight: "700", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", transition: "background 0.15s, box-shadow 0.15s" }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = "#e9c400"; e.currentTarget.style.boxShadow = "0 0 15px rgba(255,225,109,0.2)"; }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = T.gold; e.currentTarget.style.boxShadow = "none"; }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: "18px", fontVariationSettings: "'FILL' 1" }}>edit</span>
                Edit Profile
              </button>
              <Link href="/manage-gigs/new" style={{ textDecoration: "none" }}>
                <button
                  style={{ padding: "12px 32px", border: `1px solid rgba(77,71,50,0.5)`, color: T.goldFixed, borderRadius: "9999px", fontFamily: T.outfit, fontSize: "14px", fontWeight: "600", backgroundColor: "transparent", cursor: "pointer", transition: "background 0.15s" }}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.08)"; }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = "transparent"; }}
                >
                  Post a Casting
                </button>
              </Link>
            </div>
          </div>
        </section>

        {/* ── Main Grid ── */}
        <div className="hp-grid" style={{ maxWidth: "1440px", margin: "0 auto", padding: "clamp(24px, 5vw, 64px)" }}>

          {/* Left Column */}
          <div style={{ display: "flex", flexDirection: "column", gap: "48px" }}>

            {/* Our Legacy */}
            <div className="hp-glass hp-rim" style={{ padding: "32px", borderRadius: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                <h2 style={{ fontFamily: T.syne, fontSize: "24px", fontWeight: "700", color: T.goldFixed, margin: 0 }}>Our Legacy</h2>
                <button
                  onClick={() => {
                    if (editingBio) {
                      if (me) localStorage.setItem(`hirer_bio_${me.id}`, customBio);
                      setEditingBio(false);
                    } else {
                      setEditingBio(true);
                    }
                  }}
                  className="flex items-center gap-2 font-outfit text-[13px] font-bold text-[#ffd700] px-4 py-2 rounded-xl border border-[#ffd700]/30 bg-[#ffd700]/5 hover:bg-[#ffd700]/15 transition-all"
                >
                  {editingBio ? "Save" : "Edit"}
                </button>
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
              ) : (
                <button
                  type="button"
                  onClick={() => setEditingBio(true)}
                  className="hover:bg-[#ffd700]/10 transition-all"
                  style={{ width: "100%", textAlign: "left", marginBottom: "24px", padding: "16px", borderRadius: "12px", border: "1px dashed rgba(255,215,0,0.3)", background: "rgba(255,215,0,0.04)", color: T.mutedDim, fontSize: "15px", lineHeight: "1.6", cursor: "pointer" }}
                >
                  + Add your legacy — tell talent about your {me?.role === "AGENCY" ? "agency" : "production house"}, your mission, and what you are known for.
                </button>
              )}
              <div>
                {[
                  { label: "Member Since", value: me?.date_joined ? new Date(me.date_joined).getFullYear().toString() : "—" },
                  { label: "Active Productions", value: String(jobs.length) },
                  { label: "Talent Connections", value: acceptedConns.length > 0 ? `${acceptedConns.length}+` : "0" },
                ].map(row => (
                  <div key={row.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0", borderBottom: "1px solid rgba(77,71,50,0.15)" }}>
                    <span style={{ color: T.mutedDim, fontSize: "14px", fontWeight: "600", letterSpacing: "0.03em" }}>{row.label}</span>
                    <span style={{ color: T.primary, fontSize: "16px", fontWeight: "600" }}>{row.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Network Perks */}
            <div>
              <h3 style={{ fontFamily: T.syne, fontSize: "24px", fontWeight: "700", color: T.goldFixed, marginBottom: "24px" }}>Network Perks</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {[
                  { icon: "groups",             title: "Priority Casting",     desc: "First access to emerging talent across all disciplines." },
                  { icon: "analytics",           title: "Production Analytics", desc: "Real-time metrics on applications and talent engagement." },
                  { icon: "workspace_premium",   title: "Verified Badge",       desc: "Enhanced visibility and trust across the platform." },
                ].map(perk => (
                  <div
                    key={perk.title}
                    className="hp-glass"
                    style={{ padding: "16px", borderRadius: "12px", display: "flex", alignItems: "flex-start", gap: "16px", transition: "border-color 0.2s" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,225,109,0.3)"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(77,71,50,0.2)"; }}
                  >
                    <div style={{ width: "40px", height: "40px", borderRadius: "10px", backgroundColor: T.surfaceHigh, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <span className="material-symbols-outlined" style={{ color: T.goldFixed, fontSize: "20px" }}>{perk.icon}</span>
                    </div>
                    <div>
                      <h4 style={{ fontSize: "14px", fontWeight: "700", color: T.primary, margin: "0 0 4px" }}>{perk.title}</h4>
                      <p style={{ fontSize: "13px", color: T.mutedDim, margin: 0, lineHeight: "1.5" }}>{perk.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div style={{ display: "flex", flexDirection: "column", gap: "64px" }}>

            {/* Active Productions */}
            <section>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "32px" }}>
                <div>
                  <h2 style={{ fontFamily: T.syne, fontSize: "28px", fontWeight: "700", color: T.goldFixed, margin: "0 0 6px" }}>Active Productions</h2>
                  <p style={{ color: T.mutedDim, fontSize: "14px", margin: 0 }}>Currently open or in active development.</p>
                </div>
                <Link
                  href="/opportunities"
                  style={{ color: T.goldFixed, fontSize: "14px", fontWeight: "600", textDecoration: "none" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.textDecoration = "underline"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.textDecoration = "none"; }}
                >
                  View All
                </Link>
              </div>

              {jobs.length === 0 ? (
                <div className="hp-glass" style={{ borderRadius: "16px", padding: "48px", textAlign: "center" }}>
                  <span className="material-symbols-outlined" style={{ color: T.mutedDim, fontSize: "48px", display: "block", marginBottom: "12px", opacity: 0.5 }}>movie_creation</span>
                  <p style={{ color: T.mutedDim, fontSize: "14px", marginBottom: "20px" }}>No active productions yet.</p>
                  <Link href="/manage-gigs/new" style={{ textDecoration: "none" }}>
                    <button style={{ padding: "10px 24px", backgroundColor: T.gold, color: T.onGold, border: "none", borderRadius: "9999px", fontSize: "14px", fontWeight: "700", cursor: "pointer" }}>
                      Start a Production
                    </button>
                  </Link>
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
                      <Link key={job.id} href={`/manage-gigs/${job.id}`} className="hp-prod-card hp-glass">
                        {/* Thumbnail */}
                        <div style={{ height: "192px", overflow: "hidden", position: "relative" }}>
                          <div className="hp-prod-thumb" style={{ background: GRADIENTS[idx % GRADIENTS.length], width: "100%", height: "100%" }} />
                          <div style={{ position: "absolute", top: "16px", left: "16px" }}>
                            <span style={{ backgroundColor: statusBg, color: statusColor, padding: "4px 10px", borderRadius: "4px", fontSize: "10px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                              {statusLabel}
                            </span>
                          </div>
                        </div>
                        {/* Info */}
                        <div style={{ padding: "24px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px" }}>
                            <div>
                              <h3 style={{ fontFamily: T.syne, fontSize: "18px", fontWeight: "700", color: T.primary, margin: "0 0 4px" }}>{job.title}</h3>
                              <p style={{ fontSize: "13px", color: T.mutedDim, margin: 0 }}>{job.company || "Independent"}</p>
                            </div>
                            {job.deadline && (
                              <span style={{ fontSize: "11px", color: T.goldFixed, flexShrink: 0 }}>
                                Due {new Date(job.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                              </span>
                            )}
                          </div>
                          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                            <span className="hp-role-chip">{job.applicants} Applicant{job.applicants !== 1 ? "s" : ""}</span>
                            {job.urgent && (
                              <span className="hp-role-chip" style={{ borderLeftColor: T.red }}>Urgent</span>
                            )}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Talent Network */}
            <section>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "32px" }}>
                <div>
                  <h2 style={{ fontFamily: T.syne, fontSize: "28px", fontWeight: "700", color: T.goldFixed, margin: "0 0 6px" }}>Talent Network</h2>
                  <p style={{ color: T.mutedDim, fontSize: "14px", margin: 0 }}>
                    {me?.role === "AGENCY" ? "Artists represented by your agency." : "Professionals in your network."}
                  </p>
                </div>
                <Link
                  href="/network"
                  style={{ color: T.goldFixed, fontSize: "14px", fontWeight: "600", textDecoration: "none" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.textDecoration = "underline"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.textDecoration = "none"; }}
                >
                  See Network
                </Link>
              </div>

              <div className="hp-talent-grid">
                {talentItems.map(item => {
                  const hue = (item.name.charCodeAt(0) * 47) % 360;
                  return (
                    <div key={item.key} className="hp-talent-tile">
                      <div style={{ width: "100%", height: "100%", background: `hsl(${hue}, 20%, 15%)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "28px", fontWeight: "800", color: `hsl(${hue}, 60%, 65%)`, fontFamily: T.syne }}>
                        {item.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="hp-talent-overlay">
                        <p style={{ color: T.goldFixed, fontSize: "13px", fontWeight: "700", margin: "0 0 2px" }}>{item.name}</p>
                        <p style={{ color: T.text, fontSize: "11px", margin: 0 }}>{item.role}</p>
                      </div>
                    </div>
                  );
                })}

                {/* Join Network CTA tile */}
                <Link href="/network" style={{ textDecoration: "none" }}>
                  <div
                    className="hp-glass"
                    style={{ aspectRatio: "1/1", borderRadius: "12px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "16px", textAlign: "center", cursor: "pointer", transition: "background 0.2s" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(58,57,58,0.6)"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(22,22,24,0.7)"; }}
                  >
                    <span className="material-symbols-outlined" style={{ color: T.goldFixed, fontSize: "28px", display: "block", marginBottom: "8px" }}>add_circle</span>
                    <span style={{ fontSize: "12px", fontWeight: "600", color: T.text }}>Join the Network</span>
                  </div>
                </Link>
              </div>
            </section>

            {/* Stats Banner */}
            <div className="hp-glass hp-rim" style={{ padding: "32px", borderRadius: "16px", display: "flex", justifyContent: "space-around", alignItems: "center", gap: "24px", flexWrap: "wrap" }}>
              {[
                { value: String(jobs.length),                   label: "Active Stages" },
                { value: acceptedConns.length > 0 ? `${acceptedConns.length}` : "0", label: "Crew Members" },
                { value: String(jobs.reduce((sum, j) => sum + (j.applicants ?? 0), 0)), label: "Total Applicants" },
              ].map((stat, idx) => (
                <div key={stat.label} style={{ display: "flex", alignItems: "center" }}>
                  {idx > 0 && <div className="hp-stat-div" />}
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontFamily: T.syne, fontSize: "40px", fontWeight: "800", color: T.goldFixed, lineHeight: "1" }}>{stat.value}</div>
                    <div style={{ fontSize: "12px", color: T.mutedDim, textTransform: "uppercase", letterSpacing: "0.1em", marginTop: "6px" }}>{stat.label}</div>
                  </div>
                </div>
              ))}
            </div>

          </div>{/* end right column */}
        </div>{/* end grid */}

        {/* Footer */}
        <footer style={{ backgroundColor: T.surfaceLowest, borderTop: `1px solid rgba(77,71,50,0.15)`, marginTop: "48px" }}>
          <div style={{ maxWidth: "1440px", margin: "0 auto", padding: "48px clamp(20px, 5vw, 64px)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "24px" }}>
            <div>
              <span style={{ fontFamily: T.syne, fontSize: "22px", fontWeight: "800", color: T.goldFixed }}>StageLight</span>
              <p style={{ color: T.mutedDim, fontSize: "13px", marginTop: "6px", marginBottom: 0 }}>© 2024 StageLight Pro. All rights reserved.</p>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "32px" }}>
              {["Terms of Service", "Privacy Policy", "Cookie Settings", "Support"].map(link => (
                <Link
                  key={link}
                  href="#"
                  style={{ color: T.mutedDim, fontSize: "14px", fontWeight: "600", textDecoration: "none", transition: "color 0.15s" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = T.primary; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = T.mutedDim; }}
                >
                  {link}
                </Link>
              ))}
            </div>
          </div>
        </footer>

      </main>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <>
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 100 }} onClick={() => setShowEditModal(false)} />
          <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: "100%", maxWidth: "420px", zIndex: 101,
            background: T.surfaceLow, border: `1px solid ${T.border}`, borderRadius: "20px", padding: "32px", boxShadow: "0 24px 80px rgba(0,0,0,0.7)" }}>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
              <h2 style={{ fontFamily: T.syne, fontSize: "22px", fontWeight: 700, color: T.primary, margin: 0 }}>Edit Profile</h2>
              <button onClick={() => setShowEditModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: T.muted, fontSize: "20px", lineHeight: 1 }}>✕</button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {([
                { label: "First Name", key: "first_name" as const },
                { label: "Last Name",  key: "last_name"  as const },
              ]).map(({ label, key }) => (
                <div key={key}>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: T.mutedDim, textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: "6px" }}>{label}</label>
                  <input
                    value={editForm[key]}
                    onChange={e => setEditForm(p => ({ ...p, [key]: e.target.value }))}
                    style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", background: T.surface, border: `1px solid ${T.border}`, color: T.text, fontSize: "14px", outline: "none", boxSizing: "border-box" }}
                    onFocus={e => e.currentTarget.style.borderColor = T.gold}
                    onBlur={e => e.currentTarget.style.borderColor = T.border}
                  />
                </div>
              ))}
            </div>

            <div style={{ marginTop: "16px", padding: "12px 14px", borderRadius: "10px", background: T.surfaceHigh, fontSize: "13px", color: T.muted }}>
              <span style={{ color: T.mutedDim }}>Email: </span>{me?.email}
              <span style={{ marginLeft: "16px", color: T.mutedDim }}>Role: </span>{me?.role}
            </div>

            {editError && <p style={{ marginTop: "12px", fontSize: "13px", color: "#F87171", margin: "12px 0 0" }}>{editError}</p>}

            <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
              <button onClick={() => { setShowEditModal(false); setEditError(""); }} style={{ flex: 1, padding: "11px", borderRadius: "9999px", border: `1px solid ${T.border}`, background: "transparent", color: T.text, fontWeight: 600, cursor: "pointer", fontFamily: T.outfit }}>
                Cancel
              </button>
              <button
                disabled={editSaving}
                onClick={async () => {
                  setEditSaving(true); setEditError("");
                  try {
                    const updated = await apiClient.patch<MeData>("/auth/me/", editForm);
                    setMe(updated);
                    setShowEditModal(false);
                  } catch { setEditError("Failed to save. Please try again."); }
                  finally { setEditSaving(false); }
                }}
                style={{ flex: 2, padding: "11px", borderRadius: "9999px", background: T.gold, color: T.onGold, border: "none", fontWeight: 700, cursor: editSaving ? "not-allowed" : "pointer", opacity: editSaving ? 0.7 : 1, fontFamily: T.outfit }}
              >
                {editSaving ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
