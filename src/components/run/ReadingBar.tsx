import { motion, type MotionValue } from 'framer-motion';
import { readingShell } from '@/components/run/readingLayout';
import { Text } from '@/components/ui/Text';
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
    <header className="sticky top-0 z-30 border-b border-border bg-background/92 backdrop-blur-sm">
      <div className={cn(readingShell, 'flex items-center justify-between gap-6 py-3')}>
        <div className="min-w-0">
          <p className="truncate text-label font-medium uppercase tracking-[0.14em]">{title}</p>
          <Text as="p" variant="eyebrow" className="mt-1 truncate">
            {meta}
          </Text>
        </div>

        <p
          aria-label="Elapsed time"
          className="shrink-0 text-label font-medium tabular-nums tracking-[0.14em] text-muted-foreground"
        >
          {formatClock(elapsedMs)}
        </p>
      </div>

      <div className="absolute inset-x-0 bottom-0 h-px bg-transparent">
        <motion.div
          aria-hidden="true"
          className="h-px origin-left bg-foreground"
          style={{ scaleX: progress }}
        />
      </div>
    </header>
  );
}
