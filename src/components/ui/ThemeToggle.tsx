import { MoonStar, SunMedium } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { IconButton } from '@/components/ui/IconButton';
import { useTheme } from '@/hooks/useTheme';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <IconButton
      label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      onClick={toggleTheme}
      icon={
        <span className="relative flex h-5 w-5 items-center justify-center overflow-hidden">
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={theme}
              initial={{ opacity: 0, rotate: -20, y: 4 }}
              animate={{ opacity: 1, rotate: 0, y: 0 }}
              exit={{ opacity: 0, rotate: 20, y: -4 }}
              transition={{ duration: 0.18 }}
              className="absolute"
            >
              {isDark ? <SunMedium className="h-4 w-4" /> : <MoonStar className="h-4 w-4" />}
            </motion.span>
          </AnimatePresence>
        </span>
      }
    />
  );
}
