'use client';
import Image from 'next/image';
import { useState } from 'react';
import type { Reel } from '@/lib/artstage/types';
import { ContentVisibilityBadge } from '../shared/ContentVisibilityBadge';
import { CaptionedVideo } from '../shared/CaptionedVideo';
import { REEL_TYPE_LABELS } from '@/lib/artstage/disciplines';
import { Play } from 'lucide-react';

interface ReelCardProps {
  reel: Reel;
  onClick?: (reel: Reel) => void;
}

function fmtDuration(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, '0')}`;
}

function fmtCount(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k` : String(n);
}

export function ReelCard({ reel, onClick }: ReelCardProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <article
      className="as-reel-card cursor-pointer rounded-[8px] overflow-hidden border focus-visible:ring-2 focus-visible:ring-offset-2"
      style={{ borderColor: 'var(--as-border)', backgroundColor: 'var(--as-surface)' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onClick?.(reel)}
      tabIndex={0}
      role="button"
      onKeyDown={e => e.key === 'Enter' && onClick?.(reel)}
      aria-label={`Play reel: ${reel.title}`}
    >
      {/* Thumbnail */}
      <div className="relative" style={{ aspectRatio: '16/9' }}>
        {hovered ? (
          <CaptionedVideo
            src={reel.videoUrl}
            poster={reel.thumbnailUrl}
            hasCaptions={reel.hasCaptions}
            className="w-full h-full"
            autoPlay
          />
        ) : (
          <>
            <Image
              src={reel.thumbnailUrl}
              alt={`Thumbnail for ${reel.title}`}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 50vw, 33vw"
            />
            <div className="as-reel-overlay absolute inset-0 flex items-center justify-center">
              <div className="bg-white/20 rounded-full p-3">
                <Play size={20} className="text-white fill-white" aria-hidden="true" />
              </div>
            </div>
          </>
        )}

        {/* Overlay badges */}
        <div className="absolute top-2 left-2 flex gap-1 flex-wrap pointer-events-none">
          <ContentVisibilityBadge visibility={reel.visibility} expiresAt={reel.scoutExpiresAt} />
        </div>
        <div className="absolute bottom-2 right-2 pointer-events-none">
          <span className="text-[11px] bg-black/60 text-white px-1.5 py-0.5 rounded">
            {fmtDuration(reel.duration)}
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="p-3">
        <p className="text-[13px] font-medium leading-snug line-clamp-2" style={{ color: 'var(--as-text)' }}>
          {reel.title}
        </p>
        <div className="mt-1.5 flex items-center justify-between">
          <span
            className="text-[11px] px-2 py-0.5 rounded-full border"
            style={{ color: 'var(--as-text-muted)', borderColor: 'var(--as-border)' }}
          >
            {REEL_TYPE_LABELS[reel.type] ?? reel.type}
          </span>
          <span className="text-[12px]" style={{ color: 'var(--as-text-muted)' }}>
            {fmtCount(reel.stats.plays)} plays
          </span>
        </div>
      </div>
    </article>
  );
}
