import type { PointerEvent as ReactPointerEvent } from 'react';
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  type MotionValue,
} from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { BlobField } from '@/components/motion/BlobField';
import { Container } from '@/components/layout/Container';
import { ScoreCard } from '@/components/landing/ScoreCard';
import { SplitChars } from '@/components/motion/SplitChars';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { useIdleFloat } from '@/hooks/useIdleFloat';
import { fadeUp, lineReveal, staggerContainer, springSoft } from '@/lib/motion';

const headline = ['Two people.', 'One passage.', 'One winner.'];

const floaters = [
  {
    key: 'classy',
    card: { name: 'Classyyy', wpm: 347, comprehension: 88, accent: 'bg-magenta', winner: true },
    position: 'left-0 top-2 sm:left-4',
    depth: 26,
    float: { y: 16, rotate: 3.5, duration: 7 },
    tilt: '-4deg',
  },
  {
    key: 'juno',
    card: { name: 'Juno', wpm: 291, comprehension: 94, accent: 'bg-cyan' },
    position: 'bottom-2 right-0 sm:right-6',
    depth: -34,
    float: { y: 20, rotate: 4.5, duration: 8.5, delay: 0.8 },
    tilt: '5deg',
  },
] as const;

export function Hero() {
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();

  // Normalised pointer position across the visual, -0.5 to 0.5.
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const smoothX = useSpring(pointerX, springSoft);
  const smoothY = useSpring(pointerY, springSoft);

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (prefersReducedMotion) {
      return;
    }

    const bounds = event.currentTarget.getBoundingClientRect();

    pointerX.set((event.clientX - bounds.left) / bounds.width - 0.5);
    pointerY.set((event.clientY - bounds.top) / bounds.height - 0.5);
  };

  const resetPointer = () => {
    pointerX.set(0);
    pointerY.set(0);
  };

  return (
    <section className="relative isolate overflow-hidden bg-sec-yellow text-ink">
      <BlobField className="text-orange/45 dark:text-periwinkle/15" seed={2} rings={3} />

      <Container className="relative pb-16 pt-28 sm:pb-24 sm:pt-32 lg:pb-28 lg:pt-36">
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10">
          <motion.div variants={staggerContainer} initial="initial" animate="animate">
            <motion.div variants={fadeUp}>
              <span className="inline-flex items-center rounded-full bg-ink px-4 py-1.5 text-label font-bold text-background">
                Reading, as a competition
              </span>
            </motion.div>

            <h1 className="mt-6 font-display text-[clamp(2.75rem,6.5vw,5.5rem)] font-extrabold leading-[0.85] tracking-[-0.035em]">
              <span className="sr-only">{headline.join(' ')}</span>
              <span aria-hidden="true">
                {headline.map((line) => (
                  <span key={line} className="block overflow-hidden pb-[0.06em]">
                    <motion.span variants={lineReveal} className="block">
                      {line}
                    </motion.span>
                  </span>
                ))}
              </span>
            </h1>

            <motion.div variants={fadeUp}>
              <Text as="p" className="mt-6 max-w-[38ch] text-subheading text-ink/75">
                Read a passage against the clock, answer eight questions, and walk away with one
                number. Speed only counts when you actually understood it.
              </Text>
            </motion.div>

            <motion.div variants={fadeUp} className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button size="lg" arrow className="w-full sm:w-auto" onClick={() => navigate('/play')}>
                Start reading
              </Button>
              <Button
                size="lg"
                variant="ghost"
                className="w-full border-ink text-ink hover:bg-ink/10 sm:w-auto"
                onClick={() => navigate('/play')}
                title="Multiplayer is coming next"
              >
                Challenge a friend
              </Button>
            </motion.div>

            <motion.div variants={fadeUp} className="mt-7">
              <SplitChars
                text="Solo now. Multiplayer next."
                className="font-hand text-hand font-semibold text-violet"
                delay={0.5}
              />
            </motion.div>
          </motion.div>

          <div
            onPointerMove={handlePointerMove}
            onPointerLeave={resetPointer}
            className="relative mx-auto h-[22rem] w-full max-w-[30rem] sm:h-[26rem]"
          >
            {floaters.map((floater) => (
              <Floater key={floater.key} floater={floater} pointerX={smoothX} pointerY={smoothY} />
            ))}

            <motion.div
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ ...springSoft, delay: 0.35 }}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-ink px-5 py-3 text-center text-background"
            >
              <span className="block font-display text-2xl font-extrabold leading-none tracking-[-0.03em]">
                vs
              </span>
            </motion.div>
          </div>
        </div>
      </Container>
    </section>
  );
}

function Floater({
  floater,
  pointerX,
  pointerY,
}: {
  floater: (typeof floaters)[number];
  pointerX: MotionValue<number>;
  pointerY: MotionValue<number>;
}) {
  const idle = useIdleFloat(floater.float);
  const parallaxX = useTransform(pointerX, (value) => value * floater.depth);
  const parallaxY = useTransform(pointerY, (value) => value * floater.depth * 0.6);

  return (
    <motion.div style={{ x: parallaxX, y: parallaxY }} className={`absolute ${floater.position}`}>
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ ...springSoft, delay: 0.2 }}
      >
        {/* Resting tilt lives on a plain wrapper so the idle loop owns `rotate`. */}
        <div style={{ transform: `rotate(${floater.tilt})` }}>
          <motion.div {...idle}>
            <ScoreCard {...floater.card} />
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
}
