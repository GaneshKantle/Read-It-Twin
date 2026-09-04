import { motion, type MotionValue } from 'framer-motion';
import { readingShell } from '@/components/run/readingLayout';
import { cn } from '@/lib/cn';
import { formatClock } from '@/lib/reading';

interface ReadingBarProps {
  title: string;
  meta: string;
  elapsedMs: number;
  progress: MotionValue<number>;
}

export function ReadingBar({ title, meta, elapsedMs, progress }: ReadingBarProps) {
  return (
    <header className="sticky top-0 z-30 bg-reading-page/92 backdrop-blur-sm">
      <div className={cn(readingShell, 'flex items-center justify-between gap-6 py-3')}>
        <div className="min-w-0">
          <p className="truncate text-label font-bold">{title}</p>
          <p className="mt-0.5 truncate text-[0.75rem] font-semibold text-muted-foreground">
            {meta}
          </p>
        </div>

        <p
          aria-label="Elapsed time"
          className="shrink-0 rounded-full bg-chip px-4 py-2 text-label font-bold tabular-nums text-chip-foreground"
        >
          {formatClock(elapsedMs)}
        </p>
      </div>

      <div className="absolute inset-x-0 bottom-0 h-1 bg-border/50">
        <motion.div
          aria-hidden="true"
          className="h-1 origin-left rounded-r-full bg-accent"
          style={{ scaleX: progress }}
        />
      </div>
    </header>
  );
}
