import type { Artist } from '@/lib/artstage/types';
import { CreditCard } from '../CreditCard';
import { UnionAffiliationCard } from '../UnionAffiliationCard';

interface MusicianPortfolioProps { artist: Artist }

export function MusicianPortfolio({ artist }: MusicianPortfolioProps) {
  const studioCredits = artist.credits.filter(c => ['Album', 'EP', 'Film', 'TV'].includes(c.productionType));
  const liveCredits = artist.credits.filter(c => ['Live/Tour', 'Concert'].includes(c.productionType));
  const other = artist.credits.filter(c => !studioCredits.includes(c) && !liveCredits.includes(c));

  return (
    <div className="space-y-10">
      <section aria-labelledby="instruments-heading">
        <h2 id="instruments-heading" className="text-[16px] font-semibold mb-3" style={{ color: 'var(--as-text)' }}>Instruments</h2>
        <div className="as-surface p-5 as-verified-bar">
          <div className="flex flex-wrap gap-2">
            {['Guitar (Lead/Rhythm)', 'Piano / Keys', 'Bass Guitar', 'Acoustic Guitar'].map(i => (
              <span key={i} className="as-pill">{i}</span>
            ))}
          </div>
        </div>
      </section>

      {studioCredits.length > 0 && (
        <section aria-labelledby="studio-heading">
          <h2 id="studio-heading" className="text-[16px] font-semibold mb-4" style={{ color: 'var(--as-text)' }}>Studio Credits</h2>
          <div className="space-y-2">{studioCredits.sort((a, b) => b.year - a.year).map(c => <CreditCard key={c.id} credit={c} />)}</div>
        </section>
      )}

      {liveCredits.length > 0 && (
        <section aria-labelledby="live-musician-heading">
          <h2 id="live-musician-heading" className="text-[16px] font-semibold mb-4" style={{ color: 'var(--as-text)' }}>Live &amp; Touring</h2>
          <div className="space-y-2">{liveCredits.sort((a, b) => b.year - a.year).map(c => <CreditCard key={c.id} credit={c} />)}</div>
        </section>
      )}

      {other.length > 0 && (
        <section aria-labelledby="other-musician-heading">
          <h2 id="other-musician-heading" className="text-[16px] font-semibold mb-4" style={{ color: 'var(--as-text)' }}>Other</h2>
          <div className="space-y-2">{other.sort((a, b) => b.year - a.year).map(c => <CreditCard key={c.id} credit={c} />)}</div>
        </section>
      )}

      {artist.unionAffiliations.length > 0 && (
        <section aria-labelledby="musician-union-heading">
          <h2 id="musician-union-heading" className="text-[16px] font-semibold mb-4" style={{ color: 'var(--as-text)' }}>Union affiliations</h2>
          <div className="space-y-2">{artist.unionAffiliations.map(u => <UnionAffiliationCard key={u.id} affiliation={u} />)}</div>
        </section>
      )}
    </div>
  );
}
