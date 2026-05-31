import type { Discipline } from '@/lib/artstage/types';
import { DISCIPLINE_LABELS } from '@/lib/artstage/disciplines';

interface DisciplineBadgeProps {
  discipline: Discipline;
  secondary?: Discipline[];
}

export function DisciplineBadge({ discipline, secondary = [] }: DisciplineBadgeProps) {
  return (
    <div className="flex flex-wrap gap-1.5 items-center">
      <span
        className="as-display inline-flex items-center px-3 py-0.5 text-[12px] font-medium rounded-full border"
        style={{
          color: 'var(--as-accent)',
          borderColor: 'color-mix(in srgb, var(--as-accent) 30%, transparent)',
          background: 'color-mix(in srgb, var(--as-accent) 6%, transparent)',
          fontStyle: 'italic',
        }}
      >
        {DISCIPLINE_LABELS[discipline]}
      </span>
      {secondary.map(d => (
        <span
          key={d}
          className="inline-flex items-center px-2.5 py-0.5 text-[11px] rounded-full border"
          style={{ color: 'var(--as-text-secondary)', borderColor: 'var(--as-border)' }}
        >
          {DISCIPLINE_LABELS[d]}
        </span>
      ))}
    </div>
  );
}
