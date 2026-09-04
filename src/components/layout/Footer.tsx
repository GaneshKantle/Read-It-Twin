import { useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { BlobField } from '@/components/motion/BlobField';
import { CircleTagline } from '@/components/motion/CircleTagline';
import { Container } from '@/components/layout/Container';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';

const tagline = ['Two people', 'One passage', 'One winner'];

export function Footer() {
  const navigate = useNavigate();
  const ref = useRef<HTMLElement>(null);

  // Scrubbed rather than triggered, so the stamp keeps pace with the scroll.
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'start start'],
  });

  const y = useTransform(scrollYProgress, [0, 1], ['9rem', '0rem']);
  const rotate = useTransform(scrollYProgress, [0, 1], [34, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [0.85, 1]);

  return (
    <footer
      ref={ref}
      className="section-shoulder relative isolate -mt-6 overflow-hidden bg-sec-violet text-ink"
    >
      <BlobField className="text-ink/10" seed={7} rings={3} />

      <Container className="relative py-14 sm:py-20">
        <div className="flex flex-col gap-12 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl">
            <Text as="p" variant="hand" className="text-ink/70">
              See you on the next passage
            </Text>
            <h2 className="mt-3 font-display text-[clamp(2.75rem,8vw,5.5rem)] font-extrabold leading-[0.85] tracking-[-0.03em]">
              Read It Twin
            </h2>

            <ul className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-2">
              {tagline.map((line) => (
                <li
                  key={line}
                  className="rounded-full bg-ink/10 px-4 py-1.5 text-label font-bold text-ink"
                >
                  {line}
                </li>
              ))}
            </ul>

            <Button
              size="lg"
              arrow
              className="mt-8 w-full sm:w-auto"
              onClick={() => navigate('/play')}
            >
              Start reading
            </Button>
          </div>

          <motion.div
            style={{ y, rotate, scale }}
            className="mx-auto h-40 w-40 shrink-0 text-ink/75 sm:h-52 sm:w-52 lg:mx-0"
          >
            <CircleTagline text="Read faster · Understand better · Beat your friends · " />
          </motion.div>
        </div>

        <div className="mt-14 flex flex-col gap-3 border-t border-ink/15 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <Text as="p" variant="small" className="font-semibold text-ink/70">
            {new Date().getFullYear()} Read It Twin
          </Text>
          <Link
            to="/design-system"
            className="rounded-full text-small font-semibold text-ink/70 transition-colors duration-fast ease-fluid hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-ink"
          >
            Design system
          </Link>
        </div>
      </Container>
    </footer>
  );
}
