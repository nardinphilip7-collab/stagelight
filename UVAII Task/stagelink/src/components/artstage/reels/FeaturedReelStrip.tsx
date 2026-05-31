'use client';
import { useState } from 'react';
import type { Reel } from '@/lib/artstage/types';
import { ReelCard } from './ReelCard';
import { ReelPlayer } from './ReelPlayer';

interface FeaturedReelStripProps {
  reels: Reel[];
}

export function FeaturedReelStrip({ reels }: FeaturedReelStripProps) {
  const [activeReel, setActiveReel] = useState<Reel | null>(null);
  const featured = reels.filter(r => r.featured).slice(0, 5);

  if (featured.length === 0) return null;

  return (
    <section aria-labelledby="featured-reels-heading">
      <h2 id="featured-reels-heading" className="text-[15px] font-semibold mb-3" style={{ color: 'var(--as-text)' }}>
        Featured Reels
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
        {featured.map(r => (
          <ReelCard key={r.id} reel={r} onClick={setActiveReel} />
        ))}
      </div>
      {activeReel && <ReelPlayer reel={activeReel} onClose={() => setActiveReel(null)} />}
    </section>
  );
}
