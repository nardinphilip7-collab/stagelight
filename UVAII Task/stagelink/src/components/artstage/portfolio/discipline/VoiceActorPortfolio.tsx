import type { Artist, Reel } from '@/lib/artstage/types';
import { CreditCard } from '../CreditCard';
import { UnionAffiliationCard } from '../UnionAffiliationCard';

interface VoiceActorPortfolioProps {
  artist: Artist;
  reels?: Reel[];
}

const DEMO_CATEGORIES = ['Commercial', 'Animation', 'Video Game', 'Narration', 'Audiobook'];

export function VoiceActorPortfolio({ artist, reels = [] }: VoiceActorPortfolioProps) {
  const demosByCategory = DEMO_CATEGORIES.reduce<Record<string, Reel[]>>((acc, cat) => {
    const demos = reels.filter(r => r.type === 'voice_demo' && (r.metadata as { kind: string; category: string }).category === cat);
    if (demos.length) acc[cat] = demos;
    return acc;
  }, {});

  const creditsByType = DEMO_CATEGORIES.reduce<Record<string, typeof artist.credits>>((acc, cat) => {
    const group = artist.credits.filter(c => c.productionType === cat || (cat === 'Video Game' && c.productionType === 'Video Game'));
    if (group.length) acc[cat] = group;
    return acc;
  }, {});

  return (
    <div className="space-y-10">
      {/* Demo reels by category */}
      <section aria-labelledby="demos-heading">
        <h2 id="demos-heading" className="text-[16px] font-semibold mb-4" style={{ color: 'var(--as-text)' }}>Demo Reels</h2>
        <div className="space-y-6">
          {Object.entries(demosByCategory).map(([cat, demos]) => (
            <div key={cat}>
              <h3 className="text-[12px] font-medium uppercase tracking-wider mb-2" style={{ color: 'var(--as-text-muted)' }}>{cat}</h3>
              <div className="space-y-2">
                {demos.map(d => (
                  <div key={d.id} className="as-surface p-3 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium truncate" style={{ color: 'var(--as-text)' }}>{d.title}</p>
                      <p className="text-[12px]" style={{ color: 'var(--as-text-muted)' }}>{Math.floor(d.duration / 60)}:{String(d.duration % 60).padStart(2, '0')}</p>
                    </div>
                    <span className="text-[11px] px-2 py-0.5 rounded-full border" style={{ color: 'var(--as-text-muted)', borderColor: 'var(--as-border)' }}>
                      {cat}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Voice characteristics */}
      <section aria-labelledby="voice-char-heading">
        <h2 id="voice-char-heading" className="text-[16px] font-semibold mb-3" style={{ color: 'var(--as-text)' }}>Voice Characteristics</h2>
        <div className="as-surface p-5">
          <div className="flex flex-wrap gap-2">
            {['Neutral American', 'British RP', 'Mid-Atlantic', 'Character voices', 'Multiple ages'].map(v => (
              <span key={v} className="as-pill">{v}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Credits */}
      <section aria-labelledby="voice-credits-heading">
        <h2 id="voice-credits-heading" className="text-[16px] font-semibold mb-4" style={{ color: 'var(--as-text)' }}>Credits</h2>
        <div className="space-y-2">
          {artist.credits.sort((a, b) => b.year - a.year).map(c => <CreditCard key={c.id} credit={c} />)}
        </div>
      </section>

      {artist.unionAffiliations.length > 0 && (
        <section aria-labelledby="voice-union-heading">
          <h2 id="voice-union-heading" className="text-[16px] font-semibold mb-4" style={{ color: 'var(--as-text)' }}>Union affiliations</h2>
          <div className="space-y-2">{artist.unionAffiliations.map(u => <UnionAffiliationCard key={u.id} affiliation={u} />)}</div>
        </section>
      )}
    </div>
  );
}
