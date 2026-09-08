import { normalizeRoomCode } from '@/lib/roomCode';

/** Configurable invite line — keep concise; avoid aggressive marketing. */
export const INVITE_SHARE_TEXT =
  'Think you can beat my reading score? Same passage. Same quiz. Let’s see who wins.';

export type ShareOutcome = 'win' | 'loss' | 'draw';

export type ResultShareInput = {
  mode: 'solo' | 'match';
  wpm: number;
  comprehension: number;
  score: number;
  /** Opponent effective score — used for loss copy. */
  opponentScore?: number;
  outcome?: ShareOutcome;
  opponentName?: string | null;
  personalBest?: boolean;
};

export type SharePayload = {
  title: string;
  text: string;
  url?: string;
};

export type CopyResult =
  | { ok: true; method: 'clipboard' }
  | { ok: false; method: 'fallback'; reason: string };

export type ShareResult =
  | { ok: true; method: 'native' | 'clipboard' }
  | { ok: false; method: 'fallback' | 'cancelled'; reason?: string };

function origin(): string {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }
  return '';
}

/** Public invite URL — short code only, never a database id. */
export function buildInviteUrl(roomCode: string, baseOrigin = origin()): string {
  const code = normalizeRoomCode(roomCode);
  const root = baseOrigin.replace(/\/$/, '');
  return `${root}/join/${code}`;
}

export function inviteShareMessage(url: string): string {
  return `${INVITE_SHARE_TEXT}\n${url}`;
}

function roundStat(value: number): number {
  return Number.isFinite(value) ? Math.round(value) : 0;
}

/**
 * Converts a finished run into concise share text.
 * Never includes emails, internal ids, or answer selections.
 */
export function resultShareMessage(input: ResultShareInput): string {
  const wpm = roundStat(input.wpm);
  const comprehension = roundStat(input.comprehension);
  const score = roundStat(input.score);
  const opponent = input.opponentName?.trim() || 'my opponent';

  if (input.personalBest) {
    return [
      'I just hit a new personal best:',
      `${wpm} WPM`,
      `${comprehension}% comprehension`,
      `${score} effective score.`,
    ].join('\n');
  }

  if (input.mode === 'match' && input.outcome === 'win') {
    return `I beat ${opponent} with a ${score} effective score (${wpm} WPM, ${comprehension}% comprehension). Can you beat it?`;
  }

  if (input.mode === 'match' && input.outcome === 'loss') {
    const theirScore = roundStat(input.opponentScore ?? input.score);
    return `${opponent} beat me with a ${theirScore} effective score. Think you can do better?`;
  }

  if (input.mode === 'match' && input.outcome === 'draw') {
    return `${opponent} and I tied at ${score}. Same passage. Same quiz. Your move.`;
  }

  return `I hit ${wpm} WPM with ${comprehension}% comprehension.\nEffective score: ${score}.\nCan you beat it?`;
}

export function canUseNativeShare(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.share === 'function';
}

export async function copyText(text: string): Promise<CopyResult> {
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return { ok: true, method: 'clipboard' };
    }
  } catch {
    // Fall through to manual copy UI.
  }
  return {
    ok: false,
    method: 'fallback',
    reason: 'Clipboard is blocked on this device. Select the text below and copy it.',
  };
}

/**
 * Prefer the Web Share API when available; otherwise copy to clipboard.
 * Callers must show fallback UI when method is `fallback`.
 */
export async function shareContent(payload: SharePayload): Promise<ShareResult> {
  const shareData: ShareData = {
    title: payload.title,
    text: payload.text,
  };
  if (payload.url) {
    shareData.url = payload.url;
  }

  if (canUseNativeShare()) {
    try {
      const canShare =
        typeof navigator.canShare !== 'function' || navigator.canShare(shareData);
      if (canShare) {
        await navigator.share(shareData);
        return { ok: true, method: 'native' };
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return { ok: false, method: 'cancelled' };
      }
      // Native share failed — fall through to clipboard.
    }
  }

  const combined = payload.url ? `${payload.text}\n${payload.url}` : payload.text;
  const copied = await copyText(combined);
  if (copied.ok) {
    return { ok: true, method: 'clipboard' };
  }
  return { ok: false, method: 'fallback', reason: copied.reason };
}
