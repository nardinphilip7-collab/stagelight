import type { Artist, Credit } from '@/lib/artstage/types';
import { CreditCard } from '../CreditCard';
import { UnionAffiliationCard } from '../UnionAffiliationCard';
import { EmptyState } from '../../shared/EmptyState';

interface ActorPortfolioProps { artist: Artist }

const PRODUCTION_GROUPS = ['Film', 'TV', 'Theater', 'Commercial'];

function groupCredits(credits: Credit[]) {
  const groups: Record<string, Credit[]> = {};
  for (const c of credits) {
    const key = PRODUCTION_GROUPS.includes(c.productionType) ? c.productionType : 'Other';
    (groups[key] = groups[key] ?? []).push(c);
  }
  return groups;
}

export function ActorPortfolio({ artist }: ActorPortfolioProps) {
  const groups = groupCredits(artist.credits);
  const orderedKeys = [...PRODUCTION_GROUPS, 'Other'].filter(k => groups[k]?.length);

  return (
    <div className="space-y-10">
      {/* Credits */}
      <section aria-labelledby="credits-heading">
        <h2 id="credits-heading" className="text-[16px] font-semibold mb-4" style={{ color: 'var(--as-text)' }}>
          Credits
        </h2>
        {orderedKeys.length === 0 ? (
          <EmptyState title="No credits yet" message="Credits will appear here once added." />
        ) : (
          <div className="space-y-6">
            {orderedKeys.map(key => (
              <section key={key} aria-labelledby={`credits-${key}`}>
                <h3 id={`credits-${key}`} className="text-[12px] font-medium uppercase tracking-wider mb-3" style={{ color: 'var(--as-text-muted)' }}>
                  {key}
                </h3>
                <div className="space-y-2">
                  {groups[key].sort((a, b) => b.year - a.year).map(c => (
                    <CreditCard key={c.id} credit={c} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </section>

      {/* Union affiliations */}
      {artist.unionAffiliations.length > 0 && (
        <section aria-labelledby="union-heading">
          <h2 id="union-heading" className="text-[16px] font-semibold mb-4" style={{ color: 'var(--as-text)' }}>
            Union affiliations
          </h2>
          <div className="space-y-2">
            {artist.unionAffiliations.map(u => (
              <UnionAffiliationCard key={u.id} affiliation={u} />
            ))}
          </div>
        </section>
      )}

      {/* Representation */}
      {artist.representation && (
        <section aria-labelledby="rep-heading">
          <h2 id="rep-heading" className="text-[16px] font-semibold mb-3" style={{ color: 'var(--as-text)' }}>
            Representation
          </h2>
          <div className="as-surface p-4 as-self-asserted-bar">
            <p className="text-[14px] font-medium" style={{ color: 'var(--as-text)' }}>{artist.representation.agency}</p>
            <p className="text-[13px] mt-0.5" style={{ color: 'var(--as-text-secondary)' }}>
              {artist.representation.agent} · {artist.representation.type}
            </p>
          </div>
        </section>
      )}
    </div>
  );
}
