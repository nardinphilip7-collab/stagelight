'use client';
import type { Artist, Post } from '@/lib/artstage/types';
import { FileText, Trash2 } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { useState } from 'react';

interface PostsTabProps { artist: Artist; posts: Post[]; isOwner?: boolean; }

export function PostsTab({ artist, posts: initialPosts, isOwner }: PostsTabProps) {
  const [posts, setPosts] = useState(initialPosts);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this post?")) return;
    try {
      await apiClient.delete(`/feed/${id}/`);
      setPosts(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      console.error(err);
      alert("Failed to delete post");
    }
  };

  return (
    <div className="px-4 py-6">
      {posts.length === 0 ? (
          <div style={{ background: "rgba(22,22,24,0.6)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "14px", padding: "40px 24px", textAlign: "center" }}>
            <FileText className="w-8 h-8 mx-auto mb-3" style={{ color: "var(--as-text-muted)", opacity: 0.4 }} />
            <p className="text-sm font-medium" style={{ color: "var(--as-text-muted)" }}>{artist.stageName} has no posts yet.</p>
          </div>
      ) : (
        <div className="flex flex-col gap-3">
          {posts.map((p) => (
            <div key={p.id} className="relative p-4 rounded-xl border border-[var(--as-border)] bg-[var(--as-surface)] group">
              <p className="text-[var(--as-text)] text-sm">{p.content}</p>
              <p className="text-[var(--as-text-muted)] text-xs mt-2">
                {p.stats.likes} likes · {p.stats.comments} comments
              </p>
              {isOwner && (
                <button 
                  onClick={(e) => handleDelete(e, p.id)}
                  className="absolute top-2 right-2 w-8 h-8 rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
