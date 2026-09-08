import { motion } from 'framer-motion';
import { Container } from '@/components/layout/Container';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { fadeUp, staggerContainer } from '@/lib/motion';

interface QuizIntroProps {
  questionCount: number;
  passageTitle: string;
  onStart: () => void;
}

export function QuizIntro({ questionCount, passageTitle, onStart }: QuizIntroProps) {
  return (
    <Container className="flex flex-1 items-center py-12 sm:py-20">
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="mx-auto w-full max-w-[52rem]"
      >
        <motion.div variants={fadeUp} className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-chip px-4 py-1.5 text-label font-bold text-chip-foreground">
            {passageTitle}
          </span>
          <span className="rounded-full border-2 border-border px-4 py-1.5 text-label font-bold text-muted-foreground">
            {String(questionCount).padStart(2, '0')} questions
          </span>
        </motion.div>

        <motion.h1
          variants={fadeUp}
          className="mt-10 font-display text-[clamp(2.75rem,10vw,5.5rem)] font-extrabold leading-[0.86] tracking-[-0.04em] sm:mt-14"
        >
          Okay.
        </motion.h1>

        <motion.p
          variants={fadeUp}
          className="mt-3 font-display text-[clamp(1.5rem,5vw,3rem)] font-extrabold leading-[0.95] tracking-[-0.03em] text-muted-foreground"
        >
          Let&apos;s see if you actually read that.
        </motion.p>

        <motion.div
          variants={fadeUp}
          className="mt-12 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <Text as="p" variant="hand">
            No going back once you answer
          </Text>
          <Button size="lg" arrow className="w-full sm:w-auto" onClick={onStart}>
            First question
          </Button>
        </motion.div>
      </motion.div>
    </Container>
  );
}
