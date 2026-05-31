"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api";
import { getUser } from "@/lib/auth";
import Link from "next/link";
import {
  Heart, MessageCircle, Send, Bookmark, Share2,
  Play, Volume2, VolumeX,
  Music, CheckCircle2, Plus,
} from "lucide-react";
import { CommentsPanel } from "@/components/artstage/reels/CommentsPanel";

interface Talent {
  id: string;
  name: string;
  category: string;
  avatar: string;
  verified: boolean;
  location: string;
  followers: number;
  rating: number;
  bio: string;
  reel_url: string | null;
  skills: string[];
  owner?: number;
}

interface Reel {
  id: string;
  talent_id: string;
  talent_name: string;
  talent_avatar: string;
  talent_verified: boolean;
  video_url: string;
  thumbnail_url: string;
  description: string;
  likes: number;
  comments: number;
  shares: number;
  has_liked: boolean;
  created_at: string;
  music: string;
}

const DEMO_REELS: Reel[] = [
  {
    id: "1", talent_id: "t1", talent_name: "Emma Thompson", talent_avatar: "", talent_verified: true,
    video_url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    thumbnail_url: "", description: "Monologue from 'The Glass Menagerie' - Watch till the end for the emotional climax!",
    likes: 1234, comments: 89, shares: 45, has_liked: false, created_at: new Date().toISOString(), music: "Original Sound - Emma Thompson",
  },
  {
    id: "2", talent_id: "t2", talent_name: "Marcus Chen", talent_avatar: "", talent_verified: false,
    video_url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFunflies.mp4",
    thumbnail_url: "", description: "Dance choreography to 'Believer' - Contemporary fusion style",
    likes: 892, comments: 45, shares: 23, has_liked: false, created_at: new Date().toISOString(), music: "Believer - Imagine Dragons",
  },
  {
    id: "3", talent_id: "t3", talent_name: "Sofia Rodriguez", talent_avatar: "", talent_verified: true,
    video_url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    thumbnail_url: "", description: "Voice over reel - Commercial and character voices",
    likes: 2456, comments: 123, shares: 67, has_liked: false, created_at: new Date().toISOString(), music: "Voice Demo Reel 2024",
  },
];

const TRENDING_TAGS = ["#Monologue", "#SongCover", "#DanceReel", "#VoiceDemo", "#Showreel", "#Comedy", "#IndieFilm", "#StageLink"];

const GLASS: React.CSSProperties = {
  background: "rgba(22,22,24,0.7)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  border: "1px solid rgba(153,144,119,0.2)",
};

// Play a video only if it actually has a usable source; ignore the expected
// AbortError / NotSupportedError (empty or unsupported src) so they don't spam the console.
function safePlay(video: HTMLVideoElement | null) {
  if (!video) return;
  if (!video.currentSrc && !video.getAttribute("src")) return;
  video.play().catch(e => {
    if (e?.name !== "AbortError" && e?.name !== "NotSupportedError") console.error("Video play failed", e);
  });
}

