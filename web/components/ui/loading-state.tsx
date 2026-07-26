/**
 * Shared loading indicator for dashboard data regions (DEV-94 / REQ-F-51).
 */
type LoadingStateProps = {
  message: string;
  /** Inline text for compact regions (KPI); panel uses dashed placeholder box. */
  variant?: 'inline' | 'panel';
  /** Taller placeholder for map region. */
  panelSize?: 'default' | 'map';
  className?: string;
};

const panelSizeClasses = {
  default: 'min-h-[220px] sm:min-h-[280px]',
  map: 'min-h-[280px] sm:min-h-[360px]',
} as const;

const panelBaseClassName =
  'flex items-center justify-center rounded-lg border border-dashed border-zinc-300 bg-zinc-50/80 text-sm text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900/50 dark:text-zinc-400';

const inlineClassName = 'text-sm text-zinc-600 dark:text-zinc-400';

export function LoadingState({
  message,
  variant = 'inline',
  panelSize = 'default',
  className,
}: LoadingStateProps) {
  const classes =
    variant === 'panel'
      ? [panelBaseClassName, panelSizeClasses[panelSize], className]
          .filter(Boolean)
          .join(' ')
      : [inlineClassName, className].filter(Boolean).join(' ');

  return (
    <p role="status" aria-live="polite" className={classes}>
      {message}
    </p>
  );
}
