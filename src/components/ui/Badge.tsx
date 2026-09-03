import type { ComponentPropsWithoutRef } from 'react';
import { cn } from '@/lib/cn';

export function Badge({ className, ...props }: ComponentPropsWithoutRef<'span'>) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border border-border bg-surface px-3 py-1 text-label uppercase tracking-[0.16em] text-muted-foreground',
        className,
      )}
      {...props}
    />
  );
}
