import { describe, expect, it } from 'vitest';
import {
  buildInviteUrl,
  inviteShareMessage,
  resultShareMessage,
} from '@/lib/share';

describe('buildInviteUrl', () => {
  it('builds a short /join URL from a room code', () => {
    expect(buildInviteUrl('ab3k', 'https://readit.example')).toBe(
      'https://readit.example/join/AB3K',
    );
  });

  it('never embeds database UUIDs', () => {
    const url = buildInviteUrl('WXYZ', 'https://readit.example');
    expect(url).not.toMatch(
      /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i,
    );
    expect(url).toContain('/join/');
  });
});

describe('inviteShareMessage', () => {
  it('includes a concise invite and the URL', () => {
    const message = inviteShareMessage('https://readit.example/join/AB3K');
    expect(message).toContain('https://readit.example/join/AB3K');
    expect(message.toLowerCase()).toContain('beat');
  });
});

describe('resultShareMessage', () => {
  it('formats a solo result without private fields', () => {
    const message = resultShareMessage({
      mode: 'solo',
      wpm: 347.2,
      comprehension: 80.4,
      score: 278,
    });
    expect(message).toContain('347 WPM');
    expect(message).toContain('80%');
    expect(message).toContain('278');
    expect(message.toLowerCase()).not.toContain('email');
    expect(message).not.toMatch(/player_id|session|uuid/i);
  });

  it('formats a win against an opponent', () => {
    const message = resultShareMessage({
      mode: 'match',
      wpm: 300,
      comprehension: 90,
      score: 270,
      outcome: 'win',
      opponentName: 'Alex',
    });
    expect(message).toContain('Alex');
    expect(message).toContain('270');
    expect(message.toLowerCase()).toContain('beat');
  });

  it('formats a loss with the opponent score', () => {
    const message = resultShareMessage({
      mode: 'match',
      wpm: 250,
      comprehension: 75,
      score: 188,
      opponentScore: 262,
      outcome: 'loss',
      opponentName: 'Alex',
    });
    expect(message).toContain('Alex beat me');
    expect(message).toContain('262');
    expect(message).not.toContain('188');
  });

  it('formats a draw', () => {
    const message = resultShareMessage({
      mode: 'match',
      wpm: 280,
      comprehension: 100,
      score: 280,
      outcome: 'draw',
      opponentName: 'Alex',
    });
    expect(message).toContain('tied');
    expect(message).toContain('280');
  });

  it('formats a personal best', () => {
    const message = resultShareMessage({
      mode: 'solo',
      wpm: 347,
      comprehension: 80,
      score: 278,
      personalBest: true,
    });
    expect(message.toLowerCase()).toContain('personal best');
    expect(message).toContain('347 WPM');
    expect(message).toContain('80%');
    expect(message).toContain('278');
  });
});
