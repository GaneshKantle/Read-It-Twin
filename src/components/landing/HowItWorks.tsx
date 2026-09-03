import { motion } from 'framer-motion';
import { Container } from '@/components/layout/Container';
import { Text } from '@/components/ui/Text';
import { fadeUp, sectionViewport, staggerContainer } from '@/lib/motion';

const steps = [
  'Create a room',
  'Invite a friend',
  'Read the same passage',
  'Answer questions',
  'See who wins',
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-24 border-t border-border">
      <Container className="py-14 sm:py-20 lg:py-24">
        <motion.div
          variants={staggerContainer}
          initial="initial"
          whileInView="animate"
          viewport={sectionViewport}
        >
          <motion.div
            variants={fadeUp}
            className="flex flex-col gap-3 sm:flex-row sm:items-baseline sm:justify-between"
          >
            <Text as="h2" variant="heading" className="text-[clamp(2rem,6vw,3.5rem)] uppercase">
              How it works
            </Text>
            <Text as="p" variant="eyebrow">
              Five steps
            </Text>
          </motion.div>

          <ol className="mt-8 sm:mt-12">
            {steps.map((step, index) => (
              <motion.li
                key={step}
                variants={fadeUp}
                className="group grid grid-cols-[2.75rem_1fr] items-baseline gap-4 border-t border-border py-5 last:border-b last:border-border sm:grid-cols-[7rem_1fr] sm:gap-8 sm:py-7"
              >
                <span className="font-display text-lg tabular-nums text-muted-foreground transition-colors duration-fast ease-fluid group-hover:text-accent sm:text-2xl">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className="font-display text-2xl uppercase leading-tight tracking-[-0.03em] sm:text-4xl">
                  {step}
                </span>
              </motion.li>
            ))}
          </ol>
        </motion.div>
      </Container>
    </section>
  );
}
