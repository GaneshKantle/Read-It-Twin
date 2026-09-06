import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export interface NicknameInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
}

/** Pill nickname field matching existing chip / button chrome. */
export const NicknameInput = forwardRef<HTMLInputElement, NicknameInputProps>(
  function NicknameInput({ className, label = 'Nickname', id, maxLength = 24, ...props }, ref) {
    const inputId = id ?? 'nickname';

    return (
      <label className="flex w-full flex-col gap-2" htmlFor={inputId}>
        <span className="text-label font-bold text-muted-foreground">{label}</span>
        <input
          ref={ref}
          id={inputId}
          type="text"
          autoComplete="nickname"
          maxLength={maxLength}
          className={cn(
            'h-14 w-full rounded-full border-2 border-ink bg-background px-6 text-base font-semibold text-foreground',
            'placeholder:text-muted-foreground/70',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background',
            'disabled:opacity-45',
            className,
          )}
          {...props}
        />
      </label>
    );
  },
);
