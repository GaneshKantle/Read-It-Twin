/** App-level errors for Supabase / database operations. */

export type AppErrorCode =
  | 'SUPABASE_UNAVAILABLE'
  | 'INVALID_ROOM'
  | 'EXPIRED_ROOM'
  | 'ROOM_FULL'
  | 'ROOM_CLOSED'
  | 'NOT_HOST'
  | 'PLAYERS_NOT_READY'
  | 'INVALID_SESSION'
  | 'INVALID_NICKNAME'
  | 'DUPLICATE_ROOM_CODE'
  | 'MISSING_PASSAGE'
  | 'DATABASE_TIMEOUT'
  | 'INSERT_FAILED'
  | 'UPDATE_FAILED'
  | 'UNKNOWN';

const USER_MESSAGES: Record<AppErrorCode, string> = {
  SUPABASE_UNAVAILABLE: 'The game service is temporarily unavailable. Try again in a moment.',
  INVALID_ROOM: "This room doesn't exist or may have expired.",
  EXPIRED_ROOM: 'This room has expired. Start a new one to keep playing.',
  ROOM_FULL: 'This race already has two players.',
  ROOM_CLOSED: 'This room is no longer open.',
  NOT_HOST: 'Only the host can start the race.',
  PLAYERS_NOT_READY: 'Both players need to be ready before starting.',
  INVALID_SESSION: 'Your session expired. Rejoin the room to continue.',
  INVALID_NICKNAME: 'Enter a nickname between 1 and 24 characters.',
  DUPLICATE_ROOM_CODE: 'That room code is already in use. Try creating the room again.',
  MISSING_PASSAGE: 'No passage was found for this run. Pick a different setup and try again.',
  DATABASE_TIMEOUT: 'The request took too long. Check your connection and try again.',
  INSERT_FAILED: 'Could not save that change. Please try again.',
  UPDATE_FAILED: 'Could not update that record. Please try again.',
  UNKNOWN: 'Something went wrong. Please try again.',
};

export class AppError extends Error {
  readonly code: AppErrorCode;
  readonly userMessage: string;
  override readonly cause?: unknown;

  constructor(code: AppErrorCode, options?: { message?: string; cause?: unknown }) {
    super(options?.message ?? USER_MESSAGES[code]);
    this.name = 'AppError';
    this.code = code;
    this.userMessage = USER_MESSAGES[code];
    this.cause = options?.cause;
  }
}

export function isAppError(value: unknown): value is AppError {
  return value instanceof AppError;
}

/** Map Postgres / PostgREST errors into typed AppErrors without exposing SQL text. */
export function fromSupabaseError(
  error: { code?: string; message?: string; details?: string },
  fallback: AppErrorCode = 'UNKNOWN',
): AppError {
  const message = error.message ?? 'Unknown database error';
  const code = error.code ?? '';
  const lower = message.toLowerCase();

  if (code === 'P0001' || lower.includes('expired')) {
    return new AppError('EXPIRED_ROOM', { cause: error });
  }
  if (code === 'P0002' || lower.includes('not found')) {
    return new AppError(fallback === 'UNKNOWN' ? 'INVALID_ROOM' : fallback, { cause: error });
  }
  if (code === 'P0003' || lower.includes('room full') || lower.includes('full')) {
    return new AppError('ROOM_FULL', { cause: error });
  }
  if (code === 'P0004' || lower.includes('invalid session') || lower.includes('client id')) {
    return new AppError('INVALID_SESSION', { cause: error });
  }
  if (code === 'P0005' || lower.includes('nickname')) {
    return new AppError('INVALID_NICKNAME', { cause: error });
  }
  if (code === 'P0006' || lower.includes('room closed') || lower.includes('closed')) {
    return new AppError('ROOM_CLOSED', { cause: error });
  }
  if (code === 'P0007' || lower.includes('not host')) {
    return new AppError('NOT_HOST', { cause: error });
  }
  if (code === 'P0008' || lower.includes('not ready')) {
    return new AppError('PLAYERS_NOT_READY', { cause: error });
  }

  if (code === '23505' || lower.includes('duplicate')) {
    return new AppError('DUPLICATE_ROOM_CODE', { cause: error });
  }

  if (code === '57014' || lower.includes('timeout')) {
    return new AppError('DATABASE_TIMEOUT', { cause: error });
  }

  if (code === 'PGRST116' || lower.includes('0 rows')) {
    return new AppError(fallback === 'UNKNOWN' ? 'MISSING_PASSAGE' : fallback, {
      cause: error,
    });
  }

  return new AppError(fallback, { cause: error });
}
