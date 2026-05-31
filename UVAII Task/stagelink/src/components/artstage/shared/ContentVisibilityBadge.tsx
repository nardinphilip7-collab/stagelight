import type { ContentVisibility } from '@/lib/artstage/types';
import { VISIBILITY_LABELS, visibilityBadgeColor } from '@/lib/artstage/visibility';

interface ContentVisibilityBadgeProps {
  visibility: ContentVisibility;
  expiresAt?: string;
}

export function ContentVisibilityBadge({ visibility, expiresAt }: ContentVisibilityBadgeProps) {
  if (visibility === 'public') return null;

  const label = visibility === 'scout_only' && expiresAt
    ? `Scout · exp. ${new Date(expiresAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
    : VISIBILITY_LABELS[visibility];

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${visibilityBadgeColor(visibility)}`}
      aria-label={`Visibility: ${label}`}
    >
      {label}
    </span>
  );
}
