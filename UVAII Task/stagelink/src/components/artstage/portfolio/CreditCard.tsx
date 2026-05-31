import type { Credit } from '@/lib/artstage/types';
import { VerifiedBadge } from '../profile/VerifiedBadge';
import { Clock } from 'lucide-react';

interface CreditCardProps {
  credit: Credit;
}

const VERIFICATION_BAR: Record<string, string> = {
  verified: 'as-verified-bar',
  pending: 'as-pending-bar',
  self_asserted: 'as-self-asserted-bar',
};

export function CreditCard({ credit }: CreditCardProps) {
  return (
    <article
      className={`as-surface p-4 flex flex-col gap-1 ${VERIFICATION_BAR[credit.verification]}`}
      aria-label={`${credit.role} in ${credit.title}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[13px] font-semibold truncate" style={{ color: 'var(--as-text)' }}>
              {credit.title}
            </span>
            {credit.verification === 'verified' && (
              <VerifiedBadge size="sm" verifiedBy={credit.verifiedBy} />
            )}
          </div>
          <p className="text-[13px] mt-0.5" style={{ color: 'var(--as-text-secondary)' }}>
            {credit.role}
            {credit.billing && ` · ${credit.billing}`}
          </p>
        </div>
        <div className="shrink-0 flex flex-col items-end gap-1">
          <span
            className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border"
            style={{ color: 'var(--as-text-muted)', borderColor: 'var(--as-border)' }}
          >
            {credit.productionType}
          </span>
          <span className="text-[12px] flex items-center gap-1" style={{ color: 'var(--as-text-muted)' }}>
            <Clock size={11} aria-hidden="true" />{credit.year}
          </span>
        </div>
      </div>
      {(credit.director || credit.producingEntity) && (
        <p className="text-[12px]" style={{ color: 'var(--as-text-muted)' }}>
          {[credit.director && `Dir. ${credit.director}`, credit.producingEntity].filter(Boolean).join(' · ')}
        </p>
      )}
      {credit.verification === 'pending' && (
        <p className="text-[11px] mt-0.5" style={{ color: '#C8A882' }}>Verification pending</p>
      )}
    </article>
  );
}
