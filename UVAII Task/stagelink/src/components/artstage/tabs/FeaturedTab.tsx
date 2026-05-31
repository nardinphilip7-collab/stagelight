'use client';
import type { Artist, Reel, Post, LiveStream } from '@/lib/artstage/types';

interface FeaturedTabProps {
  artist: Artist;
  reels: Reel[];
  posts: Post[];
  liveStream?: LiveStream;
}

export function FeaturedTab({ artist, reels, posts, liveStream }: FeaturedTabProps) {
  return (
    <div className="px-4 py-6">
      {liveStream?.isLive && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm font-semibold flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          Live now: {liveStream.title}
        </div>
      )}
      {reels.length === 0 && posts.length === 0 && (
        <p className="text-[var(--as-text-muted)] text-sm text-center py-8">{artist.stageName} hasn&apos;t added featured content yet.</p>
      )}
      {reels.slice(0, 3).map((r) => (
        <div key={r.id} className="mb-3 p-3 rounded-xl border border-[var(--as-border)] bg-[var(--as-surface)]">
          <p className="text-[var(--as-text)] text-sm font-medium">{r.title}</p>
          <p className="text-[var(--as-text-muted)] text-xs">{r.type} · {r.duration}s</p>
        </div>
      ))}
    </div>
  );
}
