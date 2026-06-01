"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Heart,
  MessageCircle,
  Bookmark,
  MoreHorizontal,
  CheckCircle2,
  Image as ImageIcon,
  Calendar,
  FileText,
  Loader2,
  Plus,
  X,
  TrendingUp,
  Users,
  Eye,
  BarChart3,
  Repeat,
} from "lucide-react";
import Link from "next/link";
import { apiClient } from "@/lib/api";
import { getUser } from "@/lib/auth";
import { uploadFile } from "@/lib/upload";

/* ═══════════════════════════════ TYPES ════════════════════════════ */
interface FeedItem {
  id: string;
  author_name: string;
  author_role: string;
  author_avatar: string;
  verified?: boolean;
  time: string;
  created_at?: string;
  description: string;
  likes: number;
  comments: number;
  shares: number;
  has_liked?: boolean;
  comment_count?: number;
  attachments?: { url: string }[];
  repost_of_detail?: {
    id: string;
    author_name: string;
    author_role: string;
    author_avatar: string;
    verified?: boolean;
    time: string;
    created_at?: string;
    description: string;
    attachments?: { url: string }[];
  };
}

interface Comment {
  id: number;
  author_name: string;
  author_avatar: string;
  text: string;
  created_at: string;
}

interface TalentProfile {
  id: string;
  name: string;
  category: string;
  avatar: string;
  followers: number;
}

interface DashboardData {
  profile_views: number;
}

function formatTimeAgo(timeString: string) {
  if (!timeString) return "Just now";
  const date = new Date(timeString);
  // If it's not a valid date string (e.g. "2h ago"), return it directly
  if (isNaN(date.getTime())) return timeString;
  
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return "Just now";
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;
  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 52) return `${diffInWeeks}w ago`;
  const diffInYears = Math.floor(diffInWeeks / 52);
  return `${diffInYears}y ago`;
}

/* ═══════════════ SHARED UI (ArtStage styled) ═════════════════════ */
function Pill({ children, active = false }: { children: React.ReactNode; active?: boolean }) {
  return (
    <span className={`as-pill ${active ? '!bg-[var(--as-accent)] !text-white !border-[var(--as-accent)]' : ''}`}>
      {children}
    </span>
  );
}


/* ═══════════════ ANALYTICS MINI PANEL ════════════════════════════ */
function MiniAnalyticsPanel({ profileViews }: { profileViews: number | null }) {
  return (
    <div className="as-surface rounded-lg p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 as-accent" />
          <h3 className="font-semibold as-text text-sm">Your Activity</h3>
        </div>
        <Pill>Only you</Pill>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[rgba(255,255,255,0.05)] rounded-lg p-3 text-center border border-[var(--as-border)]">
          <Users className="w-4 h-4 as-accent mx-auto mb-1" />
          <p className="text-xl font-bold as-text">{profileViews !== null ? profileViews : '—'}</p>
          <p className="text-[10px] as-text-muted">Profile views</p>
        </div>
        <div className="bg-[rgba(255,255,255,0.05)] rounded-lg p-3 text-center border border-[var(--as-border)]">
          <Eye className="w-4 h-4 as-accent mx-auto mb-1" />
          <p className="text-xl font-bold as-text">—</p>
          <p className="text-[10px] as-text-muted">Post reach</p>
        </div>
      </div>
    </div>
  );
}

