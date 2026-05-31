"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api";
import { getUser } from "@/lib/auth";
import { Users, Play, Clock, Calendar, Radio } from "lucide-react";
import Link from "next/link";

// ── Types ──────────────────────────────────────────────────────────────────
interface LiveStream {
  id: number;
  artist: number;
  artist_name: string;
  artist_avatar: string;
  artist_username: string;
  title: string;
  is_live: boolean;
  scheduled_for: string | null;
  viewer_count: number;
  visibility: string;
  created_at: string;
}

interface ChatMessage {
  id: number;
  user: string;
  text: string;
  ts: number;
  isMod?: boolean;
}

// ── Design tokens ──────────────────────────────────────────────────────────
const T = {
  bg:         "#131314",
  glass:      "rgba(22, 22, 24, 0.7)",
  border:     "rgba(77, 71, 50, 0.3)",
  gold:       "#ffd700",
  onGold:     "#3a3000",
  red:        "#e10111",
  primary:    "#fff6df",
  text:       "#e5e2e3",
  muted:      "#d0c6ab",
  mutedDim:   "#999077",
  surface:    "#201f20",
  surfaceLow: "#0e0e0f",
  syne:       "var(--font-syne, 'Syne', sans-serif)",
  outfit:     "var(--font-outfit, 'Outfit', sans-serif)",
};

const glassStyle = {
  background:          T.glass,
  backdropFilter:      "blur(20px)",
  WebkitBackdropFilter:"blur(20px)",
  border:              `1px solid ${T.border}`,
  boxShadow:           "inset 0 1px 0 rgba(255,246,223,0.05)",
} as const;

const rimStyle = {
  borderTop:  "1px solid rgba(255,246,223,0.12)",
  borderLeft: "1px solid rgba(255,246,223,0.12)",
} as const;

interface BackendChatMessage { id: number; user: number; user_name: string; text: string; created_at: string; }
function mapChat(m: BackendChatMessage): ChatMessage {
  return { id: m.id, user: m.user_name, text: m.text, ts: Date.parse(m.created_at) || Date.now(), isMod: false };
}

