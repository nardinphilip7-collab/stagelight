'use client';
import type { Artist } from '@/lib/artstage/types';

interface PortfolioTabProps { artist: Artist; }

export function PortfolioTab({ artist }: PortfolioTabProps) {
  return (
    <div className="px-4 py-6">
      {artist.credits && artist.credits.length > 0 ? (
        <div className="flex flex-col gap-3">
          {artist.credits.map((c) => (
            <div key={c.id} className="p-3 rounded-xl border border-[var(--as-border)] bg-[var(--as-surface)]">
              <p className="text-[var(--as-text)] font-semibold text-sm">{c.title}</p>
              <p className="text-[var(--as-text-muted)] text-xs">{c.role} · {c.year} · {c.productionType}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-[var(--as-text-muted)] text-sm text-center py-8">No portfolio items yet.</p>
      )}
    </div>
  );
}
