import type { Reel, ReelMetadata } from '@/lib/artstage/types';
import { ContentVisibilityBadge } from '../shared/ContentVisibilityBadge';
import { REEL_TYPE_LABELS } from '@/lib/artstage/disciplines';
import { Eye, Heart, Bookmark } from 'lucide-react';

interface ReelMetadataPanelProps { reel: Reel }

function renderMetadata(meta: ReelMetadata) {
  const items: { label: string; value: string }[] = [];
  switch (meta.kind) {
    case 'actor':
      if (meta.accent) items.push({ label: 'Accent', value: meta.accent });
      items.push({ label: 'Language', value: meta.language });
      if (meta.sourceMaterial) items.push({ label: 'Source', value: meta.sourceMaterial });
      break;
    case 'singer':
      items.push({ label: 'Song', value: meta.songTitle });
      if (meta.key) items.push({ label: 'Key', value: meta.key });
      items.push({ label: 'Genre', value: meta.genre });
      break;
    case 'dancer':
      items.push({ label: 'Style', value: meta.style });
      if (meta.choreographer) items.push({ label: 'Choreographer', value: meta.choreographer });
      break;
    case 'musician':
      items.push({ label: 'Instrument', value: meta.instrument });
      items.push({ label: 'Genre', value: meta.genre });
      break;
    case 'voice_actor':
      items.push({ label: 'Category', value: meta.category });
      break;
    case 'comedian':
      items.push({ label: 'Format', value: meta.format });
      break;
  }
  return items;
}

export function ReelMetadataPanel({ reel }: ReelMetadataPanelProps) {
  const metaItems = renderMetadata(reel.metadata);
  const dur = `${Math.floor(reel.duration / 60)}:${String(reel.duration % 60).padStart(2, '0')}`;

  return (
    <div className="space-y-4">
      <h2 className="text-[15px] font-semibold leading-snug" style={{ color: 'var(--as-text)' }}>{reel.title}</h2>

      <div className="flex flex-wrap gap-2">
        <span className="text-[11px] px-2.5 py-0.5 rounded-full border" style={{ color: 'var(--as-text-muted)', borderColor: 'var(--as-border)' }}>
          {REEL_TYPE_LABELS[reel.type] ?? reel.type}
        </span>
        <span className="text-[11px] px-2.5 py-0.5 rounded-full border" style={{ color: 'var(--as-text-muted)', borderColor: 'var(--as-border)' }}>
          {dur}
        </span>
        <ContentVisibilityBadge visibility={reel.visibility} expiresAt={reel.scoutExpiresAt} />
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 text-[12px]" style={{ color: 'var(--as-text-secondary)' }}>
        <span className="flex items-center gap-1"><Eye size={13} aria-hidden="true" />{reel.stats.plays.toLocaleString()}</span>
        <span className="flex items-center gap-1"><Heart size={13} aria-hidden="true" />{reel.stats.likes.toLocaleString()}</span>
        <span className="flex items-center gap-1"><Bookmark size={13} aria-hidden="true" />{reel.stats.saves.toLocaleString()}</span>
      </div>

      {/* Discipline metadata */}
      {metaItems.length > 0 && (
        <dl className="space-y-2">
          {metaItems.map(item => (
            <div key={item.label}>
              <dt className="text-[11px] uppercase tracking-wider" style={{ color: 'var(--as-text-muted)' }}>{item.label}</dt>
              <dd className="text-[13px]" style={{ color: 'var(--as-text)' }}>{item.value}</dd>
            </div>
          ))}
        </dl>
      )}

      {reel.description && (
        <p className="text-[13px]" style={{ color: 'var(--as-text-secondary)' }}>{reel.description}</p>
      )}
    </div>
  );
}
