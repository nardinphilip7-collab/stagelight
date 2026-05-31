'use client';
import type { Artist, AvailabilityWindow } from '@/lib/artstage/types';

interface AvailabilityTabProps { artist: Artist; availability: AvailabilityWindow[]; }

const STATE_LABELS: Record<string, string> = {
  available: '✅ Available',
  tentative: '⚠️ Tentative',
  unavailable: '❌ Unavailable',
  booked: '📅 Booked',
};

export function AvailabilityTab({ artist, availability }: AvailabilityTabProps) {
  return (
    <div className="px-4 py-6">
      {availability.length === 0 ? (
        <p className="text-[var(--as-text-muted)] text-sm text-center py-8">{artist.stageName} hasn&apos;t set availability yet.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {availability.map((w) => (
            <div key={w.id} className="p-3 rounded-xl border border-[var(--as-border)] bg-[var(--as-surface)]">
              <div className="flex items-center justify-between">
                <p className="text-[var(--as-text)] text-sm font-semibold">{STATE_LABELS[w.state] ?? w.state}</p>
                {w.willingToTravel && <span className="text-xs text-[var(--as-text-muted)]">🌍 Will travel</span>}
              </div>
              <p className="text-[var(--as-text-muted)] text-xs mt-1">{w.startDate} → {w.endDate}</p>
              {w.note && <p className="text-[var(--as-text-muted)] text-xs mt-1 italic">{w.note}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