// ── Page ───────────────────────────────────────────────────────────────────
export default function LivesPage() {
  const router = useRouter();
  const [allStreams, setAllStreams] = useState<LiveStream[]>([]);
  const [loading, setLoading] = useState(true);
  const [belowTab, setBelowTab] = useState<"scheduled" | "past">("scheduled");

  // Shared live chat — real data, reflected both in the side panel and overlaid on the hero
  const [chatLog, setChatLog] = useState<ChatMessage[]>([]);

  useEffect(() => {
    if (!getUser()) { router.replace("/login"); return; }
    apiClient.get<LiveStream[]>("/lives/")
      .then(setAllStreams)
      .catch(console.error)
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const now = new Date();
  const liveStreams    = allStreams.filter(s => s.is_live).sort((a, b) => b.viewer_count - a.viewer_count);
  const featured       = liveStreams[0] ?? null;
  const featuredId     = featured?.id ?? null;

  // Load + poll chat for the featured stream
  useEffect(() => {
    if (featuredId == null) { setChatLog([]); return; }
    let active = true;
    const load = () => {
      apiClient.get<BackendChatMessage[]>(`/lives/${featuredId}/chat/`)
        .then(msgs => { if (active) setChatLog(msgs.map(mapChat)); })
        .catch(() => {});
    };
    load();
    const id = setInterval(load, 4000);
    return () => { active = false; clearInterval(id); };
  }, [featuredId]);

  async function sendChatMessage(text: string) {
    if (featuredId == null) return;
    try {
      const msg = await apiClient.post<BackendChatMessage>(`/lives/${featuredId}/chat/`, { text });
      setChatLog(prev => [...prev, mapChat(msg)]);
    } catch { /* ignore send failure */ }
  }
  const otherLive      = liveStreams.slice(1);
  const nextScheduled  = allStreams
    .filter(s => !s.is_live && s.scheduled_for && new Date(s.scheduled_for) > now)
    .sort((a, b) => new Date(a.scheduled_for!).getTime() - new Date(b.scheduled_for!).getTime())[0] ?? null;
  const scheduledStreams = allStreams.filter(s => !s.is_live && s.scheduled_for && new Date(s.scheduled_for) > now);
  const pastStreams      = allStreams.filter(s => !s.is_live && (!s.scheduled_for || new Date(s.scheduled_for) <= now));
  const liveCount       = allStreams.filter(s => s.is_live).length;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: T.bg, color: T.text, fontFamily: T.outfit }}>
      <div className="lives-container" style={{ maxWidth: "1440px", margin: "0 auto", padding: "40px 24px 48px" }}>

        {/* ── Page header ── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "32px", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
              <h1 style={{ fontFamily: T.syne, fontSize: "32px", fontWeight: "700", color: T.primary, letterSpacing: "-0.02em", margin: 0 }}>
                Live Streams
              </h1>
              {liveCount > 0 && (
                <span style={{ display: "flex", alignItems: "center", gap: "5px", background: "rgba(225,1,17,0.15)", color: T.red, border: "1px solid rgba(225,1,17,0.3)", padding: "3px 10px", borderRadius: "9999px", fontSize: "11px", fontWeight: "700", letterSpacing: "0.08em" }}>
                  <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: T.red, display: "inline-block", animation: "livePulse 1.2s ease-in-out infinite" }} />
                  {liveCount} LIVE
                </span>
              )}
            </div>
            <p style={{ color: T.mutedDim, fontSize: "14px", margin: 0 }}>
              {liveCount > 0 ? `${liveCount} stream${liveCount > 1 ? "s" : ""} broadcasting now` : "No one is live right now"}
            </p>
          </div>
          <Link href="/create?tab=live">
            <button
              style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 22px", borderRadius: "8px", background: T.gold, color: T.onGold, border: "none", fontSize: "12px", fontWeight: "700", cursor: "pointer", fontFamily: T.outfit, letterSpacing: "0.08em", transition: "all 0.2s" }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 0 16px rgba(255,215,0,0.4)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "translateY(0)"; }}
            >
              <Radio style={{ width: "14px", height: "14px" }} />
              GO LIVE
            </button>
          </Link>
        </div>

        {loading ? (
          <LoadingSkeleton />
        ) : featured ? (
          <>
            {/* ── Main grid: hero (left) + chat (right) ── */}
            <div className="lives-main-grid">
              {/* Left column */}
              <div style={{ minWidth: 0 }}>
                <HeroPlayer stream={featured} chatLog={chatLog} />
                <div className="lives-below-hero">
                  <ArtistInfoCard stream={featured} nextScheduled={nextScheduled} />
                  <OtherStreamsPanel streams={otherLive} />
                </div>
              </div>
              {/* Chat */}
              <div className="lives-chat-col">
                <ChatPanel chatLog={chatLog} onSend={sendChatMessage} />
              </div>
            </div>

            {(scheduledStreams.length > 0 || pastStreams.length > 0) && (
              <BelowFoldSection scheduledStreams={scheduledStreams} pastStreams={pastStreams} tab={belowTab} setTab={setBelowTab} />
            )}
          </>
        ) : (
          <>
            <EmptyState />
            {(scheduledStreams.length > 0 || pastStreams.length > 0) && (
              <BelowFoldSection scheduledStreams={scheduledStreams} pastStreams={pastStreams} tab={belowTab} setTab={setBelowTab} />
            )}
          </>
        )}
      </div>

      <style>{`
        @keyframes livePulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(0.85)} }
        @keyframes shimmer { 0%,100%{opacity:1} 50%{opacity:0.35} }

        .lives-main-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 24px;
        }
        .lives-chat-col {
          /* full-width on mobile */
        }
        .lives-below-hero {
          display: grid;
          grid-template-columns: 1fr;
          gap: 24px;
          margin-top: 24px;
        }
        @media (min-width: 768px) {
          .lives-below-hero { grid-template-columns: 1fr 1fr; }
        }
        @media (min-width: 1280px) {
          .lives-main-grid { grid-template-columns: 1fr 320px; align-items: start; }
          .lives-chat-col { position: sticky; top: 88px; }
          .lives-container { padding-left: 64px; padding-right: 64px; }
        }
      `}</style>
    </div>
  );
}

