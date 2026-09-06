/**
 * MVP client/server clock offset.
 * offsetMs = serverNow - midpoint(t0, t1)
 * syncedNow() = Date.now() + offsetMs
 */

let offsetMs = 0;

export function getClockOffsetMs(): number {
  return offsetMs;
}

export function setClockOffsetFromServerNow(serverNowIso: string, t0: number, t1: number): number {
  const serverMs = Date.parse(serverNowIso);
  if (Number.isNaN(serverMs)) {
    return offsetMs;
  }
  const midpoint = (t0 + t1) / 2;
  offsetMs = serverMs - midpoint;
  return offsetMs;
}

export function syncedNow(offset: number = offsetMs): number {
  return Date.now() + offset;
}

export function remainingUntil(targetIso: string, offset: number = offsetMs): number {
  const targetMs = Date.parse(targetIso);
  if (Number.isNaN(targetMs)) {
    return 0;
  }
  return targetMs - syncedNow(offset);
}
