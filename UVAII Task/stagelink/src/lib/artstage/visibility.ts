import type { ContentVisibility } from './types';

export const VISIBILITY_LABELS: Record<ContentVisibility, string> = {
  public: 'Public',
  platform_only: 'Platform',
  industry_only: 'Industry',
  scout_only: 'Scout',
  private: 'Private',
};

export const VISIBILITY_DESCRIPTIONS: Record<ContentVisibility, string> = {
  public: 'Discoverable on ArtStage and search engines',
  platform_only: 'Only logged-in ArtStage users',
  industry_only: 'Only verified hirers, agencies, and casting',
  scout_only: 'Only the specific scout, expires after N days',
  private: 'Only you',
};

export function isPublic(v: ContentVisibility): boolean {
  return v === 'public';
}

export function visibilityBadgeColor(v: ContentVisibility): string {
  switch (v) {
    case 'industry_only': return 'text-amber-700 border-amber-300 bg-amber-50';
    case 'scout_only': return 'text-violet-700 border-violet-300 bg-violet-50';
    case 'platform_only': return 'text-sky-700 border-sky-300 bg-sky-50';
    case 'private': return 'text-[#6B6B6B] border-[#E8E5DE] bg-[#FAF9F6]';
    default: return '';
  }
}
