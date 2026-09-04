import { forwardRef, type ReactNode } from 'react';
import { ArrowRight } from 'lucide-react';
import { motion, useReducedMotion, type HTMLMotionProps } from 'framer-motion';
import { SquashLabel } from '@/components/motion/SquashLabel';
import { useFinePointer } from '@/hooks/useFinePointer';
import { cn } from '@/lib/cn';
import { springSoft } from '@/lib/motion';

const MotionButton = motion.create('button');

type ButtonVariant = 'primary' | 'secondary' | 'chip' | 'ink' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-accent-foreground border-transparent shadow-pop hover:brightness-105',
  secondary: 'bg-orange text-black border-transparent shadow-pop hover:brightness-105',
  chip: 'bg-chip text-chip-foreground border-transparent hover:brightness-95',
  ink: 'bg-ink text-background border-transparent shadow-pop hover:opacity-90',
  ghost: 'bg-transparent text-foreground border-border hover:bg-surface-raised',
  danger: 'bg-danger text-danger-foreground border-transparent shadow-pop hover:brightness-105',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-10 px-4 text-label',
  md: 'h-12 px-6 text-body',
  lg: 'h-14 px-7 text-body sm:text-[1.0625rem]',
};

const arrowSizeClasses: Record<ButtonSize, string> = {
  sm: 'h-7 w-7',
  md: 'h-8 w-8',
  lg: 'h-9 w-9',
};

const buttonMotion = {
  rest: { y: 0, scale: 1 },
  hover: { y: -2 },
  tap: { y: 1, scale: 0.98 },
};

export interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'ref'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Adds the circular arrow chip the marketing CTAs carry. */
  arrow?: boolean;
}

/**
 * Pill-shaped throughout. When the label is a plain string its letters squash
 * and spring back on hover, driven by this button's `hover` variant.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = 'primary', size = 'md', type = 'button', arrow = false, children, ...props },
  ref,
) {
  const prefersReducedMotion = useReducedMotion();
  const finePointer = useFinePointer();
  // Letter squash is a hover flourish; coarse pointers never get stuck mid-squash.
  const animateLabel = typeof children === 'string' && finePointer && !prefersReducedMotion;

  return (
    <MotionButton
      ref={ref}
      type={type}
      variants={buttonMotion}
      initial="rest"
      animate="rest"
      whileHover="hover"
      whileTap="tap"
      transition={springSoft}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-full border font-semibold transition-colors duration-fast ease-fluid',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        'disabled:pointer-events-none disabled:opacity-45',
        variantClasses[variant],
        sizeClasses[size],
        arrow && 'pr-2',
        className,
      )}
      {...props}
    >
      {animateLabel ? <SquashLabel text={children as string} /> : (children as ReactNode)}
      {arrow && (
        <span
          aria-hidden="true"
          className={cn(
            'flex shrink-0 items-center justify-center rounded-full bg-black/15',
            arrowSizeClasses[size],
          )}
        >
          <ArrowRight className="h-4 w-4" />
        </span>
      )}
    </MotionButton>
  );
});
