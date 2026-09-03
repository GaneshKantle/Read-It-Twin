import { forwardRef, type ReactNode } from 'react';
import { Button, type ButtonProps } from '@/components/ui/Button';
import { cn } from '@/lib/cn';

interface IconButtonProps extends Omit<ButtonProps, 'children'> {
  icon: ReactNode;
  label: string;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { className, icon, label, ...props },
  ref,
) {
  return (
    <Button
      ref={ref}
      size="sm"
      variant="ghost"
      aria-label={label}
      className={cn('h-10 w-10 rounded-full px-0', className)}
      {...props}
    >
      {icon}
    </Button>
  );
});
