import { useState } from 'react';
import { Plus } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Container } from '@/components/layout/Container';
import { SplitChars } from '@/components/motion/SplitChars';
import { Text } from '@/components/ui/Text';
import { cn } from '@/lib/cn';
import { motionEase, motionTiming } from '@/lib/motion';

const questions = [
  {
    question: 'How is the score worked out?',
    answer:
      'Your words per minute multiplied by the share of questions you got right. Read 340 wpm and answer six of eight correctly and you score 255. Racing without understanding gets you nothing.',
  },
  {
    question: 'What stops me from skimming?',
    answer:
      'Two things. You have to reach the bottom of the passage before the finish button unlocks, and the run has a minimum time based on a pace no honest reader beats. Leaving the tab is counted too.',
  },
  {
    question: 'Where do the passages come from?',
    answer:
      'They are written for this app across nine categories and four difficulty bands, from a gentle warm-up to prose that argues back. Each one carries eight questions built against the text.',
  },
  {
    question: 'Can I play against a friend yet?',
    answer:
      'Yes — hit Challenge a friend, create a room, and send the invite link. Lobby, ready checks, and match start are live; the synchronized reading race lands next.',
  },
];

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="scroll-mt-24 bg-sec-plain pb-16 text-foreground sm:pb-24">
      <Container>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <Text as="h2" variant="heading">
            Common questions
          </Text>
          <SplitChars
            text="The ones people actually ask"
            className="font-hand text-hand font-semibold text-violet"
          />
        </div>

        <ul className="mt-10 border-t-2 border-foreground">
          {questions.map((item, index) => {
            const expanded = open === index;

            return (
              <li key={item.question} className="border-b-2 border-foreground">
                <h3>
                  <button
                    type="button"
                    aria-expanded={expanded}
                    onClick={() => setOpen(expanded ? null : index)}
                    className="flex w-full items-center justify-between gap-6 py-5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:py-6"
                  >
                    <span className="font-display text-[clamp(1.25rem,3vw,1.75rem)] font-extrabold leading-[1.05] tracking-[-0.02em]">
                      {item.question}
                    </span>
                    <span
                      aria-hidden="true"
                      className={cn(
                        'flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-all duration-base ease-fluid',
                        expanded ? 'rotate-45 bg-accent text-accent-foreground' : 'bg-chip text-chip-foreground',
                      )}
                    >
                      <Plus className="h-5 w-5" />
                    </span>
                  </button>
                </h3>

                <AnimatePresence initial={false}>
                  {expanded && (
                    <motion.div
                      key="answer"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: motionTiming.base, ease: motionEase }}
                      className="overflow-hidden"
                    >
                      <p className="max-w-[62ch] pb-6 text-body leading-7 text-muted-foreground">
                        {item.answer}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </li>
            );
          })}
        </ul>
      </Container>
    </section>
  );
}
