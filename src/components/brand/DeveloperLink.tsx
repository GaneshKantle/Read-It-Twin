import { ArrowUpRight } from 'lucide-react';
import { developer } from '@/lib/developer';
import { cn } from '@/lib/cn';

const focusRing =
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background';

/**
 * External chip that credits the maker and opens the portfolio.
 */
export function DeveloperLink({ className }: { className?: string }) {
  return (
    <a
      href={developer.url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${developer.name}, developer of Read It Twin`}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full bg-chip px-4 py-2 text-label font-bold text-chip-foreground transition-transform duration-fast ease-fluid hover:-translate-y-0.5',
        focusRing,
        className,
      )}
    >
      Developer
      <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
    </a>
  );
}
