import type { UnionAffiliation } from '@/lib/artstage/types';
import { VerifiedBadge } from '../profile/VerifiedBadge';

interface UnionAffiliationCardProps {
  affiliation: UnionAffiliation;
}

const STATUS_LABELS: Record<string, string> = {
  active: 'Active member',
  inactive: 'Inactive',
  financial_core: 'Fi-Core',
  eligible: 'Eligible',
};

export function UnionAffiliationCard({ affiliation }: UnionAffiliationCardProps) {
  return (
    <div
      className="flex items-center justify-between gap-3 px-4 py-3 rounded-lg border"
      style={{ borderColor: 'var(--as-border)', backgroundColor: 'var(--as-surface)' }}
    >
      <div className="flex items-center gap-2">
        <span className="text-[14px] font-semibold" style={{ color: 'var(--as-text)' }}>
          {affiliation.union}
        </span>
        {affiliation.verification === 'verified' && <VerifiedBadge size="sm" label={`${affiliation.union} membership verified`} />}
      </div>
      <div className="flex items-center gap-3">
        <span className="text-[12px]" style={{ color: 'var(--as-text-muted)' }}>
          Since {affiliation.joinedYear}
        </span>
        <span
          className="text-[11px] px-2 py-0.5 rounded-full border"
          style={{
            color: affiliation.status === 'active' ? 'var(--as-verified)' : 'var(--as-text-muted)',
            borderColor: affiliation.status === 'active' ? 'color-mix(in srgb, var(--as-verified) 30%, transparent)' : 'var(--as-border)',
            backgroundColor: affiliation.status === 'active' ? 'color-mix(in srgb, var(--as-verified) 8%, transparent)' : 'transparent',
          }}
        >
          {STATUS_LABELS[affiliation.status]}
        </span>
      </div>
    </div>
  );
}
