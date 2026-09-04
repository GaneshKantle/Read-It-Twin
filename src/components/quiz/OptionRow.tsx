import { Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/cn';
import { motionEase, motionTiming } from '@/lib/motion';

export const optionLetters = ['A', 'B', 'C', 'D'];

interface OptionRowProps {
  name: string;
  index: number;
  label: string;
  selected: boolean;
  onSelect: () => void;
}

/**
 * A real radio input carries the semantics and keyboard behaviour; the visible
 * row is styled from the same state. Selection is signalled by the inverted
 * letter, the check mark and the border weight, never by colour alone.
 */
export function OptionRow({ name, index, label, selected, onSelect }: OptionRowProps) {
  return (
    <motion.label
      whileTap={{ scale: 0.995 }}
      transition={{ duration: motionTiming.instant, ease: motionEase }}
      className={cn(
        'relative flex cursor-pointer items-center gap-4 rounded-md border px-4 py-4 transition-colors duration-fast ease-fluid sm:px-5',
        'has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-accent has-[:focus-visible]:ring-offset-2 has-[:focus-visible]:ring-offset-background',
        selected
          ? 'border-foreground bg-surface-raised'
          : 'border-border hover:border-foreground/40 hover:bg-surface',
      )}
    >
      <input
        type="radio"
        name={name}
        value={index}
        checked={selected}
        onChange={onSelect}
        className="sr-only"
      />

      <span
        aria-hidden="true"
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-sm border text-label font-medium tracking-[0.1em] transition-colors duration-fast ease-fluid',
          selected
            ? 'border-foreground bg-foreground text-background'
            : 'border-border text-muted-foreground',
        )}
      >
        {optionLetters[index]}
      </span>

      <span className="flex-1 text-body leading-6">{label}</span>

      {selected && (
        <motion.span
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: motionTiming.instant, ease: motionEase }}
          className="shrink-0"
        >
          <Check aria-hidden="true" className="h-4 w-4" />
          <span className="sr-only">Selected</span>
        </motion.span>
      )}
    </motion.label>
  );
}
