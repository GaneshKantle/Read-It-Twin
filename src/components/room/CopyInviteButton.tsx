import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { ShareAction } from '@/components/share/ShareAction';
import { track } from '@/lib/analytics';
import { buildInviteUrl, copyText, inviteShareMessage } from '@/lib/share';

type CopyInviteButtonProps = {
  roomCode: string;
  disabled?: boolean;
};

export function CopyInviteButton({ roomCode, disabled }: CopyInviteButtonProps) {
  const [copied, setCopied] = useState(false);
  const [fallback, setFallback] = useState(false);
  const inviteUrl = buildInviteUrl(roomCode);

  useEffect(() => {
    if (!copied) {
      return;
    }
    const timer = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const handleCopy = async () => {
    const result = await copyText(inviteUrl);
    if (result.ok) {
      setCopied(true);
      setFallback(false);
      track('invite_copied', { method: 'clipboard' });
      return;
    }
    setFallback(true);
    setCopied(false);
  };

  return (
    <div className="flex w-full flex-col gap-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Button
          size="lg"
          variant="secondary"
          className="w-full sm:w-auto"
          disabled={disabled}
          onClick={() => void handleCopy()}
        >
          {copied ? '✓ Copied' : 'Copy invite'}
        </Button>
        <ShareAction
          payload={{
            title: 'Read It Twin challenge',
            text: inviteShareMessage(inviteUrl),
            url: inviteUrl,
          }}
          shareLabel="Share challenge"
          copyLabel="Share challenge"
          analyticsEvent="invite_copied"
          variant="ghost"
          className="w-full sm:w-auto"
          disabled={disabled}
        />
      </div>

      <span className="sr-only" aria-live="polite">
        {copied ? 'Invite link copied.' : ''}
      </span>

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
