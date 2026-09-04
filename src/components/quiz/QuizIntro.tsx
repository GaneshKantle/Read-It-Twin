import { ArrowRight } from 'lucide-react';
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
    <Container className="flex flex-1 items-center py-14 sm:py-20">
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="mx-auto w-full max-w-[52rem]"
      >
        <motion.div
          variants={fadeUp}
          className="flex flex-col gap-1 border-b border-border pb-4 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4"
        >
          <Text as="p" variant="eyebrow">
            {passageTitle}
          </Text>
          <Text as="p" variant="eyebrow">
            {String(questionCount).padStart(2, '0')} questions
          </Text>
        </motion.div>

        <motion.h1
          variants={fadeUp}
          className="mt-10 font-display uppercase tracking-[-0.045em] text-[clamp(2.5rem,10vw,5.5rem)] leading-[0.9] sm:mt-14"
        >
          Okay.
        </motion.h1>

        <motion.p
          variants={fadeUp}
          className="mt-4 font-display uppercase tracking-[-0.03em] text-[clamp(1.5rem,5vw,3rem)] leading-[1.05] text-muted-foreground"
        >
          Let&apos;s see if you actually read that.
        </motion.p>

        <motion.div
          variants={fadeUp}
          className="mt-12 flex flex-col gap-4 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between"
        >
          <Text as="p" variant="eyebrow">
            No going back once you answer
          </Text>
          <Button size="lg" className="w-full sm:w-auto" onClick={onStart} autoFocus>
            First question
            <ArrowRight className="h-4 w-4" />
          </Button>
        </motion.div>
      </motion.div>
    </Container>
  );
}
