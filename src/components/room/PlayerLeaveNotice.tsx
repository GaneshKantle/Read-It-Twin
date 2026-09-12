import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { leaveNoticeCopy, type LeaveNotice } from '@/lib/leaveNotice';
import { springPlop } from '@/lib/motion';

type PlayerLeaveNoticeProps = {
  notice: LeaveNotice | null;
  onDismiss?: () => void;
};

export function PlayerLeaveNotice({ notice, onDismiss }: PlayerLeaveNoticeProps) {
  const prefersReducedMotion = useReducedMotion();
  const copy = notice ? leaveNoticeCopy(notice) : null;

  return (
    <AnimatePresence>
      {notice && copy ? (
        <motion.div
          key={`${notice.nickname}:${notice.wasHost ? 'host' : 'guest'}`}
          role="status"
          aria-live="assertive"
          initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -10, scale: 0.98 }}
          transition={prefersReducedMotion ? { duration: 0.16 } : springPlop}
          className="rounded-lg border-2 border-ink bg-soft-pink p-5 text-black shadow-pop"
        >
          <p className="text-eyebrow font-bold uppercase tracking-[0.12em] text-black/65">
            Just now
          </p>
          <p className="mt-1 font-display text-2xl font-extrabold uppercase tracking-[-0.03em] sm:text-3xl">
            {copy.title}
          </p>
          <Text as="p" variant="small" className="mt-2 text-black/70">
            {copy.body}
          </Text>
          {onDismiss && !notice.wasHost ? (
            <Button size="md" className="mt-4" onClick={onDismiss}>
              Invite again
            </Button>
          ) : null}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
