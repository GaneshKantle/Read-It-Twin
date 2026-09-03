import type { ComponentPropsWithoutRef, ElementType, ReactNode } from 'react';
import { cn } from '@/lib/cn';

type TextVariant = 'display' | 'heading' | 'subheading' | 'body' | 'label' | 'eyebrow' | 'stat';

type TextProps<T extends ElementType> = {
  as?: T;
  variant?: TextVariant;
  children: ReactNode;
  className?: string;
} & Omit<ComponentPropsWithoutRef<T>, 'as' | 'children' | 'className'>;

const variantClasses: Record<TextVariant, string> = {
  display: 'font-display text-display tracking-[-0.05em] text-balance',
  heading: 'font-display text-heading tracking-[-0.04em] text-balance',
  subheading: 'text-subheading font-medium tracking-[-0.02em]',
  body: 'text-body leading-7 text-foreground/92',
  label: 'text-label font-medium uppercase tracking-[0.14em]',
  eyebrow: 'text-eyebrow uppercase tracking-[0.22em] text-muted-foreground',
  stat: 'text-stat font-semibold tracking-[-0.04em] tabular-nums',
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
