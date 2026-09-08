import { motion } from 'framer-motion';
import { CopyInviteButton } from '@/components/room/CopyInviteButton';
import { PlayerSlot } from '@/components/room/PlayerSlot';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { fadeUp, staggerContainer } from '@/lib/motion';
import type { MatchRow, PlayerRow, RoomRow } from '@/types/database';

type LobbyPanelProps = {
  room: RoomRow;
  selfPlayer: PlayerRow | null;
  opponent: PlayerRow | null;
  hostPlayerId: string | null;
  isHost: boolean;
  bothReady: boolean;
  canToggleReady: boolean;
  canStart: boolean;
  matchStarted: boolean;
  match: MatchRow | null;
  leftOpponentName: string | null;
  pending: {
    ready: boolean;
    start: boolean;
    leave: boolean;
  };
  actionError: string | null;
  onToggleReady: () => void;
  onStart: () => void;
  onLeave: () => void;
  onDismissOpponentLeft: () => void;
};

export function LobbyPanel({
  room,
  selfPlayer,
  opponent,
  hostPlayerId,
  isHost,
  bothReady,
  canToggleReady,
  canStart,
  matchStarted,
  match: _match,
  leftOpponentName,
  pending,
  actionError,
  onToggleReady,
  onStart,
  onLeave,
  onDismissOpponentLeft,
}: LobbyPanelProps) {
  const waitingName = opponent?.nickname ?? 'opponent';
  const selfReady = selfPlayer?.ready ?? false;

  const statusCopy = matchStarted
    ? 'Both ready. Starting the race…'
    : lobbyStatusMessage(bothReady, isHost, waitingName, opponent);

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="mx-auto w-full max-w-[54rem]"
    >
      <motion.div variants={fadeUp} className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-ink px-4 py-1.5 text-label font-bold text-background">
          Room lobby
        </span>
        <span className="rounded-full border-2 border-border px-4 py-1.5 text-label font-bold text-muted-foreground">
          {room.room_code}
        </span>
      </motion.div>

      <motion.h1
        variants={fadeUp}
        className="mt-6 font-display text-[clamp(2.5rem,8vw,4.5rem)] font-extrabold leading-[0.88] tracking-[-0.035em]"
      >
        Ready up.
      </motion.h1>

      <motion.div variants={fadeUp} className="mt-8">
        <CopyInviteButton roomCode={room.room_code} disabled={matchStarted} />
      </motion.div>

      {leftOpponentName ? (
        <motion.div
          variants={fadeUp}
          className="mt-6 rounded-lg border-2 border-ink bg-soft-pink p-5 text-black"
        >
          <p className="font-display text-2xl font-extrabold uppercase tracking-[-0.03em]">
            {leftOpponentName} left
          </p>
          <Text as="p" variant="small" className="mt-2 text-black/70">
            Your opponent left the room. Share the invite again when you are ready.
          </Text>
          <Button size="md" className="mt-4" onClick={onDismissOpponentLeft}>
            Invite again
          </Button>
        </motion.div>
      ) : null}

      <motion.div
        variants={fadeUp}
        className="relative mt-10 grid gap-4 sm:grid-cols-[1fr_auto_1fr] sm:items-center"
      >
        <PlayerSlot
          player={selfPlayer}
          accent="bg-magenta"
          isSelf
          isHost={selfPlayer?.id === hostPlayerId}
        />

        <div className="flex justify-center">
          <span className="rounded-full bg-ink px-5 py-3 font-display text-2xl font-extrabold leading-none tracking-[-0.03em] text-background">
            vs
          </span>
        </div>

        <PlayerSlot
          player={opponent}
          accent="bg-cyan"
          isHost={opponent?.id === hostPlayerId}
          emptyLabel="Waiting…"
        />
      </motion.div>

      <motion.div variants={fadeUp} className="mt-8 rounded-lg border-2 border-border bg-surface p-5 sm:p-6">
        <Text as="p" variant="subheading" aria-live="polite">
          {statusCopy}
        </Text>
        <span className="sr-only" aria-live="polite">
          {selfReady ? 'You are ready.' : 'You are not ready.'}
          {opponent
            ? opponent.ready
              ? ` ${opponent.nickname} is ready.`
              : ` ${opponent.nickname} is not ready.`
            : ' Waiting for opponent.'}
          {bothReady ? ' Both players are ready.' : ''}
        </span>
      </motion.div>

      {actionError ? (
        <motion.div variants={fadeUp} className="mt-4">
          <Text as="p" variant="small" className="text-danger">
            {actionError}
          </Text>
        </motion.div>
      ) : null}

      <motion.div variants={fadeUp} className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        {canToggleReady ? (
          <Button
            size="lg"
            variant={selfReady ? 'ink' : 'primary'}
            className="w-full sm:w-auto"
            disabled={pending.ready}
            onClick={onToggleReady}
          >
            {pending.ready ? 'Updating…' : selfReady ? '✓ Ready' : 'Ready'}
          </Button>
        ) : null}

        {isHost && !matchStarted ? (
          <Button
            size="lg"
            variant="secondary"
            arrow
            className="w-full sm:w-auto"
            disabled={!canStart || pending.start}
            onClick={onStart}
          >
            {pending.start ? 'Starting…' : 'Start match'}
          </Button>
        ) : null}

        {!isHost && bothReady && !matchStarted ? (
          <span className="inline-flex h-14 items-center justify-center rounded-full border-2 border-border px-6 text-label font-bold text-muted-foreground">
            Waiting for host…
          </span>
        ) : null}

        <Button
          size="lg"
          variant="ghost"
          className="w-full sm:w-auto"
          disabled={pending.leave}
          onClick={onLeave}
        >
          {pending.leave ? 'Leaving…' : 'Leave room'}
        </Button>
      </motion.div>
    </motion.div>
  );
}

function lobbyStatusMessage(
  bothReady: boolean,
  isHost: boolean,
  waitingName: string,
  opponent: PlayerRow | null,
): string {
  if (bothReady) {
    return isHost ? 'Both ready. Start when you are set.' : 'Both ready. Waiting for the host…';
  }
  if (!opponent) {
    return 'Waiting for a friend to join.';
  }
  if (opponent.ready) {
    return 'Waiting for you…';
  }
  return `Waiting for ${waitingName}…`;
}
