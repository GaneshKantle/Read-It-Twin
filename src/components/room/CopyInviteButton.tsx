import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';

type CopyInviteButtonProps = {
  roomCode: string;
  disabled?: boolean;
};

export function CopyInviteButton({ roomCode, disabled }: CopyInviteButtonProps) {
  const [copied, setCopied] = useState(false);
  const [fallback, setFallback] = useState(false);
  const inviteUrl =
    typeof window !== 'undefined' ? `${window.location.origin}/room/${roomCode}` : `/room/${roomCode}`;

  useEffect(() => {
    if (!copied) {
      return;
    }
    const timer = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setFallback(false);
    } catch {
      setFallback(true);
      setCopied(false);
    }
  };

  return (
    <div className="flex w-full flex-col gap-3">
      <Button
        size="lg"
        variant="secondary"
        className="w-full sm:w-auto"
        disabled={disabled}
        onClick={() => void handleCopy()}
      >
        {copied ? '✓ Copied' : 'Copy invite link'}
      </Button>

      {fallback ? (
        <div className="rounded-lg border-2 border-border bg-surface p-4">
          <Text as="p" variant="small" className="text-muted-foreground">
            Clipboard is blocked on this device. Share the room code or select the link below.
          </Text>
          <p className="mt-3 font-display text-3xl font-extrabold tracking-[0.12em]">{roomCode}</p>
          <input
            readOnly
            value={inviteUrl}
            className="mt-3 h-12 w-full rounded-full border-2 border-ink bg-background px-4 text-small font-semibold"
            onFocus={(event) => event.currentTarget.select()}
          />
        </div>
      ) : null}
    </div>
  );
}
