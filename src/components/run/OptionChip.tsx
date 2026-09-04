import { motion } from 'framer-motion';
import { cn } from '@/lib/cn';
import { motionEase, motionTiming } from '@/lib/motion';

interface OptionChipProps {
  label: string;
  hint?: string;
  selected: boolean;
  onSelect: () => void;
  /** Shared across a group so the fill slides between options. */
  indicatorId: string;
}

export function OptionChip({ label, hint, selected, onSelect, indicatorId }: OptionChipProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        'group relative isolate flex flex-col items-start gap-0.5 rounded-full border-2 px-5 py-3 text-left',
        'transition-all duration-fast ease-fluid',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        selected
          ? 'border-ink'
          : 'border-border hover:-translate-y-0.5 hover:border-foreground/40 hover:bg-surface-raised',
      )}
    >
      {selected && (
        <motion.span
          layoutId={indicatorId}
          aria-hidden="true"
          className="absolute inset-0 -z-10 rounded-full bg-yellow"
          transition={{ duration: motionTiming.base, ease: motionEase }}
        />
      )}
      <span className={cn('text-label font-bold', selected ? 'text-black' : 'text-foreground')}>
        {label}
      </span>
      {hint && (
        <span
          className={cn(
            'text-[0.75rem] font-semibold',
            selected ? 'text-black/65' : 'text-muted-foreground',
          )}
        >
          {hint}
        </span>
      )}
    </button>
  );
}
