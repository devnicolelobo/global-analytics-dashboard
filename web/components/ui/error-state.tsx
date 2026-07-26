/**
 * Shared recoverable error alert for dashboard data regions (DEV-94 / REQ-F-51).
 *
 * Message must already be sanitized plain text — never pass HTML.
 */
type ErrorStateProps = {
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
};

export function ErrorState({
  message,
  onRetry,
  retryLabel = 'Try again',
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={[
        'rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <p>{message}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-2 font-medium underline underline-offset-2 hover:no-underline"
        >
          {retryLabel}
        </button>
      ) : null}
    </div>
  );
}
