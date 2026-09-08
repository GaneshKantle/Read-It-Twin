import { useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { BlobField } from '@/components/motion/BlobField';
import { CircleTagline } from '@/components/motion/CircleTagline';
import { Container } from '@/components/layout/Container';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { developer } from '@/lib/developer';

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

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button
                size="lg"
                arrow
                className="w-full sm:w-auto"
                onClick={() => navigate('/play')}
              >
                Start reading
              </Button>
              <Button
                size="lg"
                variant="ghost"
                className="w-full border-ink text-ink hover:bg-ink/10 sm:w-auto"
                onClick={() => navigate('/challenge')}
              >
                Challenge a friend
              </Button>
            </div>
          </div>

          <motion.div
            style={{ y, rotate, scale }}
            className="mx-auto h-40 w-40 shrink-0 text-ink/75 sm:h-52 sm:w-52 lg:mx-0"
          >
            <CircleTagline text="Read faster · Understand better · Beat your friends · " />
          </motion.div>
        </div>

        <div className="mt-12 flex flex-col gap-5 rounded-lg border-2 border-ink/20 bg-ink/8 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <Text as="p" variant="hand" className="text-ink/70">
              Developer
            </Text>
            <p className="mt-1 font-display text-[clamp(1.75rem,4vw,2.35rem)] font-extrabold leading-[0.9] tracking-[-0.03em]">
              {developer.name}
            </p>
            <Text as="p" variant="small" className="mt-2 font-semibold text-ink/70">
              Designed and built Read It Twin.
            </Text>
          </div>

          <a
            href={developer.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-ink px-5 py-3 text-label font-bold text-background transition-transform duration-fast ease-fluid hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-sec-violet"
          >
            Visit portfolio
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </a>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-ink/15 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <Text as="p" variant="small" className="font-semibold text-ink/70">
            {new Date().getFullYear()} Read It Twin
          </Text>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <Link
              to="/design-system"
              className="rounded-full text-small font-semibold text-ink/70 transition-colors duration-fast ease-fluid hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-ink"
            >
              Design system
            </Link>
            <a
              href={developer.url}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full text-small font-semibold text-ink/70 transition-colors duration-fast ease-fluid hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-ink"
            >
              Developer
            </a>
          </div>
        </div>
      </Container>
    </footer>
  );
}
