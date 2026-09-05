/** Room lifecycle statuses. Must stay in sync with the `room_status` Postgres enum. */
export const ROOM_STATUSES = [
  'waiting',
  'ready',
  'countdown',
  'reading',
  'quiz',
  'results',
  'closed',
] as const;

export type RoomStatus = (typeof ROOM_STATUSES)[number];

/** Default room lifetime from creation (matches DB default). */
export const ROOM_TTL_HOURS = 24;