export default function ReelsPage() {
  const router = useRouter();

  const [reels, setReels] = useState<Reel[]>([]);
  const [trendingTalents, setTrendingTalents] = useState<Talent[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeReelIndex, setActiveReelIndex] = useState(0);
  const [isPlayingStates, setIsPlayingStates] = useState<{ [key: string]: boolean }>({});
  const [isMuted, setIsMuted] = useState(false);
  const [likedReels, setLikedReels] = useState<Set<string>>(new Set());
  const [savedReels, setSavedReels] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<string | null>(null);

  const videoRefs = useRef<{ [key: string]: HTMLVideoElement | null }>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const lastTapRef = useRef<number>(0);

  const [fetchError, setFetchError] = useState(false);
  const [feedType, setFeedType] = useState<"foryou" | "following">("foryou");
  const [showComments, setShowComments] = useState(false);
  const [doubleTapLike, setDoubleTapLike] = useState<{ id: string; x: number; y: number } | null>(null);

  useEffect(() => {
    if (!getUser()) { router.replace("/login"); return; }
    const fetchData = async () => {
      try {
        const [reelsRes, talentsRes] = await Promise.allSettled([
          apiClient.get<Reel[]>("/reels/"),
          apiClient.get<Talent[]>("/talents/"),
        ]);
        if (reelsRes.status === "fulfilled" && reelsRes.value.length > 0) {
          setReels(reelsRes.value);
          const initialLiked = new Set(reelsRes.value.filter(r => r.has_liked).map(r => String(r.id)));
          setLikedReels(initialLiked);
        } else if (reelsRes.status === "rejected") {
          setFetchError(true);
        }
        if (talentsRes.status === "fulfilled") {
          setTrendingTalents(Array.isArray(talentsRes.value) ? talentsRes.value : []);
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
        setFetchError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const observerOptions = { root: containerRef.current, rootMargin: "0px", threshold: 0.7 };
    const handleIntersection = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        const reelId = entry.target.getAttribute("data-reel-id");
        const index = Number(entry.target.getAttribute("data-index"));
        if (!reelId) return;
        if (entry.isIntersecting) {
          setActiveReelIndex(index);
          const video = videoRefs.current[reelId];
          if (video) {
            safePlay(video);
            setIsPlayingStates(prev => ({ ...prev, [reelId]: true }));
          }
        } else {
          const video = videoRefs.current[reelId];
          if (video) {
            video.pause();
            setIsPlayingStates(prev => ({ ...prev, [reelId]: false }));
          }
        }
      });
    };
    const observer = new IntersectionObserver(handleIntersection, observerOptions);
    document.querySelectorAll(".reel-container").forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, [reels]);

  const togglePlayPause = (reelId: string) => {
    const video = videoRefs.current[reelId];
    if (!video) return;
    if (isPlayingStates[reelId]) {
      video.pause();
      setIsPlayingStates(prev => ({ ...prev, [reelId]: false }));
    } else {
      safePlay(video);
      setIsPlayingStates(prev => ({ ...prev, [reelId]: true }));
    }
  };

  const handleLike = async (reelId: string) => {
    const wasLiked = likedReels.has(reelId);
    setLikedReels(prev => {
      const newSet = new Set(prev);
      if (newSet.has(reelId)) {
        newSet.delete(reelId);
        setReels(prevReels => prevReels.map(r => r.id === reelId ? { ...r, likes: Math.max(0, r.likes - 1), has_liked: false } : r));
      } else {
        newSet.add(reelId);
        setReels(prevReels => prevReels.map(r => r.id === reelId ? { ...r, likes: r.likes + 1, has_liked: true } : r));
      }
      return newSet;
    });
    try {
      await apiClient.post(`/reels/${reelId}/like/`, { action: wasLiked ? "unlike" : "like" });
    } catch { /* silently fail for demo reels */ }
  };

  const handleSave = (reelId: string) => {
    setSavedReels(prev => {
      const newSet = new Set(prev);
      if (newSet.has(reelId)) newSet.delete(reelId);
      else {
        newSet.add(reelId);
        setToast("Saved to your collection!");
        setTimeout(() => setToast(null), 2000);
      }
      return newSet;
    });
  };

  const handleShare = async (reelId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const url = `${window.location.origin}/reels?id=${reelId}`;
      if (navigator.share) {
        await navigator.share({ title: "StageLink Reel", url });
      } else {
        await navigator.clipboard.writeText(url);
      }
      setToast("Shared successfully!");
      setTimeout(() => setToast(null), 2000);
    } catch { /* share cancelled */ }
  };

  const formatNumber = (num?: number) => {
    if (num === undefined || num === null) return "0";
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  };

  if (loading) {
    return (
      <div className="artstage flex items-center justify-center h-[calc(100vh-56px)] bg-[var(--as-bg)]">
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl bg-[#ffd700] mx-auto mb-4 animate-pulse" />
          <p className="text-[var(--as-text-muted)] font-medium">Loading Reels...</p>
        </div>
      </div>
    );
  }

  if (fetchError || reels.length === 0) {
    return (
      <div className="artstage flex items-center justify-center h-[calc(100vh-56px)]" style={{ background: "var(--as-bg)" }}>
        <div className="text-center px-8 max-w-sm">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
            style={{ background: "rgba(255,215,0,0.08)", border: "1px solid rgba(255,215,0,0.15)" }}>
            <Play className="w-8 h-8" style={{ color: "var(--as-text-muted)", opacity: 0.4 }} />
          </div>
          <h3 className="font-semibold text-lg mb-2" style={{ color: "var(--as-text)" }}>
            {fetchError ? "Could not load reels" : "No reels yet"}
          </h3>
          <p className="text-sm mb-5" style={{ color: "var(--as-text-muted)" }}>
            {fetchError ? "Check your connection and try again." : "Be the first to share a reel with the community."}
          </p>
          {fetchError ? (
            <button onClick={() => { setFetchError(false); setLoading(true); router.refresh(); }}
              className="px-5 py-2 rounded-full text-sm font-semibold text-[#221b00] bg-[#ffd700]">
              Retry
            </button>
          ) : (
            <Link href="/reels/upload" className="px-5 py-2 rounded-full text-sm font-semibold text-[#221b00] bg-[#ffd700] inline-block">
              Upload Reel
            </Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="artstage bg-[var(--as-bg)] h-[calc(100vh-56px)] overflow-hidden flex">

      {/* ── Main feed section ── */}
      <section className="relative flex-1 flex items-center justify-center overflow-hidden">

        {/* Upload button — bottom-center on mobile, top-right on desktop */}
        <Link href="/reels/upload"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 md:absolute md:bottom-auto md:top-5 md:left-auto md:right-4 md:translate-x-0 z-30 flex items-center gap-1.5 px-4 py-2.5 md:px-3 md:py-2 rounded-full text-sm md:text-xs font-bold shadow-lg transition-all hover:shadow-[0_0_15px_rgba(255,215,0,0.4)]"
          style={{ background: "#ffd700", color: "#221b00" }}>
          <Plus className="w-4 h-4 md:w-3.5 md:h-3.5" /> Create
        </Link>

        {/* Feed type tabs */}
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20 flex gap-4 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] font-bold text-[17px]">
          <button onClick={() => setFeedType("following")}
            className={`transition-all ${feedType === "following" ? "text-white" : "opacity-60 hover:opacity-100"}`}>
            Following
          </button>
          <span className="opacity-40">|</span>
          <button onClick={() => setFeedType("foryou")}
            className={`transition-all ${feedType === "foryou" ? "text-white" : "opacity-60 hover:opacity-100"}`}>
            For You
          </button>
        </div>

        {/* Scrollable snap container */}
        <div ref={containerRef}
          className="h-full w-full overflow-y-scroll snap-y snap-mandatory scrollbar-hide"
          style={{ scrollBehavior: "smooth", msOverflowStyle: "none", scrollbarWidth: "none" }}>
          {reels.map((reel, idx) => (
            <div key={reel.id} data-reel-id={reel.id} data-index={idx}
              className="reel-container h-full w-full snap-start snap-always flex items-center justify-center relative bg-[var(--as-bg)] py-6 px-4">

              {/* Phone-style video wrapper */}
              <div
                className="relative h-full w-full max-w-[420px] bg-black mx-auto rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(255,215,0,0.05)] border border-[#ffd700]/10"
                onClick={(e) => {
                  const now = Date.now();
                  if (now - lastTapRef.current < 300) {
                    handleLike(reel.id);
                    const rect = e.currentTarget.getBoundingClientRect();
                    setDoubleTapLike({ id: reel.id, x: e.clientX - rect.left, y: e.clientY - rect.top });
                    setTimeout(() => setDoubleTapLike(null), 1000);
                  } else {
                    togglePlayPause(reel.id);
                  }
                  lastTapRef.current = now;
                }}
              >
                {/* Double-tap heart */}
                {doubleTapLike?.id === reel.id && (
                  <div className="absolute pointer-events-none z-50 flex items-center justify-center animate-[ping_1s_ease-out_forwards]"
                    style={{ left: doubleTapLike.x - 40, top: doubleTapLike.y - 40 }}>
                    <Heart className="w-20 h-20 fill-[#ffd700] text-[#ffd700]" />
                  </div>
                )}

                {/* Video */}
                <video
                  ref={el => { videoRefs.current[reel.id] = el; }}
                  src={
                    Math.abs(idx - activeReelIndex) <= 1 && reel.video_url
                      ? reel.video_url
                      : undefined
                  }
                  poster={reel.thumbnail_url || undefined}
                  loop muted={isMuted} playsInline
                  className="w-full h-full object-cover cursor-pointer"
                  onError={() => {}}
                />

                {/* Play overlay */}
                {!isPlayingStates[reel.id] && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-20 h-20 bg-black/40 rounded-full flex items-center justify-center backdrop-blur-sm">
                      <Play className="w-10 h-10 text-white fill-white ml-2" />
                    </div>
                  </div>
                )}

                {/* Sound toggle */}
                <div className="absolute top-6 right-6 z-10">
                  <button onClick={(e) => { e.stopPropagation(); setIsMuted(!isMuted); }}
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white transition-colors"
                    style={{ background: "rgba(22,22,24,0.7)", backdropFilter: "blur(20px)", border: "1px solid rgba(153,144,119,0.2)" }}>
                    {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                  </button>
                </div>

                {/* Right-side actions */}
                <div className="absolute bottom-24 right-4 z-10 flex flex-col items-center gap-6">

                  {/* Profile avatar */}
                  <div className="relative group cursor-pointer mb-2"
                    onClick={(e) => { e.stopPropagation(); router.push(`/profile/${reel.talent_id}`); }}>
                    <div className="w-12 h-12 rounded-full border-2 border-[#ffd700] overflow-hidden bg-gradient-to-br from-[#ffd700] to-[#e9c400] flex items-center justify-center">
                      {reel.talent_avatar
                        ? <img src={reel.talent_avatar} alt="" className="w-full h-full object-cover" />
                        : <span className="text-[#221b00] font-bold text-lg">{(reel.talent_name ?? "?").charAt(0)}</span>}
                    </div>
                  </div>

                  {/* Like */}
                  <button onClick={(e) => { e.stopPropagation(); handleLike(reel.id); }} className="flex flex-col items-center gap-1 group">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center transition-all"
                      style={GLASS}
                      onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 0 15px rgba(255,246,223,0.3)")}
                      onMouseLeave={e => (e.currentTarget.style.boxShadow = "none")}>
                      <Heart className={`w-6 h-6 transition-transform group-hover:scale-110 ${likedReels.has(reel.id) ? "fill-[#ffd700] text-[#ffd700]" : "text-white"}`} />
                    </div>
                    <span className="text-white text-xs font-semibold drop-shadow-md">{formatNumber(reel.likes)}</span>
                  </button>

                  {/* Comment */}
                  <button onClick={(e) => { e.stopPropagation(); setShowComments(true); }} className="flex flex-col items-center gap-1 group">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center transition-all"
                      style={GLASS}
                      onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 0 15px rgba(255,246,223,0.3)")}
                      onMouseLeave={e => (e.currentTarget.style.boxShadow = "none")}>
                      <MessageCircle className="w-6 h-6 text-white transition-transform group-hover:scale-110" />
                    </div>
                    <span className="text-white text-xs font-semibold drop-shadow-md">{formatNumber(reel.comments)}</span>
                  </button>

                  {/* Save */}
                  <button onClick={(e) => { e.stopPropagation(); handleSave(reel.id); }} className="flex flex-col items-center gap-1 group">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center transition-all"
                      style={GLASS}
                      onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 0 15px rgba(255,246,223,0.3)")}
                      onMouseLeave={e => (e.currentTarget.style.boxShadow = "none")}>
                      <Bookmark className={`w-6 h-6 transition-transform group-hover:scale-110 ${savedReels.has(reel.id) ? "fill-[var(--as-accent)] text-[var(--as-accent)]" : "text-white"}`} />
                    </div>
                    <span className="text-white text-xs font-semibold drop-shadow-md">Save</span>
                  </button>

                  {/* Share */}
                  <button onClick={(e) => handleShare(reel.id, e)} className="flex flex-col items-center gap-1 group">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center transition-all"
                      style={GLASS}
                      onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 0 15px rgba(255,246,223,0.3)")}
                      onMouseLeave={e => (e.currentTarget.style.boxShadow = "none")}>
                      <Share2 className="w-6 h-6 text-white transition-transform group-hover:scale-110" />
                    </div>
                    <span className="text-white text-xs font-semibold drop-shadow-md">{formatNumber(reel.shares)}</span>
                  </button>

                  {/* Spinning music disc */}
                  <div className={`mt-4 w-12 h-12 rounded-full flex items-center justify-center border-[8px] shadow-lg ${isPlayingStates[reel.id] ? "animate-[spin_4s_linear_infinite]" : ""}`}
                    style={{ background: "#0e0e0f", borderColor: "rgba(255,215,0,0.15)" }}>
                    <Music className="w-3 h-3 text-white" />
                  </div>
                </div>

                {/* Bottom info overlay */}
                <div className="absolute bottom-0 left-0 right-16 p-6 pt-16 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none">
                  <div className="pointer-events-auto">
                    <Link href={`/profile/${reel.talent_id}`} onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-2 mb-2 group w-fit">
                      <span className="text-white font-bold text-lg drop-shadow-lg group-hover:underline">
                        @{reel.talent_name.replace(/\s+/g, "").toLowerCase()}
                      </span>
                      {reel.talent_verified && <CheckCircle2 className="w-4 h-4 text-[#ffd700]" />}
                    </Link>

                    <p className="text-white/90 text-sm mb-4 line-clamp-3 drop-shadow-md">{reel.description}</p>

                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 max-w-[200px]">
                        <Music className="w-4 h-4 text-white shrink-0" />
                        <div className="overflow-hidden">
                          <span className="text-white text-xs whitespace-nowrap animate-[marquee_5s_linear_infinite] inline-block">
                            {reel.music} • {reel.music}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <CommentsPanel
          isOpen={showComments}
          onClose={() => setShowComments(false)}
          commentCount={reels[activeReelIndex]?.comments || 0}
          reelId={String(reels[activeReelIndex]?.id || "")}
        />
      </section>

      {/* ── Discover panel ── */}
      <aside className="hidden lg:flex w-96 flex-col p-8 overflow-y-auto border-l border-white/5 bg-[var(--as-bg)]">

        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold font-[var(--font-syne)] text-[var(--as-text)]">Discover</h2>
        </div>

        {/* Rising Talent */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[11px] font-semibold text-[var(--as-text)] uppercase tracking-widest">Rising Talent</p>
            <Link href="/search?tab=artists" className="text-xs text-[#ffd700] hover:underline">See All</Link>
          </div>
          <div className="space-y-2">
            {trendingTalents.slice(0, 5).map(talent => (
              <Link key={talent.id} href={`/profile/${talent.id}`}
                className="flex gap-4 items-center p-3 rounded-xl transition-all cursor-pointer group hover:bg-[rgba(255,255,255,0.06)]">
                <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0 flex items-center justify-center"
                  style={{ background: "rgba(255,215,0,0.1)", border: "1px solid rgba(255,215,0,0.15)" }}>
                  {talent.avatar
                    ? <img src={talent.avatar} className="w-full h-full object-cover" alt={talent.name} />
                    : <span className="text-lg font-bold text-[#ffd700]">{talent.name[0]}</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white group-hover:text-[#ffd700] transition-colors truncate">{talent.name}</p>
                  <p className="text-xs text-[var(--as-text-muted)] truncate">{talent.category}</p>
                </div>
                <Play className="w-4 h-4 text-[#ffd700] opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              </Link>
            ))}
            {trendingTalents.length === 0 && (
              <p className="text-xs text-[var(--as-text-muted)] text-center py-6">No talent data available</p>
            )}
          </div>
        </div>

        {/* Trending Tags */}
        <div className="mt-auto pt-6 border-t border-[rgba(153,144,119,0.15)]">
          <p className="text-[11px] font-semibold text-[var(--as-text)] uppercase tracking-widest mb-4">Trending Tags</p>
          <div className="flex flex-wrap gap-2">
            {TRENDING_TAGS.map(tag => (
              <span key={tag}
                className="px-3 py-1 rounded-full text-xs text-[#d0c6ab] border border-transparent hover:border-[rgba(255,215,0,0.4)] transition-all cursor-pointer"
                style={{ background: "rgba(42,42,43,0.8)" }}>
                {tag}
              </span>
            ))}
          </div>
        </div>
      </aside>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-[var(--as-text)] text-[var(--as-surface)] px-6 py-3 rounded-full shadow-2xl z-[2000] font-medium text-sm animate-in slide-in-from-bottom-4 fade-in duration-300">
          {toast}
        </div>
      )}

      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes marquee { 0% { transform: translateX(100%); } 100% { transform: translateX(-100%); } }
      `}</style>
    </div>
  );
}
