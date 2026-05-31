interface EmptyStateProps {
  title: string;
  message?: string;
  action?: React.ReactNode;
}

export function EmptyState({ title, message, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <p className="text-[15px] font-medium" style={{ color: 'var(--as-text)' }}>{title}</p>
      {message && <p className="mt-2 text-[13px]" style={{ color: 'var(--as-text-muted)' }}>{message}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
