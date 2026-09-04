import type { ComponentPropsWithoutRef } from 'react';
import { cn } from '@/lib/cn';

export function Badge({ className, ...props }: ComponentPropsWithoutRef<'span'>) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full bg-chip px-3.5 py-1.5 text-label font-bold text-chip-foreground',
        className,
      )}
      {...props}
    />
  );
}
