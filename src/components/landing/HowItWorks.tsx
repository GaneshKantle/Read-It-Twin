import { useState, type MouseEvent } from 'react';
import { BookOpenText, ListChecks, Sliders, Trophy } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { BlobField } from '@/components/motion/BlobField';
import { Container } from '@/components/layout/Container';
import { SplitChars } from '@/components/motion/SplitChars';
import { Text } from '@/components/ui/Text';
import { springPlop, springSoft } from '@/lib/motion';
import { cn } from '@/lib/cn';

const steps = [
  {
    title: 'Set your run',
    body: 'Pick a difficulty band and a category, or leave it to chance. The estimate updates before you commit.',
    icon: Sliders,
    tone: 'bg-cyan',
  },
  {
    title: 'Read the passage',
    body: 'The clock starts after the countdown. Reach the bottom, and give it long enough to be believable.',
    icon: BookOpenText,
    tone: 'bg-magenta',
  },
  {
    title: 'Answer eight questions',
    body: 'Main idea, detail, inference, vocabulary. Written against the passage, not around it.',
    icon: ListChecks,
    tone: 'bg-yellow',
  },
  {
    title: 'See who won',
    body: 'Speed multiplied by comprehension gives one score, plus every answer you missed.',
    icon: Trophy,
    tone: 'bg-periwinkle',
  },
];

/** Resting pose per card, so the row sits slightly scattered rather than ruled. */
const restPose = [
  { x: '-1%', y: '2%', rotate: -2 },
  { x: '1%', y: '-1.5%', rotate: 1.75 },
  { x: '-0.5%', y: '1.5%', rotate: -1 },
  { x: '1%', y: '-2%', rotate: 2 },
];

export function HowItWorks() {
  const [active, setActive] = useState<number | null>(null);
  const prefersReducedMotion = useReducedMotion();

  const handleMouseMove = (event: MouseEvent<HTMLDivElement>) => {
    if (prefersReducedMotion) {
      return;
    }

    const bounds = event.currentTarget.getBoundingClientRect();
    const portion = Math.floor(((event.clientX - bounds.left) / bounds.width) * steps.length);

    setActive(Math.max(0, Math.min(steps.length - 1, portion)));
  };

  return (
    <section
      id="how-it-works"
      className="section-shoulder relative isolate scroll-mt-24 overflow-hidden bg-sec-pink py-16 text-ink sm:py-24"
    >
      <BlobField className="text-magenta/20 dark:text-pink/12" seed={5} rings={3} />

      <Container className="relative">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <Text as="h2" variant="heading">
            How it works
          </Text>
          <SplitChars
            text="Four steps, about five minutes"
            className="font-hand text-hand font-semibold text-violet"
          />
        </div>

        <div
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setActive(null)}
          className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4"
        >
          {steps.map((step, index) => {
            const rest = restPose[index];
            const isActive = active === index;
            const shove =
              active === null || isActive ? '0%' : `${(18 / (index - active)).toFixed(1)}%`;

            return (
              // Entry and hover live on separate elements: `whileInView` outranks
              // `animate`, so one node cannot own both.
              <motion.div
                key={step.title}
                initial={prefersReducedMotion ? false : { opacity: 0, y: 150 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ ...springPlop, delay: index * 0.088 }}
              >
                <motion.article
                  animate={{
                    x: isActive ? '0%' : active === null ? rest.x : shove,
                    y: isActive ? '0%' : rest.y,
                    rotate: isActive ? 0 : rest.rotate,
                    scale: isActive ? 1.075 : 1,
                  }}
                  transition={springSoft}
                  className={cn(
                    'flex h-full flex-col rounded-lg border-4 border-ink p-6 text-black shadow-pop',
                    step.tone,
                  )}
                >
                  <span className="font-hand text-[1.6rem] font-bold leading-none">
                    Step #{index + 1}
                  </span>

                  <step.icon aria-hidden="true" className="mt-6 h-12 w-12" strokeWidth={1.5} />

                  <h3 className="mt-6 font-display text-[1.5rem] font-extrabold leading-[0.95] tracking-[-0.02em]">
                    {step.title}
                  </h3>
                  <p className="mt-3 text-small font-medium leading-6 text-black/80">{step.body}</p>
                </motion.article>
              </motion.div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
