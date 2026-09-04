import { motion } from 'framer-motion';
import { motionEase, motionTiming } from '@/lib/motion';

interface QuizProgressProps {
  current: number;
  total: number;
  answered: number;
}

export function QuizProgress({ current, total, answered }: QuizProgressProps) {
  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <p
          aria-live="polite"
          className="rounded-full bg-ink px-4 py-2 text-label font-bold tabular-nums text-background"
        >
          {String(current).padStart(2, '0')} / {String(total).padStart(2, '0')}
        </p>
        <p className="text-label font-bold text-muted-foreground">{answered} answered</p>
      </div>

      <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-border/60">
        <motion.div
          aria-hidden="true"
          className="h-2 origin-left rounded-full bg-accent"
          initial={false}
          animate={{ scaleX: current / total }}
          transition={{ duration: motionTiming.base, ease: motionEase }}
        />
      </div>
    </div>
  );
}
