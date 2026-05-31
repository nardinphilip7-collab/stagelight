import type { Training } from '@/lib/artstage/types';
import { VerifiedBadge } from '../profile/VerifiedBadge';

interface TrainingCardProps {
  training: Training;
}

export function TrainingCard({ training }: TrainingCardProps) {
  const years = training.endYear
    ? `${training.startYear}–${training.endYear}`
    : `${training.startYear}–present`;

  return (
    <article className="as-surface p-4 flex items-start justify-between gap-3 as-self-asserted-bar">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-semibold" style={{ color: 'var(--as-text)' }}>
            {training.institution}
          </span>
          {training.verification === 'verified' && <VerifiedBadge size="sm" />}
        </div>
        <p className="text-[13px] mt-0.5" style={{ color: 'var(--as-text-secondary)' }}>
          {training.program}
          {training.degree && ` · ${training.degree}`}
        </p>
      </div>
      <span className="shrink-0 text-[12px]" style={{ color: 'var(--as-text-muted)' }}>{years}</span>
    </article>
  );
}
