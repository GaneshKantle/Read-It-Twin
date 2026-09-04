import { motion, type Variants } from 'framer-motion';

const charVariants: Variants = {
  rest: { y: '0%', scaleY: 1, rotate: 0 },
  hover: (index: number) => ({
    y: ['0%', '55%', '0%'],
    scaleY: [1, 0.3, 1],
    rotate: [0, 17, 0],
    transition: {
      duration: 0.725,
      times: [0, 0.2, 1],
      ease: ['easeIn', 'backOut'] as const,
      delay: index * 0.028,
    },
  }),
};

/**
 * Letters drop, squash and spring back when the surrounding control is hovered.
 * Driven by the parent's `hover` variant label, so it has no listeners of its own.
 */
export function SquashLabel({ text }: { text: string }) {
  return (
    <span className="inline-flex">
      <span className="sr-only">{text}</span>
      <span aria-hidden="true" className="inline-flex whitespace-pre">
        {Array.from(text).map((char, index) => (
          <motion.span
            key={`${char}-${index}`}
            custom={index}
            variants={charVariants}
            className="inline-block origin-center"
          >
            {char === ' ' ? '\u00a0' : char}
          </motion.span>
        ))}
      </span>
    </span>
  );
}
