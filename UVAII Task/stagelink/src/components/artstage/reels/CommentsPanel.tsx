"use client";

import { useState, useEffect } from "react";
import { X, Heart, Send } from "lucide-react";
import { apiClient } from "@/lib/api";
import { getUser } from "@/lib/auth";

interface Comment {
  id: number;
  author: number;
  author_name: string;
  author_avatar: string;
  text: string;
  created_at: string;
}

function relativeTime(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
  if (diff < 1) return "just now";
  if (diff < 60) return `${diff}m`;
  const hrs = Math.floor(diff / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

interface CommentsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  commentCount: number;
  reelId: string;
}

export function CommentsPanel({ isOpen, onClose, commentCount, reelId }: CommentsPanelProps) {
  const [newComment, setNewComment] = useState("");
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [likedComments, setLikedComments] = useState<Set<number>>(new Set());
  const currentUser = getUser();
  const userInitial = currentUser?.email?.[0]?.toUpperCase() ?? "?";

  useEffect(() => {
    if (!isOpen || !reelId) return;
    setLoading(true);
    apiClient.get<Comment[]>(`/reels/${reelId}/comments/`)
      .then(setComments)
      .catch(() => setComments([]))
      .finally(() => setLoading(false));
  }, [isOpen, reelId]);

  if (!isOpen) return null;

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = newComment.trim();
    if (!text || submitting) return;
    setSubmitting(true);
    try {
      const created = await apiClient.post<Comment>(`/reels/${reelId}/comments/`, { text });
      setComments(prev => [created, ...prev]);
      setNewComment("");
    } catch {
      // silently fail
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
        onClick={onClose}
        style={{ animation: "fadeIn 0.2s ease-out forwards" }}
      />
      <div
        className="fixed bottom-0 left-0 right-0 h-[65vh] bg-[rgba(22,22,24,0.95)] backdrop-blur-xl border-t border-white/10 z-50 rounded-t-3xl flex flex-col shadow-[0_-10px_40px_rgba(0,0,0,0.5)] overflow-hidden"
        style={{ animation: "slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/5 relative">
          <div className="absolute left-1/2 -top-3 -translate-x-1/2 w-12 h-1 bg-white/20 rounded-full" />
          <div className="w-8" />
          <h3 className="font-syne text-[18px] font-bold text-white">{commentCount} comments</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-[#d0c6ab] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar">
          {loading ? (
            <p className="text-center text-[14px] font-outfit text-[#999077] pt-8">Loading comments...</p>
          ) : comments.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full opacity-50">
              <p className="text-center text-[15px] font-outfit text-[#d0c6ab]">No comments yet.</p>
              <p className="text-center text-[13px] font-outfit text-[#999077] mt-1">Start the conversation!</p>
            </div>
          ) : (
            comments.map(comment => (
              <div key={comment.id} className="flex gap-4 group/comment">
                <div className="w-10 h-10 rounded-full bg-[var(--as-surface)] border border-white/10 shrink-0 overflow-hidden flex items-center justify-center font-bold text-[#ffd700] text-sm">
                  {comment.author_avatar
                    ? <img src={comment.author_avatar} alt="" className="w-full h-full object-cover" />
                    : comment.author_name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-[13px] font-bold font-outfit text-[#d0c6ab] truncate">{comment.author_name}</p>
                    <span className="text-[11px] font-medium font-outfit text-[#999077]">{relativeTime(comment.created_at)}</span>
                  </div>
                  <p className="text-[14px] font-outfit text-white leading-relaxed">{comment.text}</p>
                </div>
                <div className="flex flex-col items-center gap-1 text-[#999077] shrink-0 pt-1">
                  <button
                    onClick={() => setLikedComments(prev => {
                      const next = new Set(prev);
                      if (next.has(comment.id)) { next.delete(comment.id); } else { next.add(comment.id); }
                      return next;
                    })}
                    className="hover:text-red-500 hover:scale-110 transition-all active:scale-95 p-1"
                    style={{ color: likedComments.has(comment.id) ? '#ef4444' : undefined }}
                  >
                    <Heart className="w-4 h-4" fill={likedComments.has(comment.id) ? 'currentColor' : 'none'} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-white/5 bg-[rgba(20,20,22,0.8)] backdrop-blur-md">
          <form onSubmit={handleAddComment} className="flex gap-3 items-center max-w-4xl mx-auto">
            <div className="w-10 h-10 rounded-full bg-[var(--as-surface)] border border-white/10 shrink-0 overflow-hidden flex items-center justify-center font-bold text-[#ffd700] text-sm">
              {userInitial}
            </div>
            <div className="flex-1 relative">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className="w-full bg-[rgba(255,255,255,0.05)] border border-white/10 hover:border-white/20 focus:border-[#ffd700]/50 rounded-full py-3 pl-5 pr-12 text-[14px] font-outfit text-white placeholder-[#999077] focus:outline-none transition-all shadow-inner"
              />
              <button
                type="submit"
                disabled={!newComment.trim() || submitting}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full text-[#ffd700] disabled:text-[#999077] disabled:bg-transparent hover:bg-[#ffd700]/10 transition-all"
              >
                <Send className="w-4 h-4 translate-x-[1px] translate-y-[1px]" />
              </button>
            </div>
          </form>
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255,255,255,0.2);
        }
      `}</style>
    </>
  );
}
