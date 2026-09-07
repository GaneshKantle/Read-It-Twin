import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { fadeUp } from '@/lib/motion';
import type { RematchState } from '@/lib/rematch';

type RematchActionsProps = {
  rematchState: RematchState;
  selfRequested: boolean;
  opponentRequested: boolean;
  opponentNickname: string | null;
  roomClosed: boolean;
  rematchAvailable: boolean;
  pending: boolean;
  leavePending: boolean;
  actionError: string | null;
  onRematch: () => void;
  onLeave: () => void;
};

export function RematchActions({
  rematchState,
  selfRequested,
  opponentRequested,
  opponentNickname,
  roomClosed,
  rematchAvailable,
  pending,
  leavePending,
  actionError,
  onRematch,
  onLeave,
}: RematchActionsProps) {
  const name = opponentNickname ?? 'Your opponent';
  const busy = pending || leavePending;

  let statusMessage: string | null = null;
  if (roomClosed || !rematchAvailable) {
    statusMessage = roomClosed
      ? `${name} left. You can still see these results.`
      : 'Rematch is unavailable for this room.';
  } else if (opponentRequested && !selfRequested) {
    statusMessage = `${name.toUpperCase()} WANTS A REMATCH.`;
  } else if (selfRequested && !opponentRequested) {
    statusMessage = `Waiting for ${name}…`;
  } else if (rematchState === 'both_ready') {
    statusMessage = 'Both ready. Heading back to the lobby…';
  }

  const canRequest = rematchAvailable && !roomClosed && !selfRequested;

  return (
    <motion.div variants={fadeUp} className="mt-8 space-y-4">
      {statusMessage ? (
        <Text
          as="p"
          variant="subheading"
          className="font-semibold"
          aria-live="polite"
        >
          {statusMessage}
        </Text>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row">
        {canRequest || (opponentRequested && !selfRequested) ? (
          <Button
            size="lg"
            arrow
            className="w-full sm:w-auto"
            disabled={busy || !rematchAvailable || roomClosed}
            onClick={onRematch}
          >
            RUN IT BACK
          </Button>
        ) : selfRequested && !roomClosed ? (
          <Button size="lg" arrow className="w-full sm:w-auto" disabled>
            RUN IT BACK
          </Button>
        ) : null}

        <Button
          size="lg"
          variant="ghost"
          className="w-full sm:w-auto"
          disabled={busy}
          onClick={onLeave}
        >
          Leave
        </Button>
      </div>

      {actionError ? (
        <Text as="p" variant="small" className="text-danger" role="alert">
          {actionError}
        </Text>
      ) : null}
    </motion.div>
  );
}
