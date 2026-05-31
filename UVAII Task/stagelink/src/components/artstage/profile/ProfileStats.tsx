import { VerifiedBadge } from './VerifiedBadge';

interface ProfileStatsProps {
  followers: number;
  following: number;
  reels: number;
  verifiedCredits: number;
}

function fmt(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k`;
  return String(n);
}

export function ProfileStats({ followers, following, reels, verifiedCredits }: ProfileStatsProps) {
  return (
    <div
      className="flex items-center divide-x"
      style={{ borderColor: 'var(--as-border)', color: 'var(--as-text-secondary)', fontSize: 13 }}
      aria-label="Profile statistics"
    >
      <StatItem label="Followers" value={fmt(followers)} />
      <StatItem label="Following" value={fmt(following)} />
      <StatItem label="Reels" value={fmt(reels)} />
      <div className="flex items-center gap-1.5 px-4 py-2">
        <span className="font-semibold" style={{ color: 'var(--as-text)', fontSize: 15 }}>{fmt(verifiedCredits)}</span>
        <span>Verified credits</span>
        <VerifiedBadge size="sm" label="Verified credits" />
      </div>
    </div>
  );
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-1.5 px-4 py-2">
      <span className="font-semibold" style={{ color: 'var(--as-text)', fontSize: 15 }}>{value}</span>
      <span>{label}</span>
    </div>
  );
}
