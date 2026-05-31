'use client';
interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ message = 'Something went wrong.', onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <p className="text-[15px] font-medium" style={{ color: 'var(--as-text)' }}>Unable to load</p>
      <p className="mt-1 text-[13px]" style={{ color: 'var(--as-text-muted)' }}>{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-6 as-btn-outline text-sm"
          style={{ padding: '6px 16px' }}
        >
          Try again
        </button>
      )}
    </div>
  );
}
