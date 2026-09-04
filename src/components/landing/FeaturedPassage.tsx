import { motion, useReducedMotion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { BlobField } from '@/components/motion/BlobField';
import { Container } from '@/components/layout/Container';
import { SplitChars } from '@/components/motion/SplitChars';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { passageHook, passages } from '@/data/passages';
import { categoryLabel } from '@/data/runOptions';
import { estimateReadingMs, formatMinutes } from '@/lib/reading';
import { springPlop } from '@/lib/motion';

const spotlight = passages.find((passage) => passage.id === 'ship-plank-self') ?? passages[9];

export function FeaturedPassage() {
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();

  return (
    <section className="section-shoulder relative isolate overflow-hidden bg-sec-cyan py-16 text-ink sm:py-24">
      <BlobField className="text-cyan/40 dark:text-cyan/12" seed={12} rings={2} />

      <Container className="relative">
        <div className="grid items-center gap-12 lg:grid-cols-[1fr_0.85fr]">
          <div>
            <SplitChars
              text="Hardest one we have"
              className="font-hand text-hand font-semibold text-violet"
            />

            <Text as="h2" variant="heading" className="mt-3">
              {spotlight.title}
            </Text>

            <p className="mt-5 max-w-[52ch] text-subheading font-medium text-ink/75">
              {passageHook(spotlight)}
            </p>

            <ul className="mt-7 flex flex-wrap gap-2">
              {[
                categoryLabel(spotlight.category),
                'Expert',
                `${spotlight.wordCount} words`,
                `About ${formatMinutes(estimateReadingMs(spotlight.wordCount, 'expert'))}`,
              ].map((chip) => (
                <li
                  key={chip}
                  className="rounded-full border-2 border-ink px-4 py-1.5 text-label font-bold"
                >
                  {chip}
                </li>
              ))}
            </ul>

            <Button size="lg" arrow className="mt-8 w-full sm:w-auto" onClick={() => navigate('/play')}>
              Take it on
            </Button>
          </div>

          <motion.div
            initial={prefersReducedMotion ? false : { scale: 0, rotate: -20, y: '-4em' }}
            whileInView={{ scale: 1, rotate: 11, y: '0em' }}
            viewport={{ once: true, amount: 0.4 }}
            transition={springPlop}
            className="mx-auto w-full max-w-[22rem] rounded-lg border-4 border-ink bg-background p-6 text-foreground shadow-pop"
          >
            <Text as="p" variant="eyebrow">
              Expert band
            </Text>
            <p className="mt-4 font-display text-[clamp(3rem,9vw,4.5rem)] font-extrabold leading-none tracking-[-0.04em] tabular-nums">
              170
            </p>
            <Text as="p" variant="small" className="mt-2 font-semibold text-muted-foreground">
              Words per minute most readers manage here. The easy band runs closer to 240.
            </Text>
          </motion.div>
        </div>
      </Container>
    </section>
  );
}
