import { useEffect, useState } from 'react';
import { Button, type ButtonProps } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { track } from '@/lib/analytics';
import { cn } from '@/lib/cn';
import { canUseNativeShare, shareContent, type SharePayload } from '@/lib/share';

type ShareActionProps = {
  payload: SharePayload;
  /** Idle label when native share is available. */
  shareLabel?: string;
  /** Idle label when falling back to copy. */
  copyLabel?: string;
  /** Analytics event fired on successful share or copy. */
  analyticsEvent?: 'result_shared' | 'invite_copied';
  variant?: ButtonProps['variant'];
  size?: ButtonProps['size'];
  className?: string;
  disabled?: boolean;
  arrow?: boolean;
};

/**
 * Share via Web Share API when available; otherwise copy.
 * Clipboard failure surfaces selectable text — never a silent fail.
 */
export function ShareAction({
  payload,
  shareLabel = 'Share result',
  copyLabel = 'Copy link',
  analyticsEvent,
  variant = 'secondary',
  size = 'lg',
  className,
  disabled,
  arrow,
}: ShareActionProps) {
  const [status, setStatus] = useState<'idle' | 'copied' | 'fallback'>('idle');
  const [fallbackText, setFallbackText] = useState('');
  const native = canUseNativeShare();
  const idleLabel = native ? shareLabel : copyLabel;

  useEffect(() => {
    if (status !== 'copied') {
      return;
    }
    const timer = window.setTimeout(() => setStatus('idle'), 2000);
    return () => window.clearTimeout(timer);
  }, [status]);

  const handleShare = async () => {
    const result = await shareContent(payload);
    if (result.ok) {
      if (analyticsEvent) {
        track(analyticsEvent, { method: result.method });
      }
      if (result.method === 'clipboard') {
        setStatus('copied');
        setFallbackText('');
      }
      return;
    }
    if (result.method === 'cancelled') {
      return;
    }
    const text = payload.url ? `${payload.text}\n${payload.url}` : payload.text;
    setFallbackText(text);
    setStatus('fallback');
  };

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <Button
        size={size}
        variant={variant}
        arrow={arrow}
        className="w-full"
        disabled={disabled}
        onClick={() => void handleShare()}
      >
        {status === 'copied' ? '✓ Copied' : idleLabel}
      </Button>

      <span className="sr-only" aria-live="polite">
        {status === 'copied'
          ? 'Copied to clipboard.'
          : status === 'fallback'
            ? 'Clipboard unavailable. Select the text below to copy.'
            : ''}
      </span>

      {status === 'fallback' ? (
        <div className="rounded-lg border-2 border-border bg-surface p-4">
          <Text as="p" variant="small" className="text-muted-foreground">
            Clipboard is blocked on this device. Select the text below and copy it.
          </Text>
          <textarea
            readOnly
            value={fallbackText}
            rows={4}
            className="mt-3 w-full rounded-lg border-2 border-ink bg-background px-4 py-3 text-small font-semibold"
            onFocus={(event) => event.currentTarget.select()}
          />
        </div>
      ) : null}
    </div>
  );
}
