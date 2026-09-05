/** App-level errors for Supabase / database operations. */

export type AppErrorCode =
  | 'SUPABASE_UNAVAILABLE'
  | 'INVALID_ROOM'
  | 'EXPIRED_ROOM'
  | 'DUPLICATE_ROOM_CODE'
  | 'MISSING_PASSAGE'
  | 'DATABASE_TIMEOUT'
  | 'INSERT_FAILED'
  | 'UPDATE_FAILED'
  | 'UNKNOWN';

const USER_MESSAGES: Record<AppErrorCode, string> = {
  SUPABASE_UNAVAILABLE: 'The game service is temporarily unavailable. Try again in a moment.',
  INVALID_ROOM: 'That room could not be found. Check the code and try again.',
  EXPIRED_ROOM: 'This room has expired. Start a new one to keep playing.',
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

/** Map a PostgREST / Supabase client error into a typed AppError. */
export function fromSupabaseError(error: { code?: string; message?: string; details?: string }, fallback: AppErrorCode = 'UNKNOWN'): AppError {
  const message = error.message ?? 'Unknown database error';
  const code = error.code ?? '';

  if (code === '23505' || message.toLowerCase().includes('duplicate')) {
    return new AppError('DUPLICATE_ROOM_CODE', { message, cause: error });
  }

  if (code === '57014' || message.toLowerCase().includes('timeout')) {
    return new AppError('DATABASE_TIMEOUT', { message, cause: error });
  }

  if (code === 'PGRST116' || message.toLowerCase().includes('0 rows')) {
    return new AppError(fallback === 'UNKNOWN' ? 'MISSING_PASSAGE' : fallback, {
      message,
      cause: error,
    });
  }

  return new AppError(fallback, { message, cause: error });
}
