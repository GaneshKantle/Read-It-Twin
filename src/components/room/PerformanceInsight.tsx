import { motion } from 'framer-motion';
import { Text } from '@/components/ui/Text';
import { fadeUp } from '@/lib/motion';
import type { MatchInsight } from '@/lib/matchInsights';

type PerformanceInsightProps = {
  insights: MatchInsight[];
};

export function PerformanceInsight({ insights }: PerformanceInsightProps) {
  if (insights.length === 0) {
    return null;
  }

  return (
    <motion.section variants={fadeUp} className="mt-6" aria-labelledby="match-insight-label">
      <Text as="h2" id="match-insight-label" variant="label" className="text-muted-foreground">
        Why it went that way
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
