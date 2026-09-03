import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

/**
 * The design system defines its own font-size scale in `styles/index.css`.
 * Without registering it here, tailwind-merge reads `text-body` as a text
 * colour and drops whichever colour class came before it.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [
        {
          text: ['display', 'heading', 'subheading', 'body', 'label', 'eyebrow', 'stat'],
        },
      ],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