// ── Hero Player ────────────────────────────────────────────────────────────
function HeroPlayer({ stream, chatLog }: { stream: LiveStream; chatLog: ChatMessage[] }) {
  const router = useRouter();
  const [hovering, setHovering] = useState(false);
  const initials = stream.artist_name?.slice(0, 2).toUpperCase() ?? "??";

  return (
    <div
      onClick={() => router.push(`/lives/${stream.id}`)}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      style={{
        position: "relative", borderRadius: "16px", overflow: "hidden",
        cursor: "pointer", aspectRatio: "16/9",
        ...glassStyle, ...rimStyle,
      }}
    >
      {/* Background */}
      {stream.artist_avatar ? (
        <img
          src={stream.artist_avatar} alt={stream.artist_name}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.65, transform: hovering ? "scale(1.04)" : "scale(1)", transition: "transform 0.7s ease" }}
        />
      ) : (
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, #0e0e0f 0%, #201f20 50%, #131314 100%)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: "linear-gradient(135deg, #e10111 0%, #7a0000 100%)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontFamily: T.syne, fontSize: "28px", fontWeight: "700", color: "white" }}>{initials}</span>
          </div>
        </div>
      )}

      {/* Gradient overlay */}
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, #131314 0%, rgba(19,19,20,0.45) 55%, transparent 100%)" }} />

      {/* Top badges */}
      <div style={{ position: "absolute", top: "20px", left: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", background: T.red, color: "white", padding: "5px 12px", borderRadius: "9999px", fontSize: "11px", fontWeight: "700", letterSpacing: "0.1em" }}>
          <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "white", display: "inline-block", animation: "livePulse 1s ease-in-out infinite" }} />
          LIVE
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", ...glassStyle, color: T.primary, padding: "5px 12px", borderRadius: "9999px", fontSize: "12px", fontWeight: "600" }}>
          <Users style={{ width: "12px", height: "12px" }} />
          {stream.viewer_count.toLocaleString()} Watching
        </div>
      </div>

      {/* Live chat overlay — mirrors the side chat panel */}
      {chatLog.length > 0 && (
        <div
          style={{
            position: "absolute", left: "28px", bottom: "96px", maxWidth: "min(60%, 360px)",
            display: "flex", flexDirection: "column", justifyContent: "flex-end", gap: "6px",
            maxHeight: "160px", overflow: "hidden", pointerEvents: "none",
            WebkitMaskImage: "linear-gradient(to top, black 55%, transparent 100%)",
            maskImage: "linear-gradient(to top, black 55%, transparent 100%)",
          }}
        >
          {chatLog.slice(-4).map(msg => (
            <div key={msg.id} style={{ display: "flex", alignItems: "baseline", gap: "6px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "12px", fontWeight: "700", color: msg.isMod ? T.gold : T.primary, textShadow: "0 1px 4px rgba(0,0,0,0.9)" }}>
                {msg.user}
                {msg.isMod && <span style={{ background: "rgba(255,215,0,0.2)", color: T.gold, fontSize: "8px", padding: "1px 5px", borderRadius: "3px", marginLeft: "5px", fontWeight: "700" }}>MOD</span>}
              </span>
              <span style={{ fontSize: "12px", color: T.text, textShadow: "0 1px 4px rgba(0,0,0,0.9)", lineHeight: 1.4 }}>{msg.text}</span>
            </div>
          ))}
        </div>
      )}

      {/* Bottom info */}
      <div style={{ position: "absolute", bottom: "28px", left: "28px", right: "28px" }}>
        <h2 style={{ fontFamily: T.syne, fontSize: "clamp(20px, 3vw, 32px)", fontWeight: "700", color: T.primary, margin: "0 0 6px", letterSpacing: "-0.01em", lineHeight: 1.2 }}>
          {stream.title}
        </h2>
        <p style={{ color: T.muted, fontSize: "14px", margin: 0 }}>
          {stream.artist_name}{stream.artist_username ? ` · @${stream.artist_username}` : ""}
        </p>
      </div>

      {/* Play hover overlay */}
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", opacity: hovering ? 1 : 0, transition: "opacity 0.3s ease" }}>
        <div style={{ width: "72px", height: "72px", borderRadius: "50%", background: "rgba(255,215,0,0.15)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,215,0,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Play style={{ width: "30px", height: "30px", color: T.gold, fill: T.gold }} />
        </div>
      </div>
    </div>
  );
}

// ── Artist Info Card ───────────────────────────────────────────────────────
function ArtistInfoCard({ stream, nextScheduled }: { stream: LiveStream; nextScheduled: LiveStream | null }) {
  const router = useRouter();
  const [remaining, setRemaining] = useState("");

  useEffect(() => {
    if (!nextScheduled?.scheduled_for) return;
    const tick = () => {
      const diff = new Date(nextScheduled.scheduled_for!).getTime() - Date.now();
      if (diff <= 0) { setRemaining("Starting now"); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setRemaining(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [nextScheduled]);

  const initials = stream.artist_name?.slice(0, 2).toUpperCase() ?? "??";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Artist */}
      <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
        <div style={{ width: "52px", height: "52px", borderRadius: "12px", overflow: "hidden", border: `1px solid ${T.border}`, flexShrink: 0 }}>
          {stream.artist_avatar ? (
            <img src={stream.artist_avatar} alt={stream.artist_name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg, #e10111 0%, #7a0000 100%)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontFamily: T.syne, fontSize: "16px", fontWeight: "700", color: "white" }}>{initials}</span>
            </div>
          )}
        </div>
        <div>
          <h3 style={{ fontFamily: T.syne, fontSize: "18px", fontWeight: "700", color: T.primary, margin: 0, lineHeight: 1 }}>{stream.artist_name}</h3>
          <p style={{ color: T.muted, fontSize: "13px", margin: "4px 0 0" }}>Verified Artist</p>
        </div>
      </div>

      {/* Tags */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
        {[stream.visibility.replace(/_/g, " "), "Live Performance"].map(tag => (
          <div key={tag} style={{ ...glassStyle, padding: "6px 14px", borderRadius: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ width: "3px", height: "18px", background: T.gold, borderRadius: "2px" }} />
            <span style={{ color: T.text, fontSize: "12px", fontWeight: "600", textTransform: "capitalize" }}>{tag}</span>
          </div>
        ))}
      </div>

      {/* Next Premiere */}
      {nextScheduled && (
        <div style={{ ...glassStyle, ...rimStyle, borderRadius: "16px", padding: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
            <p style={{ color: T.mutedDim, fontSize: "10px", fontWeight: "700", letterSpacing: "0.12em", textTransform: "uppercase", margin: 0 }}>
              Next Premiere
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: "5px", color: T.gold }}>
              <Clock style={{ width: "12px", height: "12px" }} />
              <span style={{ fontSize: "13px", fontWeight: "700" }}>{remaining}</span>
            </div>
          </div>
          <h4 style={{ fontFamily: T.syne, fontSize: "16px", fontWeight: "700", color: T.primary, margin: "0 0 14px", lineHeight: 1.3 }}>
            {nextScheduled.title}
          </h4>
          <button
            onClick={() => router.push(`/lives/${nextScheduled.id}`)}
            style={{ width: "100%", padding: "10px", borderRadius: "10px", background: T.gold, color: T.onGold, border: "none", fontSize: "12px", fontWeight: "700", cursor: "pointer", letterSpacing: "0.08em", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", transition: "box-shadow 0.2s" }}
            onMouseEnter={e => e.currentTarget.style.boxShadow = "0 0 14px rgba(255,215,0,0.35)"}
            onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}
          >
            <Calendar style={{ width: "13px", height: "13px" }} />
            WATCH PREMIERE
          </button>
        </div>
      )}
    </div>
  );
}

// ── Other Streams Panel ────────────────────────────────────────────────────
function OtherStreamsPanel({ streams }: { streams: LiveStream[] }) {
  const router = useRouter();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      <h3 style={{ color: T.mutedDim, fontSize: "10px", fontWeight: "700", letterSpacing: "0.12em", textTransform: "uppercase", margin: 0 }}>
        Live Now · More
      </h3>
      {streams.length === 0 ? (
        <p style={{ color: T.mutedDim, fontSize: "13px" }}>No other streams live right now.</p>
      ) : (
        streams.slice(0, 4).map(s => (
          <MiniStreamCard key={s.id} stream={s} onClick={() => router.push(`/lives/${s.id}`)} />
        ))
      )}
    </div>
  );
}

function MiniStreamCard({ stream, onClick }: { stream: LiveStream; onClick: () => void }) {
  const [hover, setHover] = useState(false);
  const initials = stream.artist_name?.slice(0, 2).toUpperCase() ?? "??";

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ ...glassStyle, borderColor: hover ? "rgba(255,246,223,0.25)" : T.border, borderRadius: "12px", padding: "10px", display: "flex", gap: "12px", cursor: "pointer", transition: "border-color 0.2s" }}
    >
      <div style={{ width: "88px", height: "56px", borderRadius: "8px", overflow: "hidden", position: "relative", flexShrink: 0 }}>
        {stream.artist_avatar ? (
          <img src={stream.artist_avatar} alt={stream.artist_name} style={{ width: "100%", height: "100%", objectFit: "cover", transform: hover ? "scale(1.08)" : "scale(1)", transition: "transform 0.3s" }} />
        ) : (
          <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg, #201f20 0%, #131314 100%)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontFamily: T.syne, fontSize: "13px", fontWeight: "700", color: "rgba(255,255,255,0.25)" }}>{initials}</span>
          </div>
        )}
        <div style={{ position: "absolute", bottom: "4px", right: "4px", background: T.red, color: "white", fontSize: "8px", fontWeight: "700", padding: "1px 5px", borderRadius: "3px" }}>
          LIVE
        </div>
      </div>
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", justifyContent: "center", gap: "3px" }}>
        <p style={{ color: T.primary, fontSize: "13px", fontWeight: "600", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {stream.title}
        </p>
        <p style={{ color: T.mutedDim, fontSize: "11px", margin: 0 }}>
          {stream.artist_name} · {stream.viewer_count.toLocaleString()} views
        </p>
      </div>
    </div>
  );
}

// ── Chat Panel ─────────────────────────────────────────────────────────────
function ChatPanel({ chatLog, onSend }: { chatLog: ChatMessage[]; onSend: (text: string) => void }) {
  const [chatMsg, setChatMsg] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatLog]);

  function sendChat(e: React.FormEvent) {
    e.preventDefault();
    if (!chatMsg.trim()) return;
    onSend(chatMsg.trim());
    setChatMsg("");
  }

  function fmt(ts: number) {
    return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  return (
    <div style={{ ...glassStyle, ...rimStyle, borderRadius: "16px", display: "flex", flexDirection: "column", height: "clamp(400px, 60vh, 680px)", overflow: "hidden" }}>
      {/* Header */}
      <div style={{ padding: "16px 20px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <h3 style={{ color: T.primary, fontSize: "14px", fontWeight: "700", margin: 0, letterSpacing: "0.02em" }}>Live Chat</h3>
        <span style={{ color: T.mutedDim, fontSize: "22px", lineHeight: 1, cursor: "pointer" }}>⋮</span>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: "14px" }}>
        {chatLog.length === 0 && (
          <p style={{ color: T.mutedDim, fontSize: "13px", textAlign: "center", margin: "auto 0" }}>
            No messages yet. Say hello 👋
          </p>
        )}
        {chatLog.map(msg => (
          <div key={msg.id} style={{ display: "flex", gap: "10px" }}>
            <div style={{ width: "30px", height: "30px", borderRadius: "50%", background: msg.isMod ? T.gold : T.surface, border: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: "700", color: msg.isMod ? T.onGold : T.muted, flexShrink: 0 }}>
              {msg.user[0].toUpperCase()}
            </div>
            <div>
              <p style={{ margin: "0 0 2px", fontSize: "12px", fontWeight: "700", color: msg.isMod ? T.gold : T.mutedDim }}>
                {msg.user}
                {msg.isMod && <span style={{ background: "rgba(255,215,0,0.15)", color: T.gold, fontSize: "8px", padding: "1px 5px", borderRadius: "3px", marginLeft: "6px" }}>MOD</span>}
                <span style={{ color: T.mutedDim, fontSize: "10px", fontWeight: "400", marginLeft: "6px" }}>{fmt(msg.ts)}</span>
              </p>
              <p style={{ margin: 0, fontSize: "13px", color: T.text, lineHeight: 1.5 }}>{msg.text}</p>
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div style={{ padding: "12px 16px", borderTop: `1px solid ${T.border}`, flexShrink: 0 }}>
        <form onSubmit={sendChat} style={{ position: "relative" }}>
          <input
            value={chatMsg}
            onChange={e => setChatMsg(e.target.value)}
            placeholder="Say something..."
            style={{ width: "100%", padding: "10px 44px 10px 14px", borderRadius: "12px", border: `1px solid ${T.border}`, background: T.surfaceLow, color: T.text, fontSize: "13px", outline: "none", boxSizing: "border-box", transition: "border-color 0.2s" }}
            onFocus={e => e.currentTarget.style.borderColor = "rgba(255,215,0,0.4)"}
            onBlur={e => e.currentTarget.style.borderColor = T.border}
          />
          <button type="submit" disabled={!chatMsg.trim()} style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: chatMsg.trim() ? "pointer" : "default", color: chatMsg.trim() ? T.gold : T.mutedDim, fontSize: "18px", padding: 0, lineHeight: 1, transition: "color 0.2s" }}>
            ➤
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Empty State ────────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <div style={{ ...glassStyle, borderRadius: "20px", padding: "80px 32px", textAlign: "center", marginBottom: "32px" }}>
      <Radio style={{ width: "48px", height: "48px", color: T.mutedDim, margin: "0 auto 16px", display: "block", opacity: 0.35 }} />
      <h3 style={{ fontFamily: T.syne, fontSize: "24px", fontWeight: "700", color: T.primary, margin: "0 0 8px" }}>
        Nobody is live yet
      </h3>
      <p style={{ color: T.muted, fontSize: "14px", margin: "0 0 28px" }}>
        Be the first to go live and share your performance with the community.
      </p>
      <Link href="/create">
        <button style={{ padding: "12px 32px", borderRadius: "10px", background: T.gold, color: T.onGold, border: "none", fontSize: "13px", fontWeight: "700", cursor: "pointer", letterSpacing: "0.08em" }}>
          GO LIVE NOW
        </button>
      </Link>
    </div>
  );
}

// ── Below-fold: Scheduled + Past tabs ─────────────────────────────────────
function BelowFoldSection({ scheduledStreams, pastStreams, tab, setTab }: {
  scheduledStreams: LiveStream[];
  pastStreams: LiveStream[];
  tab: "scheduled" | "past";
  setTab: (t: "scheduled" | "past") => void;
}) {
  const router = useRouter();
  const streams = tab === "scheduled" ? scheduledStreams : pastStreams;

  return (
    <div style={{ marginTop: "40px" }}>
      <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
        {(["scheduled", "past"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: "7px 20px", borderRadius: "9999px", fontSize: "11px", fontWeight: "700", letterSpacing: "0.08em", cursor: "pointer", transition: "all 0.2s", background: tab === t ? T.gold : "transparent", color: tab === t ? T.onGold : T.mutedDim, border: `1px solid ${tab === t ? T.gold : T.border}` }}>
            {t === "scheduled" ? "SCHEDULED" : "PAST"}
          </button>
        ))}
      </div>

      {streams.length === 0 ? (
        <p style={{ color: T.mutedDim, fontSize: "14px", textAlign: "center", padding: "40px 0" }}>
          {tab === "scheduled" ? "No upcoming streams." : "No past streams."}
        </p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "16px" }}>
          {streams.slice(0, 24).map(s => (
            <div
              key={s.id}
              onClick={() => router.push(`/lives/${s.id}`)}
              style={{ ...glassStyle, borderRadius: "12px", padding: "20px", cursor: "pointer", transition: "border-color 0.2s, box-shadow 0.2s" }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 0 16px rgba(233,196,0,0.08)"; e.currentTarget.style.borderColor = "rgba(255,246,223,0.2)"; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.borderColor = T.border; }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: T.surface, display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${T.border}` }}>
                  <span style={{ fontFamily: T.syne, fontSize: "12px", fontWeight: "700", color: T.mutedDim }}>{s.artist_name?.slice(0, 2).toUpperCase()}</span>
                </div>
                <p style={{ color: T.muted, fontSize: "12px", margin: 0, flex: 1 }}>{s.artist_name}</p>
                <span style={{ background: tab === "scheduled" ? "rgba(255,215,0,0.12)" : "rgba(255,255,255,0.04)", color: tab === "scheduled" ? T.gold : T.mutedDim, border: `1px solid ${tab === "scheduled" ? "rgba(255,215,0,0.2)" : T.border}`, padding: "3px 8px", borderRadius: "9999px", fontSize: "9px", fontWeight: "700", letterSpacing: "0.08em" }}>
                  {tab === "scheduled" ? "UPCOMING" : "ENDED"}
                </span>
              </div>
              <h4 style={{ fontFamily: T.syne, fontSize: "15px", fontWeight: "700", color: T.text, margin: "0 0 10px", lineHeight: 1.3 }}>{s.title}</h4>
              {s.scheduled_for && (
                <p style={{ color: T.mutedDim, fontSize: "12px", margin: 0, display: "flex", alignItems: "center", gap: "5px" }}>
                  <Calendar style={{ width: "11px", height: "11px" }} />
                  {new Date(s.scheduled_for).toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Loading skeleton ───────────────────────────────────────────────────────
function LoadingSkeleton() {
  return (
    <div className="lives-main-grid">
      <div>
        <div style={{ ...glassStyle, borderRadius: "16px", aspectRatio: "16/9", animation: "shimmer 1.5s ease-in-out infinite" }} />
        <div className="lives-below-hero" style={{ marginTop: "24px" }}>
          {[0, 1].map(i => <div key={i} style={{ ...glassStyle, borderRadius: "12px", height: "160px", animation: "shimmer 1.5s ease-in-out infinite" }} />)}
        </div>
      </div>
      <div style={{ ...glassStyle, borderRadius: "16px", height: "500px", animation: "shimmer 1.5s ease-in-out infinite" }} />
    </div>
  );
}
