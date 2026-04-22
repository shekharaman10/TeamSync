type Props = {
  message: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
};

export function ErrorBanner({ message, onRetry, onDismiss, className = "" }: Props) {
  return (
    <div
      role="alert"
      className={`flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400 ${className}`}
    >
      <svg className="mt-0.5 h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 8v4M12 16h.01" />
      </svg>
      <span className="flex-1">{message}</span>
      <div className="flex items-center gap-2">
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="shrink-0 text-xs font-medium text-red-300 underline hover:no-underline"
          >
            Retry
          </button>
        )}
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss"
            className="shrink-0 text-red-500 hover:text-red-300"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
