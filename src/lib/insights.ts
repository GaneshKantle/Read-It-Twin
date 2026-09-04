import type { PlayerResult } from '@/types/run';

/**
 * Fixed cut-offs so the same run always reads the same way. Nothing here is
 * generated, guessed or randomised.
 */
const HIGH_WPM = 300;
const LOW_WPM = 180;
const HIGH_COMPREHENSION = 80;
const LOW_COMPREHENSION = 60;
const STRONG_SCORE = 250;
const WEAK_SCORE = 120;

/** At most three lines, or the section stops being a glance. */
const MAX_INSIGHTS = 3;

export interface ResultInsight {
  id: string;
  text: string;
}

/**
 * Factual observations drawn from the numbers already scored. Combination
 * lines win over the two plain ones so a fast-but-shallow run reads as one
 * thought instead of two contradicting compliments.
 */
export function buildInsights(player: PlayerResult, focusLossCount = 0): ResultInsight[] {
  const insights: ResultInsight[] = [];

  const scored = player.totalQuestions > 0;
  const fast = player.wpm >= HIGH_WPM;
  const slow = player.wpm > 0 && player.wpm < LOW_WPM;
  const sharp = scored && player.comprehension >= HIGH_COMPREHENSION;
  const shaky = scored && player.comprehension < LOW_COMPREHENSION;

  if (fast && shaky) {
    insights.push({ id: 'fast-shaky', text: 'Fast read. A few details clearly got away.' });
  } else if (sharp && slow) {
    insights.push({ id: 'slow-sharp', text: 'You took your time, and it paid off.' });
  } else {
    if (fast) {
      insights.push({ id: 'fast', text: 'Your reading speed was seriously fast.' });
    }
    if (sharp) {
      insights.push({ id: 'sharp', text: 'Your comprehension was excellent.' });
    }
  }

  if (!scored) {
    insights.push({ id: 'unscored', text: 'This passage had no questions to score.' });
  } else if (player.finalScore >= STRONG_SCORE) {
    insights.push({ id: 'strong', text: "That's a solid run." });
  } else if (player.finalScore < WEAK_SCORE) {
    insights.push({ id: 'weak', text: 'Not your cleanest run.' });
  }

  if (insights.length === 0) {
    insights.push({ id: 'steady', text: 'A clean read at a steady pace.' });
  }

  if (focusLossCount > 0) {
    const focusInsight: ResultInsight = {
      id: 'focus',
      text:
        focusLossCount === 1
          ? 'You left the tab once during this run.'
          : `You left the tab ${focusLossCount} times during this run.`,
    };

    // Keep the focus note even when the run already earned two other lines.
    return [...insights.slice(0, MAX_INSIGHTS - 1), focusInsight];
  }

  return insights.slice(0, MAX_INSIGHTS);
}
