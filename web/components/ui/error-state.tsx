/**
 * Shared recoverable error alert for dashboard data regions (DEV-94 / REQ-F-51).
 *
 * Message must already be sanitized plain text — never pass HTML.
 */
type ErrorStateProps = {
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
  /** Compact styling for footer and other dense regions. */
  variant?: 'default' | 'compact';
  className?: string;
};

const variantClasses = {
  default:
    'rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200',
  compact:
    'text-xs text-red-700 dark:text-red-300',
} as const;

export function ErrorState({
  message,
  onRetry,
  retryLabel = 'Try again',
  variant = 'default',
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={[variantClasses[variant], className].filter(Boolean).join(' ')}
    >
      <p>{message}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-1 font-medium underline underline-offset-2 hover:no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 dark:focus-visible:outline-red-400"
        >
          {retryLabel}
        </button>
      ) : null}
    </div>
  );
}
