import { motion, useReducedMotion } from 'framer-motion';
import { Container } from '@/components/layout/Container';
import { Text } from '@/components/ui/Text';
import { plopScale } from '@/lib/motion';

const benefits = [
  'Twelve original passages',
  'Eight questions each',
  'Speed x comprehension',
  'Anti-skim guards',
  'Four difficulty bands',
  'Nine categories',
  'No account needed',
  'Light and dark',
];

export function WhyUs() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <section className="bg-sec-plain py-16 text-foreground sm:py-24">
      <Container>
        <Text as="h2" variant="heading" className="max-w-[16ch]">
          Why bother reading twice
        </Text>

        <motion.ul
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, amount: 0.3 }}
          transition={{ staggerChildren: 0.072 }}
          className="mt-10 flex flex-wrap gap-3"
        >
          {benefits.map((benefit) => (
            <motion.li
              key={benefit}
              variants={prefersReducedMotion ? undefined : plopScale}
              className="rounded-full border-2 border-foreground bg-surface px-5 py-3 text-body font-semibold"
            >
              {benefit}
            </motion.li>
          ))}
        </motion.ul>
      </Container>
    </section>
  );
}
