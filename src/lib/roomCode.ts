/** Room invite codes: 4 chars from a confusion-safe alphabet (no O/0 I/1 S/5). */
export const ROOM_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export const ROOM_CODE_LENGTH = 4;
export const ROOM_CODE_PATTERN = /^[A-Z0-9]{4,8}$/;

export function normalizeRoomCode(value: string): string {
  return value.trim().toUpperCase();
}

export function isValidRoomCode(value: string): boolean {
  const code = normalizeRoomCode(value);
  if (!ROOM_CODE_PATTERN.test(code)) {
    return false;
  }
  // Product codes are 4 characters from the safe alphabet.
  if (code.length === ROOM_CODE_LENGTH) {
    return [...code].every((char) => ROOM_CODE_ALPHABET.includes(char));
  }
  return code.length >= 4 && code.length <= 8;
}
