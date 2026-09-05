import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Container } from '@/components/layout/Container';
import { SplitChars } from '@/components/motion/SplitChars';
import { Text } from '@/components/ui/Text';
import { categoryLabel, difficultyLabel } from '@/data/runOptions';
import { useDragScroll } from '@/hooks/useDragScroll';
import { useMomentumHover } from '@/hooks/useMomentumHover';
import { cn } from '@/lib/cn';
import { earlyViewport, fadeUp, staggerContainer } from '@/lib/motion';
import { getCatalogPassages, passageHook } from '@/lib/services/passageRepository';
import type { Passage } from '@/types/run';

const frames = [
  'border-magenta',
  'border-cyan',
  'border-orange',
  'border-violet',
  'border-lime',
  'border-pink',
];

const catalog = getCatalogPassages();

/** One passage per difficulty band, then round again, so the row stays varied. */
const featured = [0, 3, 6, 9, 1, 4, 7, 10].map((index) => catalog[index]).filter(Boolean);

export function PassageCarousel() {
  const trackRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  useDragScroll(trackRef);

  /**
   * Cards lift and tilt by how far they sit from the middle of the track, so
   * the row reads as a shelf being panned rather than a flat list.
   */
  const applyTilt = useCallback(() => {
    const track = trackRef.current;

    if (!track) {
      return;
    }

    const bounds = track.getBoundingClientRect();
    const center = bounds.left + bounds.width / 2;
    const reach = bounds.width / 2;

    itemRefs.current.forEach((item, index) => {
      if (!item) {
        return;
      }

      const itemBounds = item.getBoundingClientRect();
      const offset = itemBounds.left + itemBounds.width / 2 - center;
      const normalised = Math.max(-2, Math.min(2, offset / reach));
      const strength = Math.sin(normalised * 1.2);
      const direction = index % 2 === 0 ? -1 : 1;

      item.style.transform = `translateY(${(strength * (4 + (index % 3) * 2) * direction).toFixed(2)}%) rotate(${(
        strength *
        (1.6 + (index % 4) * 0.4) *
        direction
      ).toFixed(2)}deg)`;
    });

    setAtStart(track.scrollLeft <= 4);
    setAtEnd(track.scrollLeft >= track.scrollWidth - track.clientWidth - 4);
  }, []);

  useEffect(() => {
    applyTilt();

    const track = trackRef.current;
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(applyTilt);
    };

    track?.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);

    return () => {
      cancelAnimationFrame(frame);
      track?.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [applyTilt]);

  const step = (direction: 1 | -1) => {
    const track = trackRef.current;
    const card = itemRefs.current[0];

    if (!track || !card) {
      return;
    }

    track.scrollBy({ left: direction * (card.offsetWidth + 20), behavior: 'smooth' });
  };

  return (
    <section id="passages" className="scroll-mt-24 bg-sec-plain py-16 text-foreground sm:py-24">
      <Container>
        <motion.div
          variants={staggerContainer}
          initial="initial"
          whileInView="animate"
          viewport={earlyViewport}
          className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between"
        >
          <motion.div variants={fadeUp} className="max-w-xl">
            <Text as="h2" variant="heading">
              Twelve passages, no filler
            </Text>
            <Text as="p" className="mt-4 text-subheading text-muted-foreground">
              Four difficulty bands from a gentle warm-up to prose that fights back. Every one comes
              with eight questions written against the text.
            </Text>
          </motion.div>

          <motion.div variants={fadeUp} className="flex items-center gap-3">
            <SplitChars
              text="Drag me"
              className="hidden font-hand text-hand font-semibold text-violet sm:block"
            />
            <div className="flex gap-2">
              <ArrowButton label="Previous passages" disabled={atStart} onClick={() => step(-1)}>
                <ArrowLeft className="h-4 w-4" />
              </ArrowButton>
              <ArrowButton label="More passages" disabled={atEnd} onClick={() => step(1)}>
                <ArrowRight className="h-4 w-4" />
              </ArrowButton>
            </div>
          </motion.div>
        </motion.div>
      </Container>

      <div
        ref={trackRef}
        className="mt-10 flex snap-x snap-mandatory gap-5 overflow-x-auto px-4 pb-6 pt-4 [scrollbar-width:none] sm:px-6 lg:px-10 [&::-webkit-scrollbar]:hidden"
      >
        {featured.map((passage, index) => (
          <div
            key={passage.id}
            ref={(node) => {
              itemRefs.current[index] = node;
            }}
            className="w-[16rem] shrink-0 snap-center will-change-transform sm:w-[18.5rem]"
          >
            <PassageCard passage={passage} frame={frames[index % frames.length]} />
          </div>
        ))}
      </div>
    </section>
  );
}

function ArrowButton({
  children,
  label,
  disabled,
  onClick,
}: {
  children: ReactNode;
  label: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'flex h-11 w-11 items-center justify-center rounded-full border-2 border-foreground transition-all duration-fast ease-fluid',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        disabled
          ? 'cursor-not-allowed border-border text-muted-foreground/50'
          : 'bg-foreground text-background hover:-translate-y-0.5',
      )}
    >
      {children}
    </button>
  );
}

function PassageCard({ passage, frame }: { passage: Passage; frame: string }) {
  const navigate = useNavigate();
  const { style, handlers } = useMomentumHover({
    strength: 0.28,
    spin: 0.1,
    maxOffset: 5,
    maxSpin: 1.5,
  });

  return (
    <motion.article
      style={style}
      {...handlers}
      className={cn(
        'flex h-full flex-col rounded-lg border-4 bg-surface p-5 shadow-soft',
        frame,
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-chip px-3 py-1 text-[0.7rem] font-bold text-chip-foreground">
          {categoryLabel(passage.category)}
        </span>
        <span className="rounded-full border border-border px-3 py-1 text-[0.7rem] font-bold text-muted-foreground">
          {difficultyLabel(passage.difficulty)}
        </span>
      </div>

      <h3 className="mt-4 font-display text-[1.6rem] font-extrabold leading-[0.95] tracking-[-0.025em]">
        {passage.title}
      </h3>

      <p className="mt-3 line-clamp-4 flex-1 text-small leading-6 text-muted-foreground">
        {passageHook(passage)}
      </p>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4">
        <span className="text-[0.7rem] font-semibold tabular-nums text-muted-foreground">
          {passage.wordCount} words / {passage.questions.length} questions
        </span>
        <button
          type="button"
          onClick={() => navigate('/play')}
          className="rounded-full bg-accent px-3.5 py-1.5 text-[0.72rem] font-bold text-accent-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
        >
          Run it
        </button>
      </div>
    </motion.article>
  );
}
