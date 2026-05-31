import type { Artist, Credit } from '@/lib/artstage/types';
import { CreditCard } from '../CreditCard';
import { UnionAffiliationCard } from '../UnionAffiliationCard';

interface SingerPortfolioProps { artist: Artist }

export function SingerPortfolio({ artist }: SingerPortfolioProps) {
  const albumCredits = artist.credits.filter(c => ['Album', 'EP', 'Single'].includes(c.productionType));
  const liveCredits = artist.credits.filter(c => ['Concert', 'Live/Tour', 'Theater', 'Musical Theatre'].includes(c.productionType));
  const otherCredits = artist.credits.filter(c => !albumCredits.includes(c) && !liveCredits.includes(c));

  return (
    <div className="space-y-10">
      {/* Vocal type card */}
      <section aria-labelledby="vocal-heading">
        <h2 id="vocal-heading" className="text-[16px] font-semibold mb-3" style={{ color: 'var(--as-text)' }}>Vocal Profile</h2>
        <div className="as-surface p-5 as-verified-bar">
          <dl className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <dt className="text-[11px] uppercase tracking-wider" style={{ color: 'var(--as-text-muted)' }}>Voice type</dt>
              <dd className="text-[14px] font-medium mt-1" style={{ color: 'var(--as-text)' }}>Mezzo-baritone</dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-wider" style={{ color: 'var(--as-text-muted)' }}>Primary style</dt>
              <dd className="text-[14px] font-medium mt-1" style={{ color: 'var(--as-text)' }}>Jazz · Musical Theatre</dd>
            </div>
          </dl>
        </div>
      </section>

      {albumCredits.length > 0 && (
        <section aria-labelledby="albums-heading">
          <h2 id="albums-heading" className="text-[16px] font-semibold mb-4" style={{ color: 'var(--as-text)' }}>Albums &amp; Recordings</h2>
          <div className="space-y-2">{albumCredits.sort((a, b) => b.year - a.year).map(c => <CreditCard key={c.id} credit={c} />)}</div>
        </section>
      )}

      {liveCredits.length > 0 && (
        <section aria-labelledby="live-heading">
          <h2 id="live-heading" className="text-[16px] font-semibold mb-4" style={{ color: 'var(--as-text)' }}>Stage &amp; Live Performance</h2>
          <div className="space-y-2">{liveCredits.sort((a, b) => b.year - a.year).map(c => <CreditCard key={c.id} credit={c} />)}</div>
        </section>
      )}

      {otherCredits.length > 0 && (
        <section aria-labelledby="other-credits-heading">
          <h2 id="other-credits-heading" className="text-[16px] font-semibold mb-4" style={{ color: 'var(--as-text)' }}>Other Credits</h2>
          <div className="space-y-2">{otherCredits.sort((a, b) => b.year - a.year).map(c => <CreditCard key={c.id} credit={c} />)}</div>
        </section>
      )}

      {artist.unionAffiliations.length > 0 && (
        <section aria-labelledby="singer-union-heading">
          <h2 id="singer-union-heading" className="text-[16px] font-semibold mb-4" style={{ color: 'var(--as-text)' }}>Union affiliations</h2>
          <div className="space-y-2">{artist.unionAffiliations.map(u => <UnionAffiliationCard key={u.id} affiliation={u} />)}</div>
        </section>
      )}
    </div>
  );
}
