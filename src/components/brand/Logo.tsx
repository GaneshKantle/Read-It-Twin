import { cn } from '@/lib/cn';

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-3 text-foreground', className)}>
      <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface shadow-soft">
        <span className="font-display text-lg font-semibold leading-none">RT</span>
      </div>
      <div className="flex flex-col leading-none">
        <span className="font-display text-xl tracking-[-0.03em] sm:text-2xl">Read It Twin</span>
        <span className="hidden text-[0.68rem] uppercase tracking-[0.24em] text-muted-foreground sm:block">
          Read together, compare better
        </span>
      </div>
    </div>
  );
}
