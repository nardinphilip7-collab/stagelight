"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, FileText, Heart, MessageCircle } from "lucide-react";
import { apiClient } from "@/lib/api";
import Link from "next/link";

interface Post {
  id: string | number;
  content: string;
  created_at: string;
  likes_count?: number;
  comments_count?: number;
  image_url?: string;
  author_avatar?: string;
  author_name?: string;
}

interface Talent {
  id: string;
  display_name?: string;
  name?: string;
  avatar_url?: string;
}

export default function TalentPostsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [talent, setTalent] = useState<Talent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiClient.get<Post[]>(`/posts/?artist=${id}`),
      apiClient.get<Talent>(`/talents/${id}/`),
    ])
      .then(([p, t]) => {
        setPosts(p);
        setTalent(t);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const talentName = talent?.display_name || talent?.name || "Talent";
  const avatarUrl = talent?.avatar_url;

  function formatDate(iso: string) {
    try {
      return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
    } catch {
      return iso;
    }
  }

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
          <span className="text-sm" style={{ color: "var(--as-text-muted)" }}>/ Posts</span>
          {!loading && (
            <span
              className="ml-1 text-xs font-semibold px-2 py-0.5 rounded-full"
              style={{ background: "var(--as-accent)", color: "#fff" }}
            >
              {posts.length}
            </span>
          )}
        </div>
      </div>

      {/* Posts list */}
      <div className="max-w-2xl mx-auto px-4 py-6 flex flex-col gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl p-5"
              style={{
                background: "var(--as-surface)",
                border: "1px solid var(--as-border)",
                borderRadius: "14px",
                height: "120px",
                opacity: 0.6,
                animationDelay: `${i * 80}ms`,
              }}
            />
          ))
        ) : posts.length === 0 ? (
          <div
            style={{
              background: "rgba(22,22,24,0.6)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: "14px",
              padding: "64px 24px",
              textAlign: "center",
            }}
          >
            <FileText className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--as-text-muted)", opacity: 0.4 }} />
            <p className="text-sm font-medium" style={{ color: "var(--as-text-muted)" }}>No posts yet</p>
          </div>
        ) : (
          posts.map((post) => (
            <div
              key={post.id}
              style={{
                background: "var(--as-surface)",
                border: "1px solid var(--as-border)",
                borderRadius: "14px",
                padding: "20px",
              }}
            >
              {/* Author row */}
              <div className="flex items-center gap-3 mb-3">
                {(post.author_avatar || avatarUrl) ? (
                  <img
                    src={post.author_avatar || avatarUrl}
                    alt={talentName}
                    className="w-9 h-9 rounded-full object-cover"
                  />
                ) : (
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white"
                    style={{ background: "var(--as-accent)" }}
                  >
                    {talentName[0]?.toUpperCase() ?? "?"}
                  </div>
                )}
                <div>
                  <p className="text-sm font-semibold" style={{ color: "var(--as-text)" }}>
                    {post.author_name || talentName}
                  </p>
                  {post.created_at && (
                    <p className="text-xs" style={{ color: "var(--as-text-muted)" }}>
                      {formatDate(post.created_at)}
                    </p>
                  )}
                </div>
              </div>

              {/* Content */}
              <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: "var(--as-text)" }}>
                {post.content}
              </p>

              {/* Image */}
              {post.image_url && (
                <img
                  src={post.image_url}
                  alt=""
                  className="mt-3 w-full rounded-xl object-cover max-h-80"
                  style={{ borderRadius: "10px" }}
                />
              )}

              {/* Footer counts */}
              {((post.likes_count ?? 0) > 0 || (post.comments_count ?? 0) > 0) && (
                <div className="flex items-center gap-4 mt-3 pt-3" style={{ borderTop: "1px solid var(--as-border)" }}>
                  {(post.likes_count ?? 0) > 0 && (
                    <span className="flex items-center gap-1.5 text-xs" style={{ color: "var(--as-text-muted)" }}>
                      <Heart className="w-3.5 h-3.5" />
                      {post.likes_count}
                    </span>
                  )}
                  {(post.comments_count ?? 0) > 0 && (
                    <span className="flex items-center gap-1.5 text-xs" style={{ color: "var(--as-text-muted)" }}>
                      <MessageCircle className="w-3.5 h-3.5" />
                      {post.comments_count}
                    </span>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
