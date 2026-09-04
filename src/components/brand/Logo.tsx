import { cn } from '@/lib/cn';

/**
 * Circular mark plus wordmark. The two ticks above the ring read as a pair of
 * open pages, which is also the "two readers" idea the product is built on.
 */
export function Logo({
  className,
  compact = false,
  showTagline = true,
}: {
  className?: string;
  compact?: boolean;
  showTagline?: boolean;
}) {
  return (
    <div className={cn('flex items-center gap-2.5 text-foreground', className)}>
      <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="absolute -top-1.5 h-4 w-4 text-accent"
          fill="currentColor"
        >
          <path d="M11 14C8.5 12 7 8 7.6 3.4c3.2 1.4 4.7 4.6 5 8.2Z" />
          <path d="M13 14c1.6-2.2 2.4-5.6 1.6-9.4-2.6 1.8-3.4 5-3.4 8.2Z" />
        </svg>
        <span className="font-display text-[0.95rem] font-extrabold leading-none tracking-[-0.02em]">
          RT
        </span>
      </span>
      {!compact && (
        <span className="flex flex-col leading-none">
          <span className="font-display text-[1.15rem] font-extrabold tracking-[-0.03em] sm:text-[1.3rem]">
            Read It Twin
          </span>
          {showTagline && (
            <span className="mt-0.5 hidden text-[0.7rem] font-semibold text-muted-foreground sm:block">
              Read together, compare better
            </span>
          )}
        </span>
      )}
    </div>
  );
}
