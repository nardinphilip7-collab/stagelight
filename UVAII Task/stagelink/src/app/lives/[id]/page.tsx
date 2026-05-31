"use client";

import { useEffect, useState, use, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api";
import { getUser } from "@/lib/auth";
import { ArrowLeft, Radio, Users, MessageCircle, Send, Heart, Loader2, Mic, MicOff, Camera, CameraOff } from "lucide-react";

interface LiveStream {
  id: number;
  artist: number;
  artist_user_id?: number;
  artist_name: string;
  artist_avatar: string;
  artist_username: string;
  title: string;
  is_live: boolean;
  scheduled_for: string | null;
  started_at: string | null;
  viewer_count: number;
  visibility: string;
  created_at: string;
}

interface ChatMessage {
  id: number;
  user: string;
  text: string;
  ts: number;
}

interface BackendChatMessage {
  id: number;
  user: number;
  user_name: string;
  text: string;
  created_at: string;
}

function mapChat(m: BackendChatMessage): ChatMessage {
  return { id: m.id, user: m.user_name, text: m.text, ts: Date.parse(m.created_at) || Date.now() };
}

// Deterministic color per username
function userColor(name: string) {
  const colors = ['#ffd700', '#00dbe8', '#ff6b6b', '#a78bfa', '#34d399', '#fb923c', '#f472b6'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

export default function LiveWatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const currentUser = getUser();

  const [stream, setStream] = useState<LiveStream | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [chatMsg, setChatMsg] = useState("");
  const [chatLog, setChatLog] = useState<ChatMessage[]>([]);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [sending, setSending] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const myStreamRef = useRef<MediaStream | null>(null);
  const peerRef = useRef<any>(null);
  const [videoActive, setVideoActive] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);

  // Chat auto-scroll
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const lastMsgId = useRef<number>(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback((smooth = true) => {
    chatEndRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "instant" });
  }, []);

  // ── Load stream ──
  useEffect(() => {
    if (!currentUser) { router.replace("/login"); return; }
    apiClient.get<LiveStream>(`/lives/${id}/`)
      .then(s => {
        setStream(s);
        setLikeCount(s.viewer_count > 0 ? s.viewer_count * 3 : 0);
      })
      .catch(() => setError("Stream not found or no longer available."))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // ── Poll viewer count ──
  useEffect(() => {
    if (!stream?.is_live) return;
    const interval = setInterval(() => {
      apiClient.get<LiveStream>(`/lives/${id}/`)
        .then(s => setStream(prev => prev ? { ...prev, viewer_count: s.viewer_count } : s))
        .catch(() => {});
    }, 10000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stream?.is_live, id]);

  // ── Real-time chat polling (every 2s) ──
  useEffect(() => {
    let active = true;

    const fetchChat = async () => {
      try {
        const msgs = await apiClient.get<BackendChatMessage[]>(`/lives/${id}/chat/`);
        if (!active) return;
        const mapped = msgs.map(mapChat);
        const latestId = mapped.length > 0 ? mapped[mapped.length - 1].id : -1;

        if (latestId > lastMsgId.current) {
          const isNearBottom = (() => {
            const el = chatContainerRef.current;
            if (!el) return true;
            return el.scrollHeight - el.scrollTop - el.clientHeight < 120;
          })();
          lastMsgId.current = latestId;
          setChatLog(mapped);
          if (isNearBottom) setTimeout(() => scrollToBottom(true), 50);
        }
      } catch { /* ignore */ }
    };

    fetchChat();
    const interval = setInterval(fetchChat, 2000);
    return () => { active = false; clearInterval(interval); };
  }, [id, scrollToBottom]);

  const isStreamOwner = !!(stream && currentUser && Number(stream.artist_user_id) === Number(currentUser.user_id));

  // ── Broadcaster viewer count sync ──
  useEffect(() => {
    if (!isStreamOwner || !stream?.is_live) return;
    const interval = setInterval(() => {
      if (peerRef.current && !peerRef.current.destroyed) {
        const activeConnections = Object.keys(peerRef.current.connections || {}).length;
        if (stream.viewer_count !== activeConnections) {
          apiClient.patch(`/lives/${id}/`, { viewer_count: activeConnections })
            .then(() => setStream(prev => prev ? { ...prev, viewer_count: activeConnections } : prev))
            .catch(() => {});
        }
      }
    }, 5000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isStreamOwner, stream?.is_live, id, stream?.viewer_count]);

  // ── WebRTC PeerJS ──
  useEffect(() => {
    if (!stream || !stream.is_live) return;
    let peer: any;
    import("peerjs").then(({ default: Peer }) => {
      const peerId = isStreamOwner ? `stagelink-stream-${stream.id}` : undefined;
      peer = peerId ? new Peer(peerId) : new Peer();
      peerRef.current = peer;

      if (isStreamOwner) {
        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
          .then(camStream => {
            myStreamRef.current = camStream;
            if (videoRef.current) {
              videoRef.current.srcObject = camStream;
              setVideoActive(true);
            }
            peer.on("call", (call: any) => { call.answer(camStream); });
          })
          .catch(err => console.error("Failed to get local stream", err));
      } else {
        let retryInterval: NodeJS.Timeout;
        let currentCall: any = null;

        const connectToHost = () => {
          if (!peer || peer.destroyed) return;
          if (currentCall) { try { currentCall.close(); } catch (e) {} }
          const canvas = document.createElement("canvas");
          canvas.width = 1; canvas.height = 1;
          const dummyStream = canvas.captureStream(1);
          currentCall = peer.call(`stagelink-stream-${stream.id}`, dummyStream);
          if (currentCall) {
            currentCall.on("stream", (remoteStream: any) => {
              if (videoRef.current) {
                videoRef.current.srcObject = remoteStream;
                setVideoActive(true);
                clearInterval(retryInterval);
              }
            });
            currentCall.on("close", () => setVideoActive(false));
            currentCall.on("error", () => setVideoActive(false));
          }
        };

        peer.on("open", () => {
          connectToHost();
          retryInterval = setInterval(() => {
            setVideoActive(active => { if (!active) connectToHost(); return active; });
          }, 5000);
        });
        peer.on("error", (err: any) => { if (err.type !== "peer-unavailable") console.error("PeerJS error:", err); });
        (peer as any)._cleanupInterval = () => clearInterval(retryInterval);
      }
    });

    return () => {
      if (peer) { if ((peer as any)._cleanupInterval) (peer as any)._cleanupInterval(); peer.destroy(); }
      if (myStreamRef.current) myStreamRef.current.getTracks().forEach((t: MediaStreamTrack) => t.stop());
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stream?.is_live, isStreamOwner]);

  // ── Toggle mic / cam ──
  function toggleMic() {
    if (!myStreamRef.current) return;
    myStreamRef.current.getAudioTracks().forEach(t => { t.enabled = !micOn; });
    setMicOn(p => !p);
  }
  function toggleCam() {
    if (!myStreamRef.current) return;
    myStreamRef.current.getVideoTracks().forEach(t => { t.enabled = !camOn; });
    setCamOn(p => !p);
  }

  async function endLive() {
    if (!stream) return;
    try {
      await apiClient.patch(`/lives/${id}/`, { is_live: false });
      router.push("/lives");
    } catch { alert("Failed to end the stream. Please try again."); }
  }

  async function sendChat(e: React.FormEvent) {
    e.preventDefault();
    const text = chatMsg.trim();
    if (!text || sending) return;
    setSending(true);
    setChatMsg("");
    try {
      // Post the message and immediately append the returned message to state (1 round trip instead of 2)
      const msg = await apiClient.post<BackendChatMessage>(`/lives/${id}/chat/`, { text });
      const mapped = mapChat(msg);
      
      setChatLog(prev => {
        // Prevent duplicate if the poller happens to catch it at the exact same millisecond
        if (prev.some(m => m.id === mapped.id)) return prev;
        return [...prev, mapped];
      });
      
      if (mapped.id > lastMsgId.current) {
        lastMsgId.current = mapped.id;
      }
      setTimeout(() => scrollToBottom(true), 30);
    } catch { /* ignore send failure */ }
    finally {
      setSending(false);
      inputRef.current?.focus();
    }
  }

  function formatTime(ts: number) {
    return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  // ── Loading ──
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0e0e0f] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-[#ffd700]/10 border border-[#ffd700]/20 flex items-center justify-center mx-auto mb-4">
            <Loader2 className="w-6 h-6 text-[#ffd700] animate-spin" />
          </div>
          <p className="text-[var(--as-text-muted)] text-sm font-outfit">Joining stream...</p>
        </div>
      </div>
    );
  }

  // ── Error ──
  if (error || !stream) {
    return (
      <div className="min-h-screen bg-[#0e0e0f] flex items-center justify-center">
        <div className="text-center px-8 py-12">
          <Radio className="w-12 h-12 text-[var(--as-text-muted)] opacity-30 mx-auto mb-4" />
          <h2 className="font-syne text-xl font-bold text-[var(--as-text)] mb-2">Stream Unavailable</h2>
          <p className="text-[var(--as-text-muted)] text-sm mb-6">{error || "This stream could not be loaded."}</p>
          <button
            onClick={() => router.push("/lives")}
            className="px-6 py-2.5 rounded-full bg-[#ffd700] text-[#3a3000] font-outfit font-semibold text-sm hover:brightness-110 transition-all"
          >
            Browse Streams
          </button>
        </div>
      </div>
    );
  }

  const initials = stream.artist_name ? stream.artist_name.slice(0, 2).toUpperCase() : "??";

  return (
    <>
      <style>{`
        @keyframes livePulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.75); }
        }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .chat-msg { animation: fadeSlideUp 0.25s ease-out; }
        .chat-scroll::-webkit-scrollbar { width: 3px; }
        .chat-scroll::-webkit-scrollbar-track { background: transparent; }
        .chat-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 10px; }
      `}</style>

      <div className="h-screen bg-[#0e0e0f] text-[var(--as-text)] flex flex-col overflow-hidden">

        {/* ── Top Bar ── */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/5 bg-[#0e0e0f]/80 backdrop-blur-xl shrink-0 z-10">
          <button
            onClick={() => router.push("/lives")}
            className="flex items-center gap-2 text-[var(--as-text-muted)] hover:text-[var(--as-text)] transition-colors text-sm font-outfit font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          <div className="flex-1 text-center hidden md:block">
            <p className="font-syne font-bold text-[var(--as-text)] text-sm truncate px-4">{stream.title}</p>
          </div>

          <div className="flex items-center gap-3">
            {stream.is_live ? (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#e10111] text-white text-[11px] font-bold tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-white" style={{ animation: 'livePulse 1s ease-in-out infinite' }} />
                LIVE
              </div>
            ) : (
              <div className="px-3 py-1 rounded-full bg-white/8 text-[var(--as-text-muted)] text-[11px] font-semibold">Ended</div>
            )}
            <div className="flex items-center gap-1.5 text-[var(--as-text-muted)] text-xs font-outfit">
              <Users className="w-3.5 h-3.5" />
              {stream.viewer_count.toLocaleString()}
            </div>
            {isStreamOwner && stream.is_live && (
              <button
                onClick={endLive}
                className="px-4 py-1.5 rounded-full bg-[#e10111]/20 border border-[#e10111]/40 text-[#e10111] text-xs font-semibold font-outfit hover:bg-[#e10111]/30 transition-all"
              >
                End Live
              </button>
            )}
          </div>
        </div>

        {/* ── Main Content ── */}
        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">

          {/* ── Video Area ── */}
          <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-6 gap-5 relative min-w-0 min-h-0">

            {/* Stream Title (mobile) */}
            <p className="md:hidden text-sm font-semibold text-[#d0c6ab] font-outfit text-center">{stream.title}</p>

            {/* Video Frame */}
            <div
              className="relative w-full rounded-2xl overflow-hidden border border-white/5 shadow-2xl shadow-black/60"
              style={{ aspectRatio: '16/9', maxWidth: '760px' }}
            >
              {/* Cinematic gradient backdrop */}
              <div
                className="absolute inset-0"
                style={{
                  background: `
                    radial-gradient(ellipse at 20% 30%, rgba(255,215,0,0.07) 0%, transparent 55%),
                    radial-gradient(ellipse at 80% 70%, rgba(225,1,17,0.06) 0%, transparent 50%),
                    linear-gradient(160deg, #1c1b1c 0%, #0e0e0f 40%, #131314 70%, #1a1800 100%)
                  `,
                }}
              />

              {/* Artist overlay (shown when video is inactive) */}
              <div
                className="absolute inset-0 flex flex-col items-center justify-center gap-4 z-[5] transition-opacity duration-500"
                style={{ opacity: videoActive ? 0 : 1, pointerEvents: videoActive ? 'none' : 'auto' }}
              >
                <div
                  className="w-20 h-20 rounded-2xl border-2 border-[#ffd700]/30 overflow-hidden flex items-center justify-center shadow-xl"
                  style={{
                    background: stream.artist_avatar
                      ? undefined
                      : 'linear-gradient(135deg, #ffd700 0%, #e9c400 50%, #1a1800 100%)',
                  }}
                >
                  {stream.artist_avatar
                    ? <img src={stream.artist_avatar} alt={stream.artist_name} className="w-full h-full object-cover" />
                    : <span className="font-syne font-extrabold text-2xl text-[#131314]">{initials}</span>
                  }
                </div>
                <div className="text-center">
                  <p className="font-syne font-bold text-lg text-[#fff6df]">{stream.artist_name}</p>
                  {stream.is_live ? (
                    <div className="flex items-center justify-center gap-2 mt-2 text-[var(--as-text-muted)] text-xs font-outfit">
                      <Radio className="w-3.5 h-3.5 text-[#e10111]" style={{ animation: 'livePulse 1.5s infinite' }} />
                      {isStreamOwner ? "Connecting camera..." : "Connecting to stream..."}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2 mt-2 text-[var(--as-text-muted)] text-xs font-outfit">
                      <Radio className="w-3.5 h-3.5 opacity-40" />
                      This stream has ended
                    </div>
                  )}
                </div>
              </div>

              {/* Actual video element */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted={isStreamOwner}
                className="absolute inset-0 w-full h-full object-cover z-10 transition-opacity duration-500"
                style={{ opacity: videoActive ? 1 : 0, pointerEvents: videoActive ? 'auto' : 'none' }}
              />

              {/* Live badge overlay on video */}
              {stream.is_live && videoActive && (
                <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#e10111] text-white text-[10px] font-bold tracking-wider shadow-lg">
                  <span className="w-1.5 h-1.5 rounded-full bg-white" style={{ animation: 'livePulse 1s infinite' }} />
                  LIVE
                </div>
              )}

              {/* Viewer count overlay */}
              {videoActive && (
                <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-sm text-white text-[11px] font-outfit font-semibold">
                  <Users className="w-3 h-3" />
                  {stream.viewer_count.toLocaleString()}
                </div>
              )}
            </div>

            {/* Controls Row */}
            <div className="flex items-center gap-3">
              {/* Like */}
              <button
                onClick={() => { setLiked(p => !p); setLikeCount(p => liked ? p - 1 : p + 1); }}
                className={`flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold font-outfit transition-all ${
                  liked
                    ? 'bg-[#e10111]/20 border border-[#e10111]/40 text-[#e10111]'
                    : 'bg-white/5 border border-white/10 text-[var(--as-text-muted)] hover:text-[var(--as-text)] hover:border-white/20'
                }`}
              >
                <Heart className="w-4 h-4" fill={liked ? 'currentColor' : 'none'} />
                {likeCount.toLocaleString()}
              </button>

              {/* Broadcaster controls */}
              {isStreamOwner && stream.is_live && videoActive && (
                <>
                  <button
                    onClick={toggleMic}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold font-outfit transition-all border ${
                      micOn
                        ? 'bg-white/5 border-white/10 text-[var(--as-text-muted)] hover:text-[var(--as-text)]'
                        : 'bg-[#e10111]/20 border-[#e10111]/40 text-[#e10111]'
                    }`}
                    title={micOn ? 'Mute mic' : 'Unmute mic'}
                  >
                    {micOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={toggleCam}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold font-outfit transition-all border ${
                      camOn
                        ? 'bg-white/5 border-white/10 text-[var(--as-text-muted)] hover:text-[var(--as-text)]'
                        : 'bg-[#e10111]/20 border-[#e10111]/40 text-[#e10111]'
                    }`}
                    title={camOn ? 'Stop camera' : 'Start camera'}
                  >
                    {camOn ? <Camera className="w-4 h-4" /> : <CameraOff className="w-4 h-4" />}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* ── Chat Sidebar ── */}
          <div className="w-full md:w-80 shrink-0 h-[42vh] md:h-auto border-t md:border-t-0 md:border-l border-white/5 flex flex-col bg-[var(--as-bg)]">

            {/* Chat header */}
            <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-[#ffd700]" />
                <span className="text-sm font-semibold font-outfit text-[var(--as-text)]">Live Chat</span>
              </div>
              <span className="text-[10px] font-outfit text-[var(--as-text-muted)] bg-white/5 px-2 py-0.5 rounded-full">
                {chatLog.length} messages
              </span>
            </div>

            {/* Messages */}
            <div
              ref={chatContainerRef}
              className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3 chat-scroll"
            >
              {chatLog.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
                  <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center">
                    <MessageCircle className="w-5 h-5 text-[var(--as-text-muted)]/50" />
                  </div>
                  <p className="text-xs text-[var(--as-text-muted)] font-outfit">Be the first to say something!</p>
                </div>
              ) : (
                chatLog.map((msg, i) => {
                  const color = userColor(msg.user);
                  const isMe = msg.user === (currentUser?.email?.split("@")[0] ?? "");
                  return (
                    <div key={msg.id} className={`chat-msg flex gap-2.5 ${isMe ? 'flex-row-reverse' : ''}`}>
                      {/* Avatar */}
                      <div
                        className="w-7 h-7 rounded-xl flex items-center justify-center text-[10px] font-bold shrink-0 text-[#0e0e0f]"
                        style={{ background: `linear-gradient(135deg, ${color}, ${color}aa)` }}
                      >
                        {msg.user.slice(0, 2).toUpperCase()}
                      </div>

                      <div className={`flex flex-col max-w-[200px] ${isMe ? 'items-end' : 'items-start'}`}>
                        <div className={`flex items-baseline gap-1.5 mb-1 ${isMe ? 'flex-row-reverse' : ''}`}>
                          <span className="text-[11px] font-semibold font-outfit" style={{ color }}>
                            {isMe ? 'You' : msg.user}
                          </span>
                          <span className="text-[9px] text-[var(--as-text-muted)] font-outfit">{formatTime(msg.ts)}</span>
                        </div>
                        <div
                          className={`px-3 py-2 rounded-2xl text-xs font-outfit leading-relaxed break-words ${
                            isMe
                              ? 'bg-[#ffd700]/15 border border-[#ffd700]/20 text-[#fff6df] rounded-tr-sm'
                              : 'bg-white/5 border border-white/5 text-[#d0c6ab] rounded-tl-sm'
                          }`}
                        >
                          {msg.text}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Chat Input */}
            <form
              onSubmit={sendChat}
              className="px-4 py-4 border-t border-white/5 flex gap-2 items-center shrink-0 bg-[#0e0e0f]"
            >
              <div className="flex-1 flex items-center gap-2 bg-white/5 border border-white/8 rounded-2xl px-3 py-2 focus-within:border-[#ffd700]/30 focus-within:bg-white/8 transition-all">
                <input
                  ref={inputRef}
                  value={chatMsg}
                  onChange={e => setChatMsg(e.target.value)}
                  placeholder={stream.is_live ? "Say something..." : "Chat ended"}
                  disabled={!stream.is_live}
                  className="flex-1 bg-transparent text-[var(--as-text)] text-xs font-outfit outline-none placeholder:text-[var(--as-text-muted)] disabled:opacity-40"
                  maxLength={200}
                />
              </div>
              <button
                type="submit"
                disabled={!chatMsg.trim() || sending || !stream.is_live}
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all active:scale-90 ${
                  chatMsg.trim() && stream.is_live
                    ? 'bg-[#ffd700] text-[#3a3000] hover:brightness-110 shadow-lg shadow-[#ffd700]/20'
                    : 'bg-white/5 text-[var(--as-text-muted)] cursor-not-allowed'
                }`}
              >
                {sending
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : <Send className="w-3.5 h-3.5" />
                }
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
