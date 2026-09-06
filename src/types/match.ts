/** Match lifecycle statuses. Must stay in sync with the `match_status` Postgres enum. */
export const MATCH_STATUSES = [
  'countdown',
  'reading',
  'quiz',
  'results',
  'cancelled',
] as const;

export type MatchStatus = (typeof MATCH_STATUSES)[number];

/** Countdown length matches server `race_start_at = now() + 2800ms` and Countdown STEP_MS * 4. */
export const RACE_COUNTDOWN_MS = 2800;
export const RACE_COUNTDOWN_STEP_MS = 700;

/** Client-side views derived from room/match/player/result state. */
export const MATCH_VIEWS = [
  'lobby',
  'countdown',
  'reading',
  'waiting',
  'quiz',
  'quiz_waiting',
  'results',
] as const;

export type MatchView = (typeof MATCH_VIEWS)[number];
