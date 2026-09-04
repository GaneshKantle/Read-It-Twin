import { motion } from 'framer-motion';
import { Text } from '@/components/ui/Text';
import { motionEase, motionTiming } from '@/lib/motion';

interface QuizProgressProps {
  current: number;
  total: number;
  answered: number;
}

export function QuizProgress({ current, total, answered }: QuizProgressProps) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-4">
        <p
          aria-live="polite"
          className="text-label font-medium tabular-nums tracking-[0.16em] text-foreground"
        >
          {String(current).padStart(2, '0')} / {String(total).padStart(2, '0')}
        </p>
        <Text as="p" variant="eyebrow">
          {answered} answered
        </Text>
      </div>

      <div className="mt-3 h-px w-full bg-border">
        <motion.div
          aria-hidden="true"
          className="h-px origin-left bg-foreground"
          initial={false}
          animate={{ scaleX: current / total }}
          transition={{ duration: motionTiming.base, ease: motionEase }}
        />
      </div>
    </div>
  );
}
