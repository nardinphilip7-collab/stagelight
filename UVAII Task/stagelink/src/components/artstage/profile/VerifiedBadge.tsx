import { CheckCircle2 } from 'lucide-react';

interface VerifiedBadgeProps {
  size?: 'sm' | 'md' | 'lg';
  verifiedBy?: string;
  label?: string;
}

const sizes = { sm: 14, md: 16, lg: 20 } as const;

export function VerifiedBadge({ size = 'md', verifiedBy, label }: VerifiedBadgeProps) {
  const px = sizes[size];
  const tooltip = label ?? (verifiedBy ? `Verified by ${verifiedBy}` : 'Verified');

  return (
    <span
      className="inline-flex items-center group relative"
      title={tooltip}
      role="img"
      aria-label={tooltip}
    >
      <CheckCircle2
        size={px}
        style={{ color: 'var(--as-verified)', fill: 'var(--as-verified)', strokeWidth: 0 }}
        aria-hidden="true"
      />
      {/* Tooltip */}
      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block group-focus-within:block z-50 whitespace-nowrap text-[11px] bg-[var(--as-bg)] text-white px-2 py-1 rounded pointer-events-none">
        {tooltip}
      </span>
    </span>
  );
}
