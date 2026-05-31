"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Play, Film, X } from "lucide-react";
import { apiClient } from "@/lib/api";
import Link from "next/link";

interface Reel {
  id: string | number;
  title: string;
  video_url: string;
  thumbnail_url?: string;
  reel_type?: string;
  created_at?: string;
}

interface Talent {
  id: string;
  display_name?: string;
  name?: string;
}

export default function TalentReelsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [reels, setReels] = useState<Reel[]>([]);
  const [talent, setTalent] = useState<Talent | null>(null);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState<Reel | null>(null);

  useEffect(() => {
    Promise.all([
      apiClient.get<Reel[]>(`/reels/?talent=${id}`),
      apiClient.get<Talent>(`/talents/${id}/`),
    ])
      .then(([r, t]) => {
        setReels(r);
        setTalent(t);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const talentName = talent?.display_name || talent?.name || "Talent";

  return (
    <div className="artstage min-h-screen" style={{ background: "var(--as-bg)" }}>
      {/* Header */}
      <div
        className="sticky top-14 z-20 flex items-center gap-3 px-4 py-3 border-b"
        style={{ background: "var(--as-surface)", borderColor: "var(--as-border)" }}
      >
        <button
          onClick={() => router.push(`/profile/${id}`)}
          className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-black/5 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" style={{ color: "var(--as-text)" }} />
        </button>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Link
            href={`/profile/${id}`}
            className="font-semibold truncate"
            style={{ color: "var(--as-text)", fontFamily: "var(--as-font-display)" }}
          >
            {talentName}
          </Link>
          <span className="text-sm" style={{ color: "var(--as-text-muted)" }}>/ Reels</span>
          {!loading && (
            <span
              className="ml-1 text-xs font-semibold px-2 py-0.5 rounded-full"
              style={{ background: "var(--as-accent)", color: "#fff" }}
            >
              {reels.length}
            </span>
          )}
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-5xl mx-auto px-4 py-6">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="aspect-[9/16] rounded-xl as-skeleton"
                style={{ background: "var(--as-border)", borderRadius: "12px", animationDelay: `${i * 60}ms` }}
              />
            ))}
          </div>
        ) : reels.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl bg-black/40 border border-[#ffd700]/10 shadow-[0_0_30px_rgba(255,215,0,0.03)] backdrop-blur-md">
            <Film className="w-10 h-10 mb-4 text-[#ffd700]/40" />
            <p className="text-sm font-medium text-[var(--as-text)]">No reels yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {reels.map((reel) => (
              <button
                key={reel.id}
                onClick={() => setLightbox(reel)}
                className="group relative aspect-[9/16] rounded-xl overflow-hidden bg-black focus:outline-none"
                style={{ borderRadius: "12px" }}
              >
                {reel.thumbnail_url ? (
                  <img
                    src={reel.thumbnail_url}
                    alt={reel.title}
                    className="w-full h-full object-cover opacity-80 group-hover:opacity-60 transition-opacity"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-b from-neutral-800 to-neutral-900" />
                )}
                {/* Play overlay */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-12 h-12 rounded-full bg-[var(--as-surface)]/20 backdrop-blur-sm flex items-center justify-center">
                    <Play className="w-5 h-5 text-white fill-white" />
                  </div>
                </div>
                {/* Title */}
                <div className="absolute bottom-0 left-0 right-0 p-2.5 bg-gradient-to-t from-black/70 to-transparent">
                  <p className="text-xs text-white font-medium truncate text-left">{reel.title}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
          onClick={() => setLightbox(null)}
        >
          <button
            onClick={() => setLightbox(null)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-[var(--as-surface)]/10 hover:bg-[var(--as-surface)]/20 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
          <div
            className="relative max-h-[90vh] max-w-[420px] w-full mx-4"
            onClick={e => e.stopPropagation()}
          >
            <video
              src={lightbox.video_url}
              controls
              autoPlay
              className="w-full h-full rounded-xl"
              style={{ maxHeight: "90vh", borderRadius: "16px" }}
            />
            <p className="mt-2 text-sm text-white/80 text-center font-medium">{lightbox.title}</p>
          </div>
        </div>
      )}
    </div>
  );
}
