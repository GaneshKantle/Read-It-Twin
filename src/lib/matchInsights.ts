import type { MatchPlayerResult, ResultComparison } from '@/types/run';

export interface MatchInsight {
  id: string;
  text: string;
}

/**
 * Deterministic head-to-head copy. Only claims that the signed diffs support.
 * Viewed from `self` vs `opponent` (self is always playerA in the comparison).
 */
export function buildMatchInsights(
  _self: MatchPlayerResult,
  opponent: MatchPlayerResult,
  comparison: ResultComparison,
): MatchInsight[] {
  const insights: MatchInsight[] = [];
  const name = opponent.nickname || 'Your opponent';
  const faster = comparison.wpmDifference > 0;
  const slower = comparison.wpmDifference < 0;
  const betterComp = comparison.comprehensionDifference > 0;
  const worseComp = comparison.comprehensionDifference < 0;
  const won = comparison.winner === 'playerA';
  const lost = comparison.winner === 'playerB';
  const draw = comparison.isDraw;

  if (draw) {
    if (comparison.wpmDifference === 0 && comparison.comprehensionDifference === 0) {
      insights.push({ id: 'draw-same', text: 'Same effective score.' });
    } else if (faster && worseComp) {
      insights.push({
        id: 'draw-split',
        text: `You were faster. ${name} had stronger comprehension. The final score was identical.`,
      });
    } else if (slower && betterComp) {
      insights.push({
        id: 'draw-split-flip',
        text: `${name} was faster. You had stronger comprehension. The final score was identical.`,
      });
    } else {
      insights.push({ id: 'draw-even', text: 'Different strengths. Same final score.' });
    }
    return insights;
  }

  if (won) {
    if (faster && comparison.scoreDifference > 0) {
      if (worseComp) {
        insights.push({
          id: 'win-speed-over-comp',
          text: 'Your speed advantage was enough to overcome the comprehension gap.',
        });
      } else {
        insights.push({
          id: 'win-fast-score',
          text: 'You were faster and finished with the higher score.',
        });
      }
    } else if (slower && betterComp) {
      insights.push({
        id: 'win-comp-over-speed',
        text: 'You read slower, but stronger comprehension pushed your score ahead.',
      });
    } else if (faster && worseComp) {
      insights.push({
        id: 'win-speed-over-comp',
        text: 'Your speed advantage was enough to overcome the comprehension gap.',
      });
    } else {
      insights.push({
        id: 'win-score',
        text: 'You finished with the higher score.',
      });
    }
  }

  if (lost) {
    if (faster && worseComp) {
      insights.push({
        id: 'loss-fast-weak-comp',
        text: `You were faster, but ${name}'s comprehension advantage won the matchup.`,
      });
    } else {
      insights.push({
        id: 'loss-score',
        text: `${name} scored ${Math.abs(Math.round(comparison.scoreDifference))} points higher.`,
      });
    }
  }

  return insights;
}

/** Signed whole-number stats for the comparison strip. */
export function formatSignedStat(value: number, suffix: string): string {
  const rounded = Math.round(value);
  const sign = rounded > 0 ? '+' : '';
  return `${sign}${rounded}${suffix}`;
}

export function formatSignedComprehensionPoints(value: number): string {
  const rounded = Math.round(value);
  const sign = rounded > 0 ? '+' : '';
  return `${sign}${rounded}% comprehension`;
}
