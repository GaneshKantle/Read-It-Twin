import { useMemo, type ElementType } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { springPlop } from '@/lib/motion';
import { cn } from '@/lib/cn';

interface SplitCharsProps {
  text: string;
  as?: ElementType;
  className?: string;
  /** Seconds between neighbouring letters. */
  stagger?: number;
  delay?: number;
}

const charVariants = {
  initial: { opacity: 0, rotate: 22, x: '-0.25em', y: '0.5em' },
  animate: (order: { index: number; stagger: number; delay: number }) => ({
    opacity: 1,
    rotate: 0,
    x: '0em',
    y: '0em',
    transition: { ...springPlop, delay: order.delay + order.index * order.stagger },
  }),
};

/**
 * Scatters a line of text in letter by letter. The whole string is exposed to
 * assistive tech as one label; the letter spans are decorative.
 */
export function SplitChars({ text, as = 'p', className, stagger = 0.016, delay = 0 }: SplitCharsProps) {
  const prefersReducedMotion = useReducedMotion();
  const MotionTag = useMemo(() => motion.create(as as 'p'), [as]);
  const words = useMemo(() => text.split(' '), [text]);

  if (prefersReducedMotion) {
    const Tag = as;

    return <Tag className={className}>{text}</Tag>;
  }

  let charIndex = -1;

  return (
    <MotionTag
      className={cn('inline-block', className)}
      aria-label={text}
      initial="initial"
      whileInView="animate"
      viewport={{ once: true, amount: 0.6 }}
    >
      {words.map((word, wordIndex) => (
        <span key={`${word}-${wordIndex}`} aria-hidden="true" className="inline-block whitespace-pre">
          {Array.from(word).map((char, index) => {
            charIndex += 1;

            return (
              <motion.span
                key={`${char}-${index}`}
                className="inline-block"
                custom={{ index: charIndex, stagger, delay }}
                variants={charVariants}
              >
                {char}
              </motion.span>
            );
          })}
          {wordIndex < words.length - 1 && ' '}
        </span>
      ))}
    </MotionTag>
  );
}
