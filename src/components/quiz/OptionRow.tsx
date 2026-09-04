import { Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/cn';
import { motionEase, motionTiming } from '@/lib/motion';

export const optionLetters = ['A', 'B', 'C', 'D'];

/**
 * A real radio input carries the semantics and keyboard behaviour; the visible
 * row is styled from the same state. Selection is signalled by the filled
 * letter, the check mark and the border weight, never by colour alone.
 */
export function OptionRow({
  name,
  index,
  label,
  selected,
  onSelect,
}: {
  name: string;
  index: number;
  label: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <motion.label
      whileTap={{ scale: 0.995 }}
      transition={{ duration: motionTiming.instant, ease: motionEase }}
      className={cn(
        'relative flex cursor-pointer items-center gap-4 rounded-lg border-2 px-4 py-4 transition-colors duration-fast ease-fluid sm:px-5',
        'has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-accent has-[:focus-visible]:ring-offset-2 has-[:focus-visible]:ring-offset-background',
        selected
          ? 'border-ink bg-yellow text-black'
          : 'border-border hover:border-foreground/40 hover:bg-surface-raised',
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
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 text-label font-bold transition-colors duration-fast ease-fluid',
          selected ? 'border-black bg-black text-yellow' : 'border-border text-muted-foreground',
        )}
      >
        {optionLetters[index]}
      </span>

      <span className="flex-1 text-body font-medium leading-6">{label}</span>

      {selected && (
        <motion.span
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: motionTiming.instant, ease: motionEase }}
          className="shrink-0"
        >
          <Check aria-hidden="true" className="h-5 w-5" />
          <span className="sr-only">Selected</span>
        </motion.span>
      )}
    </motion.label>
  );
}
