import { cn } from '@/lib/cn';
import { Text } from '@/components/ui/Text';
import type { PlayerRow } from '@/types/database';

type PlayerSlotProps = {
  player: PlayerRow | null;
  accent: string;
  isSelf?: boolean;
  isHost?: boolean;
  emptyLabel?: string;
};

export function PlayerSlot({
  player,
  accent,
  isSelf = false,
  isHost = false,
  emptyLabel = 'Waiting…',
}: PlayerSlotProps) {
  const ready = player?.ready ?? false;

  return (
    <div
      className={cn(
        'flex min-h-[9.5rem] flex-col justify-between rounded-lg border-4 border-ink bg-background p-5 shadow-pop sm:min-h-[10.5rem] sm:p-6',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-display text-2xl font-extrabold tracking-[-0.03em] uppercase sm:text-3xl">
            {player ? player.nickname : emptyLabel}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {isHost ? (
              <span className="rounded-full bg-ink px-2.5 py-1 text-[0.7rem] font-bold text-background">
                Host
              </span>
            ) : null}
            {isSelf ? (
              <span className="rounded-full bg-chip px-2.5 py-1 text-[0.7rem] font-bold text-chip-foreground">
                You
              </span>
            ) : null}
          </div>
        </div>
        <span className={cn('mt-1 h-3 w-3 rounded-full', accent)} aria-hidden="true" />
      </div>

      <Text
        as="p"
        variant="label"
        className={cn('mt-6', ready ? 'text-success' : 'text-muted-foreground')}
      >
        {player ? (ready ? '✓ Ready' : 'Not ready') : 'Open seat'}
      </Text>
    </div>
  );
}
