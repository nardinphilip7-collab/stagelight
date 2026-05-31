'use client';

import Image from 'next/image';
import { useState } from 'react';
import type { Post, Artist } from '@/lib/artstage/types';
import { ContentVisibilityBadge } from '../shared/ContentVisibilityBadge';
import { Heart, MessageCircle, Bookmark, Pin } from 'lucide-react';
import { apiClient } from '@/lib/api';

interface PostCardProps {
  post: Post;
  artist: Artist;
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function PostCard({ post, artist }: PostCardProps) {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [likes, setLikes] = useState(post.stats.likes);
  const [saves, setSaves] = useState(post.stats.saves);

  const toggleLike = async () => {
    const next = !liked;
    setLiked(next);
    setLikes(n => n + (next ? 1 : -1));
    try {
      await apiClient.post(`/posts/${post.id}/like/`, {});
    } catch {
      setLiked(!next);
      setLikes(n => n + (next ? -1 : 1));
    }
  };

  const toggleSave = async () => {
    const next = !saved;
    setSaved(next);
    setSaves(n => n + (next ? 1 : -1));
    try {
      await apiClient.post(`/posts/${post.id}/save/`, {});
    } catch {
      setSaved(!next);
      setSaves(n => n + (next ? -1 : 1));
    }
  };

  return (
    <article
      className="as-surface p-5"
      aria-label={`Post by ${artist.stageName}`}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative w-10 h-10 rounded-full overflow-hidden shrink-0" style={{ border: '1px solid var(--as-border)' }}>
          <Image src={artist.avatar} alt={`${artist.stageName} avatar`} fill className="object-cover" sizes="40px" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[14px] font-medium" style={{ color: 'var(--as-text)' }}>{artist.stageName}</span>
            {post.pinned && (
              <span className="flex items-center gap-1 text-[11px]" style={{ color: 'var(--as-text-muted)' }}>
                <Pin size={11} aria-hidden="true" /> Pinned
              </span>
            )}
            <ContentVisibilityBadge visibility={post.visibility} />
          </div>
          <p className="text-[12px]" style={{ color: 'var(--as-text-muted)' }}>{fmtDate(post.createdAt)}</p>
        </div>
      </div>

      {/* Content */}
      <p className="text-[14px] leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--as-text)' }}>
        {post.content}
      </p>

      {/* Attachments */}
      {post.attachments && post.attachments.length > 0 && (
        <div className="mt-4 grid grid-cols-2 gap-2">
          {post.attachments.map((img, i) => (
            <div key={i} className="relative rounded-[6px] overflow-hidden" style={{ aspectRatio: '4/3' }}>
              <Image src={img.url} alt={img.alt} fill className="object-cover" sizes="200px" />
            </div>
          ))}
        </div>
      )}

      {/* Engagement */}
      <div
        className="mt-4 flex items-center gap-5 pt-4 border-t"
        style={{ borderColor: 'var(--as-border)' }}
      >
        <button
          onClick={toggleLike}
          className="flex items-center gap-1.5 text-[13px] hover:opacity-70 focus-visible:ring-2 rounded transition-colors"
          style={{ color: liked ? 'var(--as-accent)' : 'var(--as-text-muted)' }}
          aria-label={`${likes} likes`}
          aria-pressed={liked}
        >
          <Heart size={15} aria-hidden="true" fill={liked ? 'currentColor' : 'none'} />{likes}
        </button>
        <button
          className="flex items-center gap-1.5 text-[13px] hover:opacity-70 focus-visible:ring-2 rounded"
          style={{ color: 'var(--as-text-muted)' }}
          aria-label={`${post.stats.comments} comments`}
        >
          <MessageCircle size={15} aria-hidden="true" />{post.stats.comments}
        </button>
        <button
          onClick={toggleSave}
          className="flex items-center gap-1.5 text-[13px] hover:opacity-70 focus-visible:ring-2 rounded transition-colors"
          style={{ color: saved ? 'var(--as-accent)' : 'var(--as-text-muted)' }}
          aria-label="Save post"
          aria-pressed={saved}
        >
          <Bookmark size={15} aria-hidden="true" fill={saved ? 'currentColor' : 'none'} />{saves > 0 ? saves : 'Save'}
        </button>
      </div>
    </article>
  );
}
