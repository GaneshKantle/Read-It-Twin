import { motion } from 'framer-motion';
import { Text } from '@/components/ui/Text';
import { fadeUp } from '@/lib/motion';
import type { ResultInsight } from '@/lib/insights';

/** Reads back what the numbers say. Nothing here is guessed or embellished. */
export function PerformanceInsights({ insights }: { insights: ResultInsight[] }) {
  if (insights.length === 0) {
    return null;
  }

  return (
    <motion.section variants={fadeUp} className="mt-4" aria-labelledby="insights-label">
      <Text as="h2" id="insights-label" variant="label" className="text-muted-foreground">
        What stood out
      </Text>

      <ul className="mt-3 grid gap-2">
        {insights.map((insight) => (
          <li
            key={insight.id}
            className="flex items-start gap-3 rounded-lg border-2 border-border bg-surface px-5 py-4"
          >
            <span aria-hidden="true" className="mt-2 h-2 w-2 shrink-0 rounded-full bg-accent" />
            <p className="text-body font-medium leading-6">{insight.text}</p>
          </li>
        ))}
      </ul>
    </motion.section>
  );
}
