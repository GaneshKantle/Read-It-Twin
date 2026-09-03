import { forwardRef } from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/cn';

const MotionButton = motion.create('button');

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-foreground text-background border-transparent shadow-soft hover:bg-foreground/92',
  secondary: 'bg-surface text-foreground border-border shadow-soft hover:bg-surface-raised',
  ghost: 'bg-transparent text-foreground border-transparent hover:bg-surface',
  danger: 'bg-danger text-danger-foreground border-transparent shadow-soft hover:opacity-95',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-10 px-4 text-label',
  md: 'h-11 px-5 text-body',
  lg: 'h-12 px-6 text-body',
};

export interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'ref'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = 'primary', size = 'md', type = 'button', ...props },
  ref,
) {
  return (
    <MotionButton
      ref={ref}
      type={type}
      whileHover={{ y: -1 }}
      whileTap={{ y: 1, scale: 0.985 }}
      transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-md border font-medium transition-colors duration-fast ease-fluid',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        'disabled:pointer-events-none disabled:opacity-50',
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    />
  );
});
