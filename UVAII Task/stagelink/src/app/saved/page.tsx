"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Bookmark, Play, FileText } from "lucide-react";
import { apiClient } from "@/lib/api";
import { getUser } from "@/lib/auth";
import Link from "next/link";

interface SavedPost {
  id: string | number;
  content: string;
  created_at: string;
  stats?: { likes: number; comments: number; saves: number };
  artist?: number;
}

interface SavedReel {
  id: string | number;
  title: string;
  video_url: string;
  thumbnail_url?: string;
  talent_name?: string;
}

export default function SavedPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<SavedPost[]>([]);
  const [reels, setReels] = useState<SavedReel[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"posts" | "reels">("posts");

  useEffect(() => {
    if (!getUser()) { router.replace("/login"); return; }
    Promise.allSettled([
      apiClient.get<SavedPost[]>("/feed-items/?saved=true"),
      apiClient.get<SavedReel[]>("/reels/?saved=true"),
    ]).then(([postsRes, reelsRes]) => {
      if (postsRes.status === "fulfilled") setPosts(Array.isArray(postsRes.value) ? postsRes.value : []);
      if (reelsRes.status === "fulfilled") setReels(Array.isArray(reelsRes.value) ? reelsRes.value : []);
    }).finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="artstage min-h-screen" style={{ background: "var(--as-bg)" }}>
      {/* Header */}
      <div className="sticky top-14 z-20 flex items-center gap-3 px-4 py-3 border-b" style={{ background: "var(--as-surface)", borderColor: "var(--as-border)" }}>
        <button onClick={() => router.push("/settings")} className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-black/5 transition-colors">
          <ArrowLeft className="w-5 h-5" style={{ color: "var(--as-text)" }} />
        </button>
        <div className="flex items-center gap-2">
          <Bookmark className="w-5 h-5" style={{ color: "var(--as-accent)" }} />
          <h1 className="font-semibold text-base" style={{ color: "var(--as-text)", fontFamily: "var(--as-font-display)" }}>Saved</h1>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b" style={{ borderColor: "var(--as-border)", background: "var(--as-surface)" }}>
        {(["posts", "reels"] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="flex-1 py-3 text-sm font-medium capitalize transition-colors"
            style={{
              color: tab === t ? "var(--as-accent)" : "var(--as-text-muted)",
              borderBottom: tab === t ? "2px solid var(--as-accent)" : "2px solid transparent",
            }}
          >
            {t === "posts" ? `Posts (${posts.length})` : `Reels (${reels.length})`}
          </button>
        ))}
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex flex-col gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} style={{ height: "100px", borderRadius: "14px", background: "var(--as-surface)", border: "1px solid var(--as-border)", opacity: 0.6 }} />
            ))}
          </div>
        ) : tab === "posts" ? (
          posts.length === 0 ? (
            <EmptyCard icon={<FileText className="w-9 h-9" style={{ color: "var(--as-text-muted)", opacity: 0.4 }} />} label="No saved posts yet" />
          ) : (
            <div className="flex flex-col gap-4">
              {posts.map(post => (
                <div key={post.id} style={{ background: "var(--as-surface)", border: "1px solid var(--as-border)", borderRadius: "14px", padding: "20px" }}>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--as-text)" }}>{post.content}</p>
                  {post.created_at && (
                    <p className="text-xs mt-2" style={{ color: "var(--as-text-muted)" }}>
                      {new Date(post.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )
        ) : (
          reels.length === 0 ? (
            <EmptyCard icon={<Play className="w-9 h-9" style={{ color: "var(--as-text-muted)", opacity: 0.4 }} />} label="No saved reels yet" />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {reels.map(reel => (
                <div key={reel.id} className="aspect-[9/16] relative rounded-xl overflow-hidden bg-black" style={{ borderRadius: "12px" }}>
                  {reel.thumbnail_url
                    ? <img src={reel.thumbnail_url} alt={reel.title} className="w-full h-full object-cover opacity-80" />
                    : <div className="w-full h-full bg-gradient-to-b from-neutral-800 to-neutral-900" />}
                  <div className="absolute bottom-0 left-0 right-0 p-2.5 bg-gradient-to-t from-black/70 to-transparent">
                    <p className="text-xs text-white font-medium truncate">{reel.title}</p>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}

function EmptyCard({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div style={{ background: "#F0EDE8", border: "1px solid var(--as-border)", borderRadius: "14px", padding: "64px 24px", textAlign: "center" }}>
      <div className="flex justify-center mb-3">{icon}</div>
      <p className="text-sm font-medium" style={{ color: "var(--as-text-muted)" }}>{label}</p>
    </div>
  );
}
