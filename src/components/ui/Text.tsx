import type { ComponentPropsWithoutRef, ElementType, ReactNode } from 'react';
import { cn } from '@/lib/cn';

type TextVariant =
  | 'display'
  | 'heading'
  | 'subheading'
  | 'body'
  | 'small'
  | 'label'
  | 'eyebrow'
  | 'stat'
  | 'hand';

type TextProps<T extends ElementType> = {
  as?: T;
  variant?: TextVariant;
  children: ReactNode;
  className?: string;
} & Omit<ComponentPropsWithoutRef<T>, 'as' | 'children' | 'className'>;

const variantClasses: Record<TextVariant, string> = {
  display: 'font-display text-display font-extrabold leading-[0.82] tracking-[-0.025em] text-balance',
  heading: 'font-display text-heading font-extrabold leading-[0.86] tracking-[-0.02em] text-balance',
  subheading: 'text-subheading font-semibold leading-[1.25] tracking-[-0.01em]',
  body: 'text-body font-medium leading-[1.55]',
  small: 'text-small leading-6',
  label: 'text-label font-bold leading-tight',
  eyebrow: 'text-eyebrow font-semibold text-muted-foreground',
  stat: 'font-display text-stat font-extrabold tracking-[-0.03em] tabular-nums',
  hand: 'font-hand text-hand font-semibold leading-[1.05] text-violet',
};

export function Text<T extends ElementType = 'p'>({
  as,
  variant = 'body',
  className,
  children,
  ...props
}: TextProps<T>) {
  const Component = as ?? 'p';

  return (
    <Component className={cn(variantClasses[variant], className)} {...props}>
      {children}
    </Component>
  );
}
