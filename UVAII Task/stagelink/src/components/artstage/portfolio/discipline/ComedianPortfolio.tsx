import type { Artist } from '@/lib/artstage/types';
import { CreditCard } from '../CreditCard';

interface ComedianPortfolioProps { artist: Artist }

export function ComedianPortfolio({ artist }: ComedianPortfolioProps) {
  const festivalCredits = artist.credits.filter(c => c.productionType === 'Festival' || c.productionType === 'Competition');
  const specialCredits = artist.credits.filter(c => c.productionType === 'Special' || c.productionType === 'TV');
  const other = artist.credits.filter(c => !festivalCredits.includes(c) && !specialCredits.includes(c));

  return (
    <div className="space-y-10">
      <section aria-labelledby="specialties-heading">
        <h2 id="specialties-heading" className="text-[16px] font-semibold mb-3" style={{ color: 'var(--as-text)' }}>Specialties</h2>
        <div className="as-surface p-5">
          <div className="flex flex-wrap gap-2">
            {['Standup', 'Sketch', 'Improv', 'Alt comedy'].map(s => (
              <span key={s} className="as-pill">{s}</span>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <p className="text-[11px] uppercase tracking-wider" style={{ color: 'var(--as-text-muted)' }}>Set lengths</p>
              <p className="text-[14px] font-medium mt-1" style={{ color: 'var(--as-text)' }}>5 · 8 · 20 · 45 min</p>
            </div>
          </div>
        </div>
      </section>

      {festivalCredits.length > 0 && (
        <section aria-labelledby="festival-heading">
          <h2 id="festival-heading" className="text-[16px] font-semibold mb-4" style={{ color: 'var(--as-text)' }}>Festival &amp; Competition</h2>
          <div className="space-y-2">{festivalCredits.sort((a, b) => b.year - a.year).map(c => <CreditCard key={c.id} credit={c} />)}</div>
        </section>
      )}

      {specialCredits.length > 0 && (
        <section aria-labelledby="specials-heading">
          <h2 id="specials-heading" className="text-[16px] font-semibold mb-4" style={{ color: 'var(--as-text)' }}>Specials &amp; TV</h2>
          <div className="space-y-2">{specialCredits.sort((a, b) => b.year - a.year).map(c => <CreditCard key={c.id} credit={c} />)}</div>
        </section>
      )}

      {other.length > 0 && (
        <section aria-labelledby="other-comedy-heading">
          <h2 id="other-comedy-heading" className="text-[16px] font-semibold mb-4" style={{ color: 'var(--as-text)' }}>Other</h2>
          <div className="space-y-2">{other.sort((a, b) => b.year - a.year).map(c => <CreditCard key={c.id} credit={c} />)}</div>
        </section>
      )}
    </div>
  );
}
