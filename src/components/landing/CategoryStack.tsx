import { useState, type PointerEvent as ReactPointerEvent } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Container } from '@/components/layout/Container';
import { BlobField } from '@/components/motion/BlobField';
import { SplitChars } from '@/components/motion/SplitChars';
import { Text } from '@/components/ui/Text';
import { categoryLabel } from '@/data/runOptions';
import { categories } from '@/types/run';
import { springSoft } from '@/lib/motion';

const labels = [...categories.map(categoryLabel), 'and more'];

export function CategoryStack() {
  const [active, setActive] = useState<number | null>(null);

  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const driftX = useSpring(pointerX, springSoft);
  const driftY = useSpring(pointerY, springSoft);

  const blobX = useTransform(driftX, (value) => value * 60);
  const blobY = useTransform(driftY, (value) => value * 40);

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();

    pointerX.set((event.clientX - bounds.left) / bounds.width - 0.5);
    pointerY.set((event.clientY - bounds.top) / bounds.height - 0.5);
  };

  return (
    <section
      className="section-shoulder relative isolate -mt-6 overflow-hidden bg-sec-magenta py-16 text-ink sm:py-24"
      onPointerMove={handlePointerMove}
      onPointerLeave={() => {
        pointerX.set(0);
        pointerY.set(0);
        setActive(null);
      }}
    >
      <motion.div style={{ x: blobX, y: blobY }} className="absolute inset-[-10%]">
        <BlobField className="text-ink/15" seed={9} rings={2} />
      </motion.div>

      <Container className="relative">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <Text as="h2" variant="heading">
            Choose from
          </Text>
          <SplitChars
            text="A passage for every kind of reader"
            className="font-hand text-hand font-semibold text-ink/80"
          />
        </div>

        <ul className="mt-10 flex flex-col">
          {labels.map((label, index) => {
            const distance = active === null ? 0 : index - active;
            const isActive = active === index;

            return (
              <motion.li
                key={label}
                onPointerEnter={() => setActive(index)}
                animate={{
                  x: active === null ? 0 : isActive ? 24 : Math.sign(distance) * (14 / Math.abs(distance)),
                  rotate: active === null ? 0 : isActive ? -1.2 : 0,
                  opacity: active === null || isActive ? 1 : 0.55,
                }}
                transition={springSoft}
                className="cursor-default font-display text-[clamp(2rem,7vw,4.5rem)] font-extrabold leading-[1.02] tracking-[-0.03em]"
              >
                {label}
              </motion.li>
            );
          })}
        </ul>
      </Container>
    </section>
  );
}
