import type { Artist } from '@/lib/artstage/types';
import { CreditCard } from '../CreditCard';
import { UnionAffiliationCard } from '../UnionAffiliationCard';

interface DancerPortfolioProps { artist: Artist }

export function DancerPortfolio({ artist }: DancerPortfolioProps) {
  const companyCredits = artist.credits.filter(c => c.producingEntity);
  const soloCredits = artist.credits.filter(c => c.billing === 'Lead' || c.billing === 'Soloist');

  return (
    <div className="space-y-10">
      {/* Style proficiencies */}
      <section aria-labelledby="styles-heading">
        <h2 id="styles-heading" className="text-[16px] font-semibold mb-3" style={{ color: 'var(--as-text)' }}>Movement Styles</h2>
        <div className="as-surface p-5 as-verified-bar">
          <div className="flex flex-wrap gap-2">
            {['Contemporary', 'Classical Ballet', 'Modern', 'Improvisation'].map(style => (
              <span key={style} className="as-pill">{style}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Company affiliations */}
      {artist.representation === undefined && artist.unionAffiliations.length > 0 && (
        <section aria-labelledby="company-heading">
          <h2 id="company-heading" className="text-[16px] font-semibold mb-3" style={{ color: 'var(--as-text)' }}>Company &amp; Affiliations</h2>
          <div className="space-y-2">{artist.unionAffiliations.map(u => <UnionAffiliationCard key={u.id} affiliation={u} />)}</div>
        </section>
      )}

      {/* Credits */}
      <section aria-labelledby="dance-credits-heading">
        <h2 id="dance-credits-heading" className="text-[16px] font-semibold mb-4" style={{ color: 'var(--as-text)' }}>Performance Credits</h2>
        <div className="space-y-2">
          {artist.credits.sort((a, b) => b.year - a.year).map(c => <CreditCard key={c.id} credit={c} />)}
        </div>
      </section>
    </div>
  );
}
