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
        'group relative isolate flex flex-col items-start gap-1 rounded-md border px-4 py-3 text-left',
        'transition-colors duration-fast ease-fluid',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        selected ? 'border-foreground' : 'border-border hover:border-foreground/40 hover:bg-surface',
      )}
    >
      {selected && (
        <motion.span
          layoutId={indicatorId}
          aria-hidden="true"
          className="absolute inset-0 -z-10 rounded-md bg-foreground"
          transition={{ duration: motionTiming.base, ease: motionEase }}
        />
      )}
      <span
        className={cn(
          'text-label font-medium uppercase tracking-[0.16em]',
          selected ? 'text-background' : 'text-foreground',
        )}
      >
        {label}
      </span>
      {hint && (
        <span
          className={cn(
            'text-eyebrow tracking-[0.14em]',
            selected ? 'text-background/70' : 'text-muted-foreground',
          )}
        >
          {hint}
        </span>
      )}
    </button>
  );
}
