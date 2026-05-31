'use client';
import { useState } from 'react';
import type { Reel } from '@/lib/artstage/types';
import type { Discipline } from '@/lib/artstage/types';
import { ReelCard } from './ReelCard';
import { ReelPlayer } from './ReelPlayer';
import { EmptyState } from '../shared/EmptyState';
import { getDisciplineReelTypes } from '@/lib/artstage/disciplines';
import { REEL_TYPE_LABELS } from '@/lib/artstage/disciplines';

interface ReelGridProps {
  reels: Reel[];
  discipline: Discipline;
}

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'plays', label: 'Most viewed' },
  { value: 'likes', label: 'Most liked' },
];

export function ReelGrid({ reels, discipline }: ReelGridProps) {
  const [activeType, setActiveType] = useState<string>('all');
  const [sort, setSort] = useState('newest');
  const [activeReel, setActiveReel] = useState<Reel | null>(null);

  const types = ['all', ...getDisciplineReelTypes(discipline)];

  const filtered = reels.filter(r => activeType === 'all' || r.type === activeType);
  const sorted = [...filtered].sort((a, b) => {
    if (sort === 'plays') return b.stats.plays - a.stats.plays;
    if (sort === 'likes') return b.stats.likes - a.stats.likes;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div>
      {/* Filter + sort bar */}
      <div
        className="flex flex-wrap items-center justify-between gap-3 px-4 md:px-8 py-3 border-b"
        style={{ borderColor: 'var(--as-border)' }}
      >
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by type">
          {types.map(t => (
            <button
              key={t}
              onClick={() => setActiveType(t)}
              className={`text-[12px] px-3 py-1 rounded-full border transition-colors focus-visible:ring-2 ${
                activeType === t
                  ? 'border-transparent text-white'
                  : ''
              }`}
              style={activeType === t
                ? { backgroundColor: 'var(--as-accent)', borderColor: 'var(--as-accent)' }
                : { borderColor: 'var(--as-border)', color: 'var(--as-text-secondary)' }
              }
              aria-pressed={activeType === t}
            >
              {t === 'all' ? 'All' : (REEL_TYPE_LABELS[t] ?? t)}
            </button>
          ))}
        </div>
        <select
          value={sort}
          onChange={e => setSort(e.target.value)}
          className="text-[13px] rounded-[6px] border px-2 py-1 focus-visible:ring-2"
          style={{ borderColor: 'var(--as-border)', color: 'var(--as-text)', backgroundColor: 'var(--as-surface)' }}
          aria-label="Sort reels"
        >
          {SORT_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Grid */}
      <div className="px-4 md:px-8 py-6">
        {sorted.length === 0 ? (
          <EmptyState title="No reels" message="No reels match the selected filter." />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {sorted.map(r => (
              <ReelCard key={r.id} reel={r} onClick={setActiveReel} />
            ))}
          </div>
        )}
      </div>

      {/* Full-screen player */}
      {activeReel && (
        <ReelPlayer reel={activeReel} onClose={() => setActiveReel(null)} />
      )}
    </div>
  );
}