/* ─── Component ───────────────────────────────────────────────────── */
export default function FeedPage() {
  const router = useRouter();
  const currentUser = getUser();

  // Feed state
  const [feedData, setFeedData] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Like state (per post)
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});

  // Comment state (per post)
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [commentLoading, setCommentLoading] = useState<Set<string>>(new Set());
  const [submittingComment, setSubmittingComment] = useState<Set<string>>(new Set());

  // Sidebar state
  const [myProfile, setMyProfile] = useState<TalentProfile | null>(null);
  const [profileViews, setProfileViews] = useState<number | null>(null);

  // Post creation
  const [postText, setPostText] = useState("");
  const [posting, setPosting] = useState(false);
  const [postOpen, setPostOpen] = useState(false);
  const [postImages, setPostImages] = useState<string[]>([]);
  const [postImgUploading, setPostImgUploading] = useState(false);

  // Save / share state
  const [savedPosts, setSavedPosts] = useState<Set<string>>(new Set());

  // Repost state
  const [repostMenuOpenId, setRepostMenuOpenId] = useState<string | null>(null);
  const [repostModalOpen, setRepostModalOpen] = useState(false);
  const [postToRepost, setPostToRepost] = useState<FeedItem | null>(null);
  const [repostText, setRepostText] = useState("");
  const [reposting, setReposting] = useState(false);

  // Toast popup
  const [toast, setToast] = useState<string | null>(null);

  // Hydration guard
  const [isMounted, setIsMounted] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const postImgInputRef = useRef<HTMLInputElement>(null);

  /* ── Initial load ── */
  useEffect(() => {
    if (!currentUser) { router.replace("/login"); return; }
    setIsMounted(true);

    apiClient.get<FeedItem[] | { results: FeedItem[] }>('/feed/')
      .then((raw) => {
        const data: FeedItem[] = Array.isArray(raw) ? raw : ((raw as any).results ?? []);
        setFeedData(data);
        const initialLiked = new Set<string>();
        const initialCounts: Record<string, number> = {};
        data.forEach((item) => {
          if (item.has_liked) initialLiked.add(item.id);
          initialCounts[item.id] = item.likes;
        });
        setLikedPosts(initialLiked);
        setLikeCounts(initialCounts);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch feed", err);
        setLoading(false);
      });

    apiClient.get<TalentProfile[]>('/talents/?mine=true')
      .then(list => { if (list.length > 0) setMyProfile(list[0]); })
      .catch(() => { });

    apiClient.get<DashboardData>('/analytics/dashboard/')
      .then(d => setProfileViews(d.profile_views))
      .catch(() => { });

    try {
      const saved = JSON.parse(localStorage.getItem('sl_saved_posts') ?? '[]') as string[];
      setSavedPosts(new Set(saved));
    } catch { /* ignore */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Toggle Like ── */
  const handleLike = useCallback(async (postId: string) => {
    const wasLiked = likedPosts.has(postId);

    setLikedPosts(prev => {
      const next = new Set(prev);
      wasLiked ? next.delete(postId) : next.add(postId);
      return next;
    });
    setLikeCounts(prev => ({
      ...prev,
      [postId]: (prev[postId] ?? 0) + (wasLiked ? -1 : 1),
    }));

    try {
      const res = await apiClient.post<{ liked: boolean; likes: number }>(
        `/feed/${postId}/like/`, {}
      );
      setLikeCounts(prev => ({ ...prev, [postId]: res.likes }));
      setLikedPosts(prev => {
        const next = new Set(prev);
        res.liked ? next.add(postId) : next.delete(postId);
        return next;
      });
    } catch (e) {
      setLikedPosts(prev => {
        const next = new Set(prev);
        wasLiked ? next.add(postId) : next.delete(postId);
        return next;
      });
      setLikeCounts(prev => ({
        ...prev,
        [postId]: (prev[postId] ?? 0) + (wasLiked ? 1 : -1),
      }));
    }
  }, [likedPosts]);

  /* ── Load Comments ── */
  const loadComments = useCallback(async (postId: string) => {
    if (comments[postId]) return;
    setCommentLoading(prev => new Set(prev).add(postId));
    try {
      const data = await apiClient.get<Comment[]>(`/feed/${postId}/comments/`);
      setComments(prev => ({ ...prev, [postId]: data }));
    } catch (e) {
      setComments(prev => ({ ...prev, [postId]: [] }));
    } finally {
      setCommentLoading(prev => {
        const next = new Set(prev);
        next.delete(postId);
        return next;
      });
    }
  }, [comments]);

  /* ── Toggle comment section ── */
  const toggleComments = useCallback((postId: string) => {
    setExpandedComments(prev => {
      const next = new Set(prev);
      if (next.has(postId)) {
        next.delete(postId);
      } else {
        next.add(postId);
        loadComments(postId);
      }
      return next;
    });
  }, [loadComments]);

  /* ── Submit Comment ── */
  const handleCommentSubmit = useCallback(async (postId: string) => {
    const text = (commentInputs[postId] ?? '').trim();
    if (!text) return;

    setSubmittingComment(prev => new Set(prev).add(postId));
    try {
      const newComment = await apiClient.post<Comment>('/feed-comments/', {
        feed_item: postId,
        text,
      });
      setComments(prev => ({
        ...prev,
        [postId]: [...(prev[postId] ?? []), newComment],
      }));
      setCommentInputs(prev => ({ ...prev, [postId]: '' }));
      setFeedData(prev => prev.map(p =>
        p.id === postId ? { ...p, comments: p.comments + 1 } : p
      ));
    } catch (e) {
      console.error("Failed to post comment", e);
    } finally {
      setSubmittingComment(prev => {
        const next = new Set(prev);
        next.delete(postId);
        return next;
      });
    }
  }, [commentInputs]);

  /* ── Upload images for quick-post ── */
  async function handlePostImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length || postImages.length >= 4) return;
    const toUpload = files.slice(0, 4 - postImages.length);
    setPostImgUploading(true);
    try {
      const urls = await Promise.all(toUpload.map(f => uploadFile(f)));
      setPostImages(prev => [...prev, ...urls]);
    } catch { /* ignore */ }
    finally {
      setPostImgUploading(false);
      if (postImgInputRef.current) postImgInputRef.current.value = '';
    }
  }

  /* ── Save / bookmark post ── */
  function handleSave(postId: string) {
    setSavedPosts(prev => {
      const next = new Set(prev);
      next.has(postId) ? next.delete(postId) : next.add(postId);
      try { localStorage.setItem('sl_saved_posts', JSON.stringify([...next])); } catch { /* ignore */ }
      return next;
    });
  }

  /* ── Repost ── */
  async function handleRepostSubmit(postId: string, text: string) {
    setReposting(true);
    try {
      const newPost = await apiClient.post<FeedItem>('/feed/', {
        description: text.trim(),
        category: 'General',
        attachments: [],
        repost_of: postId
      });
      setFeedData(prev => [newPost, ...prev]);
      setLikeCounts(prev => ({ ...prev, [newPost.id]: 0 }));
      setRepostModalOpen(false);
      setRepostText("");
      setPostToRepost(null);
      setRepostMenuOpenId(null);
      setToast("Post shared successfully!");
      setTimeout(() => setToast(null), 2500);
    } catch (err) {
      console.error(err);
    } finally {
      setReposting(false);
    }
  }

  /* ── Create Post ── */
  async function handlePost(e: React.FormEvent) {
    e.preventDefault();
    if (!postText.trim()) return;
    setPosting(true);
    try {
      const newPost = await apiClient.post<FeedItem>('/feed/', {
        description: postText.trim(),
        category: 'General',
        attachments: postImages.map(url => ({ url })),
      });
      setFeedData(prev => [newPost, ...prev]);
      setLikeCounts(prev => ({ ...prev, [newPost.id]: 0 }));
      setPostText("");
      setPostImages([]);
      setPostOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setPosting(false);
    }
  }

  /* ── Derived display values ── */
  const fallbackLetter = isMounted
    ? (myProfile?.name ?? currentUser?.email ?? 'U').slice(0, 1).toUpperCase()
    : 'U';
  const displayName = isMounted
    ? (myProfile?.name ?? currentUser?.email?.split('@')[0] ?? 'You')
    : 'You';
  const displayRole = isMounted
    ? (myProfile?.category ?? currentUser?.role ?? 'Member')
    : 'Member';
  const isHirerUser = isMounted && (currentUser?.role === 'HIRER' || currentUser?.role === 'AGENCY');
  const profileLink = isMounted && currentUser
    ? (myProfile?.id ? `/profile/${myProfile.id}` : isHirerUser ? '/profile/hirer' : '#')
    : '#';

  /* ── Render ── */
  return (
    <div className="artstage artstage-dark pt-6 pb-10 px-4 max-w-6xl mx-auto flex flex-col md:flex-row gap-6">

      {/* ── Left Sidebar ── */}
      <div className="hidden md:block w-64 shrink-0 space-y-4">
        {/* Profile card */}
        <div className="as-surface rounded-xl overflow-hidden">
          <div className="h-20 bg-gradient-to-r from-[var(--as-accent)]/30 to-[rgba(255,255,255,0.04)] relative">
            <div className="absolute -bottom-9 left-1/2 -translate-x-1/2 w-18 h-18 rounded-xl border-2 border-[var(--as-border)] bg-[var(--as-surface)] overflow-hidden shadow-sm">
              {myProfile?.avatar ? (
                <img src={myProfile.avatar} alt={myProfile.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-lg font-bold as-accent bg-[var(--as-border)]">
                  {fallbackLetter}
                </div>
              )}
            </div>
          </div>
          <div className="pt-12 pb-4 px-4 text-center border-b border-[var(--as-border)]">
            <Link href={profileLink}>
              <h2 className="font-semibold as-text hover:as-accent transition-colors cursor-pointer">
                {displayName}
              </h2>
            </Link>
            <p className="text-xs as-text-muted mt-1">{displayRole}</p>
          </div>
          <div className="py-3 px-4 hover:bg-[rgba(255,255,255,0.06)] cursor-pointer text-xs font-medium as-text-muted flex justify-between">
            <span>Followers</span>
            <span className="as-accent font-semibold">{myProfile?.followers?.toLocaleString() ?? '—'}</span>
          </div>
        </div>

        {/* Analytics mini panel */}
        <MiniAnalyticsPanel profileViews={profileViews} />
      </div>

      {/* ── Main Feed ── */}
      <div className="flex-1 max-w-2xl space-y-5">

        {/* Create Post */}
        <div className="as-surface rounded-xl p-5">
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--as-border)] flex items-center justify-center text-sm font-bold as-accent shrink-0 overflow-hidden">
              {myProfile?.avatar ? (
                <img src={myProfile.avatar} alt="" className="w-full h-full object-cover" />
              ) : (
                fallbackLetter
              )}
            </div>
            {!postOpen ? (
              <button
                className="flex-1 text-left px-4 py-2.5 rounded-full border border-[var(--as-border)] as-text-secondary text-sm hover:border-[var(--as-accent)] hover:as-accent transition-colors bg-[var(--as-surface)]"
                onClick={() => { setPostOpen(true); setTimeout(() => textareaRef.current?.focus(), 50); }}
              >
                Start a post
              </button>
            ) : (
              <form onSubmit={handlePost} className="flex-1 space-y-3">
                <textarea
                  ref={textareaRef}
                  value={postText}
                  onChange={e => setPostText(e.target.value)}
                  rows={3}
                  placeholder="Share what's on your mind..."
                  className="w-full bg-[rgba(255,255,255,0.05)] border border-[var(--as-border)] rounded-xl px-4 py-3 text-sm as-text placeholder:as-text-muted outline-none focus:border-[var(--as-accent)] focus:ring-1 focus:ring-[var(--as-accent)]/20 resize-none"
                />
                {postImages.length > 0 && (
                  <div className={`grid gap-1 rounded-xl overflow-hidden ${postImages.length === 1 ? '' : 'grid-cols-2'}`}>
                    {postImages.map((url, i) => (
                      <div key={i} className="relative aspect-square bg-[#201f20]">
                        <img src={url} alt="" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setPostImages(prev => prev.filter((_, j) => j !== i))}
                          className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center hover:bg-black/80"
                        >
                          <X className="w-3 h-3 text-white" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    disabled={postImages.length >= 4 || postImgUploading}
                    onClick={() => postImgInputRef.current?.click()}
                    className="flex items-center gap-1.5 text-xs as-text-muted hover:as-accent transition-colors disabled:opacity-40"
                  >
                    {postImgUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImageIcon className="w-3.5 h-3.5" />}
                    Add photo
                  </button>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => { setPostOpen(false); setPostText(""); setPostImages([]); }} className="as-btn-outline text-sm !py-1.5">
                      Cancel
                    </button>
                    <button type="submit" disabled={!postText.trim() || posting} className="as-btn-primary text-sm !py-1.5">
                      {posting && <Loader2 className="w-4 h-4 animate-spin mr-1" />}
                      Post
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
          {!postOpen && (
            <div className="flex justify-between items-center mt-4 pt-3 border-t border-[var(--as-border)] px-1">
              <button
                className="flex-1 flex items-center justify-center gap-2 text-xs font-medium as-text-muted hover:as-accent transition-colors py-1"
                onClick={() => { setPostOpen(true); setTimeout(() => postImgInputRef.current?.click(), 80); }}
              >
                {postImgUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
                Media
              </button>
            </div>
          )}
          <input
            ref={postImgInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handlePostImageUpload}
          />
        </div>

        {/* Posts */}
        {loading ? (
          <div className="as-surface rounded-xl p-12 text-center">
            <div className="flex items-center justify-center gap-2 as-text-muted">
              <Loader2 className="w-5 h-5 animate-spin" /> Loading feed...
            </div>
          </div>
        ) : feedData.length === 0 ? (
          <div className="as-surface rounded-xl p-12 text-center as-text-muted">
            No posts yet. Be the first to post!
          </div>
        ) : (
          <div className="space-y-5">
            {feedData.map((post) => {
              const isLiked = likedPosts.has(post.id);
              const isSaved = savedPosts.has(post.id);
              const likeCount = likeCounts[post.id] ?? post.likes;
              const isExpanded = expandedComments.has(post.id);
              const postComments = comments[post.id] ?? [];
              const isLoadingComments = commentLoading.has(post.id);
              const isSubmitting = submittingComment.has(post.id);
              const commentInput = commentInputs[post.id] ?? '';

              return (
                <div
                  key={post.id}
                  className="as-surface rounded-xl overflow-hidden"
                >
                  {/* Header */}
                  {post.repost_of_detail && (
                    <div className="px-4 py-2 border-b border-[var(--as-border)] flex items-center gap-2 text-xs as-text-muted">
                      <Repeat className="w-3.5 h-3.5" />
                      <span className="font-semibold as-text">{post.author_name}</span> reposted this
                      <span className="ml-auto text-[10px] tracking-wider">{formatTimeAgo(post.created_at || post.time)}</span>
                    </div>
                  )}

                  {!post.repost_of_detail ? (
                    <div className="flex items-center justify-between p-4 pb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[var(--as-border)] flex items-center justify-center text-sm font-bold as-accent shrink-0 overflow-hidden">
                          {post.author_avatar ? (
                            <img src={post.author_avatar} alt="" className="w-full h-full object-cover" />
                          ) : (
                            post.author_name?.[0] ?? '?'
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-1">
                            <span className="font-semibold as-text text-sm hover:as-accent transition-colors cursor-pointer">
                              {post.author_name}
                            </span>
                            {post.verified && <CheckCircle2 className="w-3.5 h-3.5 as-verified-color" />}
                          </div>
                          <span className="text-xs as-text-muted block">{post.author_role}</span>
                          <span className="text-[10px] as-text-muted tracking-wider block mt-0.5">{formatTimeAgo(post.created_at || post.time)}</span>
                        </div>
                      </div>
                      <button className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[rgba(255,255,255,0.06)] transition-colors as-text-muted">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    post.description ? (
                      <div className="px-4 pt-3 pb-2">
                        <p className="text-sm as-text whitespace-pre-wrap">{post.description}</p>
                      </div>
                    ) : null
                  )}

                  {/* Caption */}
                  {!post.repost_of_detail && post.description && (
                    <div className="px-4 pb-3">
                      <p className="text-sm as-text whitespace-pre-wrap">{post.description}</p>
                    </div>
                  )}

                  {/* Media or Embedded Repost */}
                  {post.repost_of_detail ? (
                    <div className="mx-4 mb-3 mt-1 border border-[var(--as-border)] rounded-xl overflow-hidden bg-[rgba(255,255,255,0.02)]">
                      <div className="flex items-start p-3 gap-3">
                        <div className="w-10 h-10 rounded-xl overflow-hidden bg-[var(--as-border)] flex items-center justify-center">
                          {post.repost_of_detail.author_avatar ? (
                            <img src={post.repost_of_detail.author_avatar} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-sm font-bold as-accent">{post.repost_of_detail.author_name[0]}</span>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-1">
                            <span className="font-semibold as-text text-sm hover:as-accent transition-colors cursor-pointer">{post.repost_of_detail.author_name}</span>
                          </div>
                          <span className="text-xs as-text-muted block">{post.repost_of_detail.author_role}</span>
                        </div>
                      </div>
                      
                      {post.repost_of_detail.description && (
                        <div className="px-3 pb-3">
                          <p className="text-sm as-text line-clamp-3 whitespace-pre-wrap">{post.repost_of_detail.description}</p>
                        </div>
                      )}

                      {post.repost_of_detail.attachments && post.repost_of_detail.attachments.length > 0 && (
                        <div className={`w-full bg-[#201f20] ${post.repost_of_detail.attachments.length === 1 ? '' : 'grid grid-cols-2 gap-0.5'}`}>
                          {post.repost_of_detail.attachments.slice(0, 4).map((att: any, i: number) => (
                            <img
                              key={i}
                              src={att.url}
                              className={`w-full object-cover ${(post.repost_of_detail?.attachments?.length ?? 0) === 1 ? 'max-h-[400px]' : 'aspect-square'}`}
                              alt=""
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    post.attachments && post.attachments.length > 0 && (
                      <div className={`w-full bg-[#201f20] overflow-hidden ${post.attachments.length === 1 ? '' : 'grid grid-cols-2 gap-0.5'}`}>
                        {post.attachments.slice(0, 4).map((att, i) => (
                          <img
                            key={i}
                            src={att.url}
                            className={`w-full object-cover hover:scale-[1.02] transition-transform duration-500 ${post.attachments!.length === 1 ? 'max-h-[500px]' : 'aspect-square'}`}
                            alt="Post image"
                            onDoubleClick={() => handleLike(post.id)}
                          />
                        ))}
                      </div>
                    )
                  )}

                  {/* Stats */}
                  <div className="px-4 py-3 flex items-center justify-between text-xs as-text-muted border-b border-[var(--as-border)]">
                    <div className="flex items-center gap-1.5">
                      {likeCount > 0 ? (
                        <>
                          <div className="w-4 h-4 rounded-full bg-[#e10111] flex items-center justify-center">
                            <Heart className="w-2.5 h-2.5 text-white" fill="currentColor" />
                          </div>
                          <span className="font-medium hover:as-accent cursor-pointer transition-colors">{likeCount.toLocaleString()} {likeCount === 1 ? 'like' : 'likes'}</span>
                        </>
                      ) : (
                        <span></span>
                      )}
                    </div>
                    <div className="flex gap-3">
                      {post.comments > 0 && (
                        <button onClick={() => toggleComments(post.id)} className="hover:as-accent transition-colors font-medium">
                          {post.comments} comment{post.comments !== 1 ? 's' : ''}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons (At the bottom) */}
                  <div className="px-2 py-1 flex justify-between items-center relative">
                    <button
                      onClick={() => handleLike(post.id)}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg transition-all font-medium text-[13px] hover:bg-[rgba(255,255,255,0.04)] ${isLiked ? 'text-[#e10111]' : 'as-text-muted hover:as-text'}`}
                    >
                      <Heart className="w-5 h-5" fill={isLiked ? 'currentColor' : 'none'} />
                      Like
                    </button>
                    <button
                      onClick={() => toggleComments(post.id)}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg transition-all font-medium text-[13px] hover:bg-[rgba(255,255,255,0.04)] ${isExpanded ? 'as-text' : 'as-text-muted hover:as-text'}`}
                    >
                      <MessageCircle className="w-5 h-5" />
                      Comment
                    </button>
                    
                    <div className="flex-1 relative flex justify-center">
                      <button
                        onClick={() => setRepostMenuOpenId(repostMenuOpenId === post.id ? null : post.id)}
                        className={`w-full flex items-center justify-center gap-2 py-3 rounded-lg transition-all font-medium text-[13px] hover:bg-[rgba(255,255,255,0.04)] ${repostMenuOpenId === post.id ? 'as-text' : 'as-text-muted hover:as-text'}`}
                      >
                        <Repeat className="w-5 h-5" />
                        Repost
                      </button>
                      {repostMenuOpenId === post.id && (
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 as-surface rounded-xl border border-[var(--as-border)] shadow-2xl z-[100] overflow-hidden text-sm">
                          <button
                            onClick={() => handleRepostSubmit(post.id, "")}
                            className="w-full text-left px-4 py-3 as-text hover:bg-[rgba(255,255,255,0.06)] transition-colors flex items-center gap-3 font-medium"
                          >
                            <Repeat className="w-4 h-4" />
                            Repost
                          </button>
                          <button
                            onClick={() => {
                              setPostToRepost(post);
                              setRepostModalOpen(true);
                              setRepostMenuOpenId(null);
                            }}
                            className="w-full text-left px-4 py-3 as-text hover:bg-[rgba(255,255,255,0.06)] transition-colors flex items-center gap-3 font-medium"
                          >
                            <FileText className="w-4 h-4" />
                            Repost with thoughts
                          </button>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => handleSave(post.id)}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg transition-all font-medium text-[13px] hover:bg-[rgba(255,255,255,0.04)] ${isSaved ? 'as-accent' : 'as-text-muted hover:as-text'}`}
                    >
                      <Bookmark className="w-5 h-5" fill={isSaved ? 'currentColor' : 'none'} />
                      Save
                    </button>
                  </div>

                  {/* Comments Section */}
                  {isExpanded && (
                    <div className="border-t border-[var(--as-border)] mt-3 pt-3 pb-2">
                      <div className="px-4 space-y-3 max-h-64 overflow-y-auto">
                        {isLoadingComments ? (
                          <div className="flex items-center gap-2 as-text-muted text-sm py-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Loading comments...
                          </div>
                        ) : postComments.length === 0 ? (
                          <p className="text-sm as-text-muted py-2">No comments yet. Be the first!</p>
                        ) : (
                          postComments.map((c) => (
                            <div key={c.id} className="flex gap-2">
                              <div className="w-7 h-7 rounded-lg bg-[var(--as-border)] flex items-center justify-center text-xs font-bold as-accent shrink-0 overflow-hidden">
                                {c.author_avatar ? (
                                  <img src={c.author_avatar} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  c.author_name?.[0] ?? '?'
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm as-text leading-snug">
                                  <span className="font-semibold mr-1.5">{c.author_name}</span>
                                  <span className="break-words">{c.text}</span>
                                </p>
                                <span className="text-[10px] as-text-muted">
                                  {new Date(c.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                </span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                      {/* Comment input */}
                      <div className="flex items-center gap-2 px-4 pt-3">
                        <div className="w-7 h-7 rounded-lg bg-[var(--as-border)] flex items-center justify-center text-xs font-bold as-accent shrink-0">
                          {fallbackLetter}
                        </div>
                        <div className="flex-1 flex items-center gap-2 bg-[rgba(255,255,255,0.05)] rounded-full px-3 py-1.5 border border-[var(--as-border)] focus-within:border-[var(--as-accent)] transition-colors">
                          <input
                            type="text"
                            value={commentInput}
                            onChange={e => setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
                            onKeyDown={e => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleCommentSubmit(post.id);
                              }
                            }}
                            placeholder="Add a comment…"
                            className="flex-1 bg-transparent text-sm as-text placeholder:as-text-muted outline-none"
                          />
                          <button
                            onClick={() => handleCommentSubmit(post.id)}
                            disabled={!commentInput.trim() || isSubmitting}
                            className="as-accent font-semibold text-sm disabled:opacity-40 hover:opacity-70 transition-colors shrink-0"
                          >
                            {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Post'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Repost Modal */}
      {repostModalOpen && postToRepost && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="as-surface w-full max-w-lg rounded-2xl border border-[var(--as-border)] shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-4 border-b border-[var(--as-border)]">
              <h2 className="text-lg font-bold as-text">Repost</h2>
              <button onClick={() => setRepostModalOpen(false)} className="as-text-muted hover:as-text">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto">
              <div className="flex gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-[var(--as-border)] flex items-center justify-center text-sm font-bold as-accent overflow-hidden shrink-0">
                  {myProfile?.avatar ? <img src={myProfile.avatar} alt="" className="w-full h-full object-cover" /> : fallbackLetter}
                </div>
                <textarea
                  value={repostText}
                  onChange={e => setRepostText(e.target.value)}
                  placeholder="Share your thoughts..."
                  className="w-full bg-transparent resize-none outline-none text-sm as-text placeholder:as-text-muted pt-2 min-h-[80px]"
                  autoFocus
                />
              </div>
              {(() => {
                // If the target is itself a repost, the image/description live on the
                // embedded original, not on the wrapper — preview that source so it
                // matches what actually gets posted.
                const src = postToRepost.repost_of_detail ?? postToRepost;
                return (
                  <div className="border border-[var(--as-border)] rounded-xl p-4 bg-[rgba(255,255,255,0.02)]">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-md overflow-hidden bg-[var(--as-border)]">
                        {src.author_avatar ? (
                          <img src={src.author_avatar} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-white">{src.author_name[0]}</div>
                        )}
                      </div>
                      <span className="text-xs font-semibold as-text">{src.author_name}</span>
                    </div>
                    {src.description && <p className="text-xs as-text line-clamp-2">{src.description}</p>}
                    {src.attachments && src.attachments.length > 0 && (
                      <div className="mt-2 h-24 bg-[#201f20] rounded-lg overflow-hidden">
                        <img src={src.attachments[0].url} className="w-full h-full object-cover" alt="" />
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
            <div className="p-4 border-t border-[var(--as-border)] flex justify-end gap-3">
              <button onClick={() => setRepostModalOpen(false)} className="as-btn-outline text-sm">Cancel</button>
              <button onClick={() => handleRepostSubmit(postToRepost.id, repostText)} disabled={reposting} className="as-btn-primary text-sm flex items-center gap-2">
                {reposting && <Loader2 className="w-4 h-4 animate-spin" />} Repost
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast popup */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[2000] bg-[var(--as-text)] text-[var(--as-surface)] px-5 py-2.5 rounded-full shadow-2xl text-sm font-semibold animate-in fade-in slide-in-from-bottom-4 duration-300">
          {toast}
        </div>
      )}
    </div>
  );
}