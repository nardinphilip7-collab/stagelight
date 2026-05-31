"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Heart, MessageCircle, Bookmark } from "lucide-react";
import { apiClient } from "@/lib/api";
import { getUser } from "@/lib/auth";

interface LikedPost {
  id: string | number;
  content: string;
  created_at: string;
  author_name?: string;
  author_avatar?: string;
  likes?: number;
  comments?: number;
}

export default function LikedPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<LikedPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!getUser()) { router.replace("/login"); return; }
    apiClient.get<LikedPost[]>("/feed-items/?liked=true")
      .then(data => setPosts(Array.isArray(data) ? data : []))
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
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
          <Heart className="w-5 h-5" style={{ color: "#C8312A" }} />
          <h1 className="font-semibold text-base" style={{ color: "var(--as-text)", fontFamily: "var(--as-font-display)" }}>Liked Content</h1>
          {!loading && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: "var(--as-accent)", color: "#fff" }}>
              {posts.length}
            </span>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 flex flex-col gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={{ height: "110px", borderRadius: "14px", background: "var(--as-surface)", border: "1px solid var(--as-border)", opacity: 0.6 }} />
          ))
        ) : posts.length === 0 ? (
          <div style={{ background: "#F0EDE8", border: "1px solid var(--as-border)", borderRadius: "14px", padding: "64px 24px", textAlign: "center" }}>
            <Heart className="w-9 h-9 mx-auto mb-3" style={{ color: "var(--as-text-muted)", opacity: 0.4 }} />
            <p className="text-sm font-medium" style={{ color: "var(--as-text-muted)" }}>No liked posts yet</p>
          </div>
        ) : (
          posts.map(post => (
            <div key={post.id} style={{ background: "var(--as-surface)", border: "1px solid var(--as-border)", borderRadius: "14px", padding: "20px" }}>
              {post.author_name && (
                <div className="flex items-center gap-2 mb-3">
                  {post.author_avatar ? (
                    <img src={post.author_avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: "var(--as-accent)" }}>
                      {post.author_name[0]?.toUpperCase()}
                    </div>
                  )}
                  <p className="text-sm font-semibold" style={{ color: "var(--as-text)" }}>{post.author_name}</p>
                </div>
              )}
              <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: "var(--as-text)" }}>{post.content}</p>
              {post.created_at && (
                <p className="text-xs mt-2" style={{ color: "var(--as-text-muted)" }}>
                  {new Date(post.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                </p>
              )}
              <div className="flex items-center gap-4 mt-3 pt-3" style={{ borderTop: "1px solid var(--as-border)" }}>
                <span className="flex items-center gap-1.5 text-xs" style={{ color: "#C8312A" }}>
                  <Heart className="w-3.5 h-3.5" fill="currentColor" />{post.likes ?? 0}
                </span>
                {(post.comments ?? 0) > 0 && (
                  <span className="flex items-center gap-1.5 text-xs" style={{ color: "var(--as-text-muted)" }}>
                    <MessageCircle className="w-3.5 h-3.5" />{post.comments}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
