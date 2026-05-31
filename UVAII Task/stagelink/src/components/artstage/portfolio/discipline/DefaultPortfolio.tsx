import type { Artist } from '@/lib/artstage/types';
import { CreditCard } from '../CreditCard';
import { UnionAffiliationCard } from '../UnionAffiliationCard';

interface DefaultPortfolioProps { artist: Artist }

export function DefaultPortfolio({ artist }: DefaultPortfolioProps) {
  return (
    <div className="space-y-10">
      {artist.credits.length > 0 && (
        <section aria-labelledby="default-credits-heading">
          <h2 id="default-credits-heading" className="text-[16px] font-semibold mb-4" style={{ color: 'var(--as-text)' }}>Credits</h2>
          <div className="space-y-2">
            {artist.credits.sort((a, b) => b.year - a.year).map(c => <CreditCard key={c.id} credit={c} />)}
          </div>
        </section>
      )}
      {artist.unionAffiliations.length > 0 && (
        <section aria-labelledby="default-union-heading">
          <h2 id="default-union-heading" className="text-[16px] font-semibold mb-4" style={{ color: 'var(--as-text)' }}>Union affiliations</h2>
          <div className="space-y-2">{artist.unionAffiliations.map(u => <UnionAffiliationCard key={u.id} affiliation={u} />)}</div>
        </section>
      )}
    </div>
  );
}
