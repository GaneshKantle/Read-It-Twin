import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getClockOffsetMs } from '@/lib/clockSync';
import { matchDebug } from '@/lib/debug/matchDebug';
import { resolveMatchView } from '@/lib/matchView';
import {
  ackRaceStart,
  finishReading,
  getActiveMatchForRoom,
  getLatestCompletedMatchForRoom,
  getLatestMatchForRoom,
  getServerTime,
  startMatch,
  submitMatchQuiz,
} from '@/lib/services/matches';
import { getPassageById } from '@/lib/services/passages';
import {
  getPlayersForRoom,
  joinRoom,
  leaveRoom,
  requestRematch,
  setPlayerReady,
} from '@/lib/services/players';
import { subscribeToRoom } from '@/lib/services/realtime';
import { getMatchResults, getPlayerResultForMatch } from '@/lib/services/results';
import { classifyRoomState, lookupRoomByCode } from '@/lib/services/rooms';
import {
  clearRoomSession,
  getOrCreateClientId,
  getSessionForRoom,
  writeRoomSession,
  type RoomSession,
} from '@/lib/session/playerSession';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { AppError, isAppError } from '@/lib/supabase/errors';
import type { MatchRow, PlayerRow, ResultRow, RoomRow } from '@/types/database';
import type { MatchView } from '@/types/match';
import type { Passage } from '@/types/run';

export type LobbyPhase =
  | 'loading'
  | 'unavailable'
  | 'join'
  | 'lobby'
  | 'racing'
  | 'error';

export type LobbyErrorKind =
  | 'not_found'
  | 'expired'
  | 'closed'
  | 'full'
  | 'host_left'
  | 'opponent_left'
  | 'network';

export type LobbyError = {
  kind: LobbyErrorKind;
  title: string;
  message: string;
  opponentName?: string;
};

const RACE_STATUSES = new Set(['countdown', 'reading', 'quiz', 'results']);

function errorFromAppError(error: AppError): LobbyError {
  switch (error.code) {
    case 'ROOM_FULL':
      return {
        kind: 'full',
        title: 'ROOM FULL',
        message: 'This race already has two players.',
      };
    case 'EXPIRED_ROOM':
      return {
        kind: 'expired',
        title: 'THIS ROOM EXPIRED',
        message: 'This room has expired. Start a new one to keep playing.',
      };
    case 'ROOM_CLOSED':
      return {
        kind: 'closed',
        title: 'ROOM CLOSED',
        message: 'This room is no longer open.',
      };
    case 'INVALID_ROOM':
      return {
        kind: 'not_found',
        title: 'ROOM NOT FOUND',
        message: "This room doesn't exist or may have expired.",
      };
    case 'SUPABASE_UNAVAILABLE':
      return {
        kind: 'network',
        title: 'SERVICE UNAVAILABLE',
        message: error.userMessage,
      };
    default:
      return {
        kind: 'network',
        title: 'SOMETHING WENT WRONG',
        message: error.userMessage,
      };
  }
}

function toAppError(error: unknown): AppError {
  if (isAppError(error)) {
    return error;
  }
  return new AppError('UNKNOWN', { cause: error });
}

function isRaceStatus(status: string | undefined | null): boolean {
  return Boolean(status && RACE_STATUSES.has(status));
}

export function useRoomLobby(roomCodeParam: string) {
  const roomCode = roomCodeParam.trim().toUpperCase();

  const [phase, setPhase] = useState<LobbyPhase>('loading');
  const [room, setRoom] = useState<RoomRow | null>(null);
  const [players, setPlayers] = useState<PlayerRow[]>([]);
  const [session, setSession] = useState<RoomSession | null>(null);
  const [match, setMatch] = useState<MatchRow | null>(null);
  const [passage, setPassage] = useState<Passage | null>(null);
  const [ownResult, setOwnResult] = useState<ResultRow | null>(null);
  const [matchResults, setMatchResults] = useState<ResultRow[]>([]);
  const [clockOffsetMs, setClockOffsetMs] = useState(0);
  const [error, setError] = useState<LobbyError | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pending, setPending] = useState({
    join: false,
    ready: false,
    start: false,
    leave: false,
    finish: false,
    quiz: false,
    rematch: false,
  });
  const [leftOpponentName, setLeftOpponentName] = useState<string | null>(null);
  const [focusLossCount, setFocusLossCount] = useState(0);
  const [passageLoading, setPassageLoading] = useState(false);

  const sessionRef = useRef<RoomSession | null>(null);
  const playersRef = useRef<PlayerRow[]>([]);
  const roomRef = useRef<RoomRow | null>(null);
  const matchRef = useRef<MatchRow | null>(null);
  const refreshingRef = useRef(false);
  const ackSentRef = useRef<string | null>(null);
  const passageIdRef = useRef<string | null>(null);

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  useEffect(() => {
    playersRef.current = players;
  }, [players]);

  useEffect(() => {
    roomRef.current = room;
  }, [room]);

  useEffect(() => {
    matchRef.current = match;
  }, [match]);

  const syncClockOffset = useCallback(() => {
    setClockOffsetMs(getClockOffsetMs());
  }, []);

  const loadPassageForMatch = useCallback(async (nextMatch: MatchRow | null) => {
    const passageId = nextMatch?.passage_id ?? null;
    if (!passageId) {
      setPassage(null);
      passageIdRef.current = null;
      return;
    }
    if (passageIdRef.current === passageId) {
      return;
    }
    setPassageLoading(true);
    try {
      const loaded = await getPassageById(passageId);
      passageIdRef.current = passageId;
      setPassage(loaded);
    } catch (err) {
      const appError = toAppError(err);
      setActionError(appError.userMessage);
    } finally {
      setPassageLoading(false);
    }
  }, []);

  const loadPassageById = useCallback(async (passageId: string | null) => {
    if (!passageId) {
      setPassage(null);
      passageIdRef.current = null;
      return;
    }
    if (passageIdRef.current === passageId) {
      return;
    }
    setPassageLoading(true);
    try {
      const loaded = await getPassageById(passageId);
      passageIdRef.current = passageId;
      setPassage(loaded);
    } catch (err) {
      const appError = toAppError(err);
      setActionError(appError.userMessage);
    } finally {
      setPassageLoading(false);
    }
  }, []);

  /** Pick the match row that belongs to the current room lifecycle. */
  const resolveMatchForRoomStatus = useCallback(async (nextRoom: RoomRow) => {
    if (nextRoom.status === 'results' || nextRoom.status === 'closed') {
      return (
        (await getLatestCompletedMatchForRoom(nextRoom.id)) ??
        (await getLatestMatchForRoom(nextRoom.id))
      );
    }
    if (isRaceStatus(nextRoom.status)) {
      return (
        (await getActiveMatchForRoom(nextRoom.id)) ??
        (await getLatestMatchForRoom(nextRoom.id))
      );
    }
    // Lobby (waiting/ready), including post-rematch: no active race.
    return getActiveMatchForRoom(nextRoom.id);
  }, []);

  const loadOwnResult = useCallback(async (matchId: string, playerId: string) => {
    const result = await getPlayerResultForMatch(matchId, playerId);
    setOwnResult(result);
    return result;
  }, []);

  const loadAllResults = useCallback(async (matchId: string) => {
    const rows = await getMatchResults(matchId);
    setMatchResults(rows);
    return rows;
  }, []);

  const refreshPlayers = useCallback(async (roomId: string) => {
    const next = await getPlayersForRoom(roomId);
    const currentSession = sessionRef.current;
    const previous = playersRef.current;

    if (currentSession && previous.length === 2 && next.length === 1) {
      const remaining = next[0];
      if (remaining.id === currentSession.playerId) {
        const gone = previous.find((player) => player.id !== currentSession.playerId);
        if (gone) {
          setLeftOpponentName(gone.nickname);
        }
      }
    }

    if (next.length === 2) {
      setLeftOpponentName(null);
    }

    setPlayers(next);

    const currentRoom = roomRef.current;
    if (
      currentSession &&
      currentRoom &&
      !isRaceStatus(currentRoom.status) &&
      !next.some((player) => player.id === currentSession.playerId)
    ) {
      clearRoomSession();
      setSession(null);
      if (currentRoom.status === 'closed' || currentRoom.host_player_id === currentSession.playerId) {
        setError({
          kind: 'host_left',
          title: 'THE HOST LEFT',
          message: 'The host left the room, so this race was closed.',
        });
      } else {
        setError({
          kind: 'closed',
          title: 'ROOM CLOSED',
          message: 'You are no longer in this room.',
        });
      }
      setPhase('error');
    }

    return next;
  }, []);

  const applyRoomPhase = useCallback((nextRoom: RoomRow) => {
    if (isRaceStatus(nextRoom.status)) {
      setPhase((current) => (current === 'error' ? current : 'racing'));
    } else if (nextRoom.status === 'closed') {
      const currentMatch = matchRef.current;
      if (currentMatch?.status === 'results' || currentMatch?.completed_at) {
        setPhase((current) => (current === 'error' ? current : 'racing'));
      }
    } else if (nextRoom.status === 'waiting' || nextRoom.status === 'ready') {
      setPhase((current) =>
        current === 'error' || current === 'join' || current === 'loading' ? current : 'lobby',
      );
    }
  }, []);

  const refreshSnapshot = useCallback(async () => {
    const currentRoom = roomRef.current;
    if (!currentRoom || refreshingRef.current) {
      return;
    }
    refreshingRef.current = true;
    try {
      await getServerTime().catch(() => undefined);
      syncClockOffset();

      const lookup = await lookupRoomByCode(currentRoom.room_code);
      if (lookup.state === 'missing' || !lookup.room) {
        clearRoomSession();
        setError({
          kind: 'not_found',
          title: 'ROOM NOT FOUND',
          message: "This room doesn't exist or may have expired.",
        });
        setPhase('error');
        return;
      }

      setRoom(lookup.room);
      roomRef.current = lookup.room;

      if (lookup.state === 'expired') {
        clearRoomSession();
        setError({
          kind: 'expired',
          title: 'THIS ROOM EXPIRED',
          message: 'This room has expired. Start a new one to keep playing.',
        });
        setPhase('error');
        return;
      }

      if (lookup.state === 'closed' && lookup.room.status === 'closed') {
        const currentSession = sessionRef.current;
        const isHost =
          currentSession && lookup.room.host_player_id === currentSession.playerId;
        // Mid-race close is unusual; still surface it
        if (!isRaceStatus(lookup.room.status)) {
          clearRoomSession();
          setError({
            kind: isHost ? 'closed' : 'host_left',
            title: isHost ? 'ROOM CLOSED' : 'THE HOST LEFT',
            message: isHost
              ? 'This room is no longer open.'
              : 'The host left the room, so this race was closed.',
          });
          setPhase('error');
          return;
        }
      }

      await refreshPlayers(lookup.room.id);

      if (lookup.room.status === 'waiting' || lookup.room.status === 'ready') {
        const active = await getActiveMatchForRoom(lookup.room.id);
        setMatch(active);
        matchRef.current = active;
        setOwnResult(null);
        setMatchResults([]);
        await loadPassageById(lookup.room.passage_id);
        applyRoomPhase(lookup.room);
      } else if (isRaceStatus(lookup.room.status) || lookup.room.status === 'closed') {
        const latest = await resolveMatchForRoomStatus(lookup.room);
        setMatch(latest);
        matchRef.current = latest;
        await loadPassageForMatch(latest);

        const currentSession = sessionRef.current;
        if (latest && currentSession) {
          const mine = await loadOwnResult(latest.id, currentSession.playerId);
          if (
            lookup.room.status === 'results' ||
            lookup.room.status === 'closed' ||
            latest.status === 'results'
          ) {
            await loadAllResults(latest.id);
          } else if (mine) {
            setMatchResults((prev) =>
              prev.some((row) => row.id === mine.id) ? prev : [...prev, mine],
            );
          }
        }

        applyRoomPhase(lookup.room);
      } else {
        setMatch(null);
        matchRef.current = null;
        applyRoomPhase(lookup.room);
      }
    } catch (err) {
      const appError = toAppError(err);
      setActionError(appError.userMessage);
    } finally {
      refreshingRef.current = false;
    }
  }, [
    applyRoomPhase,
    loadAllResults,
    loadOwnResult,
    loadPassageById,
    loadPassageForMatch,
    refreshPlayers,
    resolveMatchForRoomStatus,
    syncClockOffset,
  ]);

  // Initial load
  useEffect(() => {
    let cancelled = false;

    async function boot() {
      if (!isSupabaseConfigured()) {
        setPhase('unavailable');
        setError({
          kind: 'network',
          title: 'SERVICE UNAVAILABLE',
          message: new AppError('SUPABASE_UNAVAILABLE').userMessage,
        });
        return;
      }

      if (!roomCode) {
        setError({
          kind: 'not_found',
          title: 'ROOM NOT FOUND',
          message: "This room doesn't exist or may have expired.",
        });
        setPhase('error');
        return;
      }

      setPhase('loading');
      setError(null);
      setActionError(null);

      try {
        await getServerTime().catch(() => undefined);
        if (!cancelled) {
          syncClockOffset();
        }

        const lookup = await lookupRoomByCode(roomCode);
        if (cancelled) {
          return;
        }

        if (lookup.state === 'missing' || !lookup.room) {
          setError({
            kind: 'not_found',
            title: 'ROOM NOT FOUND',
            message: "This room doesn't exist or may have expired.",
          });
          setPhase('error');
          return;
        }

        setRoom(lookup.room);

        if (lookup.state === 'expired') {
          setError({
            kind: 'expired',
            title: 'THIS ROOM EXPIRED',
            message: 'This room has expired. Start a new one to keep playing.',
          });
          setPhase('error');
          return;
        }

        if (lookup.state === 'closed' && !isRaceStatus(lookup.room.status)) {
          const existingForClosed = getSessionForRoom(roomCode);
          const closedPlayers = await getPlayersForRoom(lookup.room.id);
          if (
            existingForClosed &&
            closedPlayers.some((player) => player.id === existingForClosed.playerId)
          ) {
            const completed = await getLatestCompletedMatchForRoom(lookup.room.id);
            if (completed) {
              setPlayers(closedPlayers);
              setSession(existingForClosed);
              setMatch(completed);
              matchRef.current = completed;
              await loadPassageForMatch(completed);
              await loadOwnResult(completed.id, existingForClosed.playerId);
              await loadAllResults(completed.id);
              setPhase('racing');
              return;
            }
          }
          setError({
            kind: 'closed',
            title: 'ROOM CLOSED',
            message: 'This room is no longer open.',
          });
          setPhase('error');
          return;
        }

        const existing = getSessionForRoom(roomCode);
        const playerList = await getPlayersForRoom(lookup.room.id);
        if (cancelled) {
          return;
        }
        setPlayers(playerList);

        if (existing && playerList.some((player) => player.id === existing.playerId)) {
          setSession(existing);

          if (isRaceStatus(lookup.room.status)) {
            const latest = await resolveMatchForRoomStatus(lookup.room);
            if (!cancelled) {
              setMatch(latest);
              matchRef.current = latest;
              await loadPassageForMatch(latest);
              if (latest) {
                await loadOwnResult(latest.id, existing.playerId);
                if (lookup.room.status === 'results') {
                  await loadAllResults(latest.id);
                }
              }
              setPhase('racing');
            }
            return;
          }

          if (lookup.room.status === 'waiting' || lookup.room.status === 'ready') {
            setMatch(null);
            matchRef.current = null;
            setOwnResult(null);
            setMatchResults([]);
            await loadPassageById(lookup.room.passage_id);
            setPhase('lobby');
            return;
          }

          setPhase('lobby');
          return;
        }

        if (existing) {
          clearRoomSession();
        }

        if (isRaceStatus(lookup.room.status)) {
          setError({
            kind: 'full',
            title: 'RACE IN PROGRESS',
            message: 'This race has already started. Ask the host for a new invite.',
          });
          setPhase('error');
          return;
        }

        if (playerList.length >= 2) {
          setError({
            kind: 'full',
            title: 'ROOM FULL',
            message: 'This race already has two players.',
          });
          setPhase('error');
          return;
        }

        setPhase('join');
      } catch (err) {
        if (cancelled) {
          return;
        }
        const appError = toAppError(err);
        setError(errorFromAppError(appError));
        setPhase('error');
      }
    }

    void boot();
    return () => {
      cancelled = true;
    };
  }, [
    loadAllResults,
    loadOwnResult,
    loadPassageById,
    loadPassageForMatch,
    resolveMatchForRoomStatus,
    roomCode,
    syncClockOffset,
  ]);

  // Realtime while in lobby or racing
  useEffect(() => {
    if ((phase !== 'lobby' && phase !== 'racing') || !room) {
      return;
    }

    const unsubscribe = subscribeToRoom(room.id, {
      onRoomChange: (nextRoom) => {
        const previousStatus = roomRef.current?.status;
        setRoom(nextRoom);
        roomRef.current = nextRoom;
        if (classifyRoomState(nextRoom) === 'expired') {
          clearRoomSession();
          setError({
            kind: 'expired',
            title: 'THIS ROOM EXPIRED',
            message: 'This room has expired. Start a new one to keep playing.',
          });
          setPhase('error');
          return;
        }

        // Rematch both-ready: return to lobby with a fresh passage.
        if (
          (previousStatus === 'results' || isRaceStatus(previousStatus)) &&
          (nextRoom.status === 'waiting' || nextRoom.status === 'ready')
        ) {
          setOwnResult(null);
          setMatchResults([]);
          setMatch(null);
          matchRef.current = null;
          ackSentRef.current = null;
          setFocusLossCount(0);
          setPhase('lobby');
          void loadPassageById(nextRoom.passage_id);
          void refreshPlayers(nextRoom.id);
          return;
        }

        // Opponent left after results — keep the results screen.
        if (nextRoom.status === 'closed') {
          const currentMatch = matchRef.current;
          if (currentMatch?.status === 'results' || currentMatch?.completed_at) {
            void refreshPlayers(nextRoom.id);
            setPhase('racing');
            return;
          }
          clearRoomSession();
          setError({
            kind: 'host_left',
            title: 'THE HOST LEFT',
            message: 'The host left the room, so this race was closed.',
          });
          setPhase('error');
          return;
        }

        void refreshPlayers(nextRoom.id);
        if (isRaceStatus(nextRoom.status)) {
          setPhase('racing');
          void resolveMatchForRoomStatus(nextRoom).then(async (latest) => {
            setMatch(latest);
            matchRef.current = latest;
            await loadPassageForMatch(latest);
            const currentSession = sessionRef.current;
            if (latest && currentSession) {
              await loadOwnResult(latest.id, currentSession.playerId);
              if (nextRoom.status === 'results') {
                await loadAllResults(latest.id);
              }
            }
          });
        } else if (nextRoom.status === 'waiting' || nextRoom.status === 'ready') {
          setPhase((current) =>
            current === 'error' || current === 'join' || current === 'loading' ? current : 'lobby',
          );
        }
      },
      onMatchChange: (nextMatch) => {
        setMatch((prev) => {
          if (
            prev?.id === nextMatch.id &&
            prev.status === nextMatch.status &&
            prev.race_start_at === nextMatch.race_start_at &&
            prev.winner_player_id === nextMatch.winner_player_id &&
            prev.completed_at === nextMatch.completed_at
          ) {
            return prev;
          }
          return {
            ...nextMatch,
            winner_player_id: nextMatch.winner_player_id ?? null,
          };
        });
        matchRef.current = {
          ...nextMatch,
          winner_player_id: nextMatch.winner_player_id ?? null,
        };
        void loadPassageForMatch(nextMatch);
        if (nextMatch.status === 'results') {
          void loadAllResults(nextMatch.id);
        }
        const currentSession = sessionRef.current;
        if (currentSession && (nextMatch.status === 'quiz' || nextMatch.status === 'results')) {
          void loadOwnResult(nextMatch.id, currentSession.playerId);
        }
      },
      onPlayersChange: () => {
        void refreshSnapshot();
      },
      onSubscribed: () => {
        void refreshSnapshot();
      },
      onError: () => {
        void refreshSnapshot();
      },
    });

    return unsubscribe;
  }, [
    loadAllResults,
    loadOwnResult,
    loadPassageById,
    loadPassageForMatch,
    phase,
    refreshPlayers,
    refreshSnapshot,
    resolveMatchForRoomStatus,
    room?.id,
  ]);

  const hostPlayer = players.find((player) => player.id === room?.host_player_id) ?? players[0] ?? null;
  const selfPlayer = session ? players.find((player) => player.id === session.playerId) ?? null : null;
  const opponent = session
    ? players.find((player) => player.id !== session.playerId) ?? null
    : players.find((player) => player.id !== hostPlayer?.id) ?? null;

  const isHost = Boolean(session && room?.host_player_id === session.playerId);
  const bothReady = players.length === 2 && players.every((player) => player.ready);
  const canToggleReady =
    Boolean(session && selfPlayer) &&
    room != null &&
    (room.status === 'waiting' || room.status === 'ready');
  const canStart =
    isHost &&
    bothReady &&
    room != null &&
    (room.status === 'waiting' || room.status === 'ready') &&
    !pending.start;
  const matchStarted = isRaceStatus(room?.status);

  const matchView: MatchView = useMemo(
    () =>
      resolveMatchView({
        room,
        match,
        selfPlayer,
        ownResult,
        clockOffsetMs,
      }),
    [clockOffsetMs, match, ownResult, room, selfPlayer],
  );

  useEffect(() => {
    matchDebug('view', {
      roomId: room?.id,
      matchId: match?.id,
      playerId: session?.playerId,
      matchState: match?.status,
      roomState: room?.status,
      raceStartAt: match?.race_start_at,
      offsetMs: clockOffsetMs,
      view: matchView,
    });
  }, [clockOffsetMs, match, matchView, room, session?.playerId]);

  // Promote countdown → reading once race_start_at has passed
  useEffect(() => {
    if (phase !== 'racing' || !session || !room || !match?.race_start_at) {
      return;
    }
    if (room.status !== 'countdown' && match.status !== 'countdown') {
      return;
    }

    const key = `${match.id}:${match.race_start_at}`;
    const remaining = Date.parse(match.race_start_at) - (Date.now() + clockOffsetMs);
    if (remaining > 0) {
      const timeout = window.setTimeout(() => {
        if (ackSentRef.current === key) {
          return;
        }
        ackSentRef.current = key;
        void ackRaceStart(room.id, session.playerId, session.sessionToken)
          .then((result) => {
            setRoom(result.room);
            setMatch(result.match);
            syncClockOffset();
          })
          .catch(() => {
            ackSentRef.current = null;
          });
      }, remaining + 20);
      return () => window.clearTimeout(timeout);
    }

    if (ackSentRef.current === key) {
      return;
    }
    ackSentRef.current = key;
    void ackRaceStart(room.id, session.playerId, session.sessionToken)
      .then((result) => {
        setRoom(result.room);
        setMatch(result.match);
        syncClockOffset();
      })
      .catch(() => {
        ackSentRef.current = null;
      });
  }, [clockOffsetMs, match, phase, room, session, syncClockOffset]);

  const handleJoin = useCallback(
    async (nickname: string) => {
      if (pending.join || !room) {
        return;
      }
      setPending((prev) => ({ ...prev, join: true }));
      setActionError(null);
      try {
        const clientId = getOrCreateClientId();
        const result = await joinRoom(room.room_code, nickname, clientId);
        const nextSession: RoomSession = {
          roomCode: result.room.room_code,
          roomId: result.room.id,
          playerId: result.player.id,
          sessionToken: result.session_token,
        };
        writeRoomSession(nextSession);
        setSession(nextSession);
        setRoom(result.room);
        await refreshPlayers(result.room.id);
        setLeftOpponentName(null);
        setPhase('lobby');
      } catch (err) {
        const appError = toAppError(err);
        if (
          appError.code === 'ROOM_FULL' ||
          appError.code === 'EXPIRED_ROOM' ||
          appError.code === 'ROOM_CLOSED' ||
          appError.code === 'INVALID_ROOM'
        ) {
          setError(errorFromAppError(appError));
          setPhase('error');
        } else {
          setActionError(appError.userMessage);
        }
      } finally {
        setPending((prev) => ({ ...prev, join: false }));
      }
    },
    [pending.join, refreshPlayers, room],
  );

  const handleToggleReady = useCallback(async () => {
    const current = sessionRef.current;
    const self = selfPlayer;
    if (!current || !self || !canToggleReady || pending.ready) {
      return;
    }
    setPending((prev) => ({ ...prev, ready: true }));
    setActionError(null);
    try {
      const result = await setPlayerReady(current.playerId, current.sessionToken, !self.ready);
      setRoom(result.room);
      await refreshPlayers(result.room.id);
    } catch (err) {
      const appError = toAppError(err);
      setActionError(appError.userMessage);
    } finally {
      setPending((prev) => ({ ...prev, ready: false }));
    }
  }, [canToggleReady, pending.ready, refreshPlayers, selfPlayer]);

  const handleStart = useCallback(async () => {
    const current = sessionRef.current;
    if (!current || !canStart || !room) {
      return;
    }
    setPending((prev) => ({ ...prev, start: true }));
    setActionError(null);
    try {
      const result = await startMatch(room.id, current.playerId, current.sessionToken);
      setRoom(result.room);
      setMatch(result.match);
      syncClockOffset();
      await loadPassageForMatch(result.match);
      setOwnResult(null);
      setMatchResults([]);
      setFocusLossCount(0);
      ackSentRef.current = null;
      setPhase('racing');
      await refreshPlayers(result.room.id);
    } catch (err) {
      const appError = toAppError(err);
      setActionError(appError.userMessage);
    } finally {
      setPending((prev) => ({ ...prev, start: false }));
    }
  }, [canStart, loadPassageForMatch, refreshPlayers, room, syncClockOffset]);

  const handleLeave = useCallback(async () => {
    const current = sessionRef.current;
    if (!current || pending.leave) {
      return;
    }
    setPending((prev) => ({ ...prev, leave: true }));
    try {
      const currentRoom = roomRef.current;
      // Mid-race (countdown/reading/quiz): keep server seat for refresh recovery.
      if (
        currentRoom &&
        (currentRoom.status === 'countdown' ||
          currentRoom.status === 'reading' ||
          currentRoom.status === 'quiz')
      ) {
        // Navigating home mid-race keeps session for refresh recovery
      } else {
        // Lobby or results: end the seat/session on the server.
        await leaveRoom(current.playerId, current.sessionToken);
        clearRoomSession();
        setSession(null);
      }
    } catch {
      if (
        roomRef.current?.status !== 'countdown' &&
        roomRef.current?.status !== 'reading' &&
        roomRef.current?.status !== 'quiz'
      ) {
        clearRoomSession();
        setSession(null);
      }
    } finally {
      setPending((prev) => ({ ...prev, leave: false }));
    }
  }, [pending.leave]);

  const handleRequestRematch = useCallback(async () => {
    const current = sessionRef.current;
    if (!current || pending.rematch) {
      return;
    }
    setPending((prev) => ({ ...prev, rematch: true }));
    setActionError(null);
    try {
      const result = await requestRematch(current.playerId, current.sessionToken);
      setRoom(result.room);
      roomRef.current = result.room;
      setPlayers(result.players);

      if (result.rematch_ready || result.room.status === 'waiting' || result.room.status === 'ready') {
        setOwnResult(null);
        setMatchResults([]);
        setMatch(null);
        matchRef.current = null;
        ackSentRef.current = null;
        setFocusLossCount(0);
        setPhase('lobby');
        await loadPassageById(result.room.passage_id);
      }
    } catch (err) {
      const appError = toAppError(err);
      setActionError(appError.userMessage);
    } finally {
      setPending((prev) => ({ ...prev, rematch: false }));
    }
  }, [loadPassageById, pending.rematch]);

  const handleFinishReading = useCallback(async () => {
    const current = sessionRef.current;
    const currentMatch = matchRef.current;
    if (!current || !currentMatch || pending.finish || selfPlayer?.finished) {
      return;
    }
    setPending((prev) => ({ ...prev, finish: true }));
    setActionError(null);
    try {
      const result = await finishReading(
        currentMatch.id,
        current.playerId,
        current.sessionToken,
      );
      setRoom(result.room);
      setMatch(result.match);
      syncClockOffset();
      await refreshPlayers(result.room.id);
    } catch (err) {
      const appError = toAppError(err);
      setActionError(appError.userMessage);
    } finally {
      setPending((prev) => ({ ...prev, finish: false }));
    }
  }, [pending.finish, refreshPlayers, selfPlayer?.finished, syncClockOffset]);

  const handleSubmitQuiz = useCallback(
    async (answers: { questionId: string; selectedIndex: number | null }[]) => {
      const current = sessionRef.current;
      const currentMatch = matchRef.current;
      if (!current || !currentMatch || pending.quiz || ownResult) {
        return ownResult;
      }
      setPending((prev) => ({ ...prev, quiz: true }));
      setActionError(null);
      try {
        const result = await submitMatchQuiz(
          currentMatch.id,
          current.playerId,
          current.sessionToken,
          answers,
        );
        setRoom(result.room);
        setMatch(result.match);
        setOwnResult(result.result);
        syncClockOffset();
        await refreshPlayers(result.room.id);
        if (result.room.status === 'results' || result.match?.status === 'results') {
          await loadAllResults(currentMatch.id);
        }
        return result.result;
      } catch (err) {
        const appError = toAppError(err);
        setActionError(appError.userMessage);
        throw appError;
      } finally {
        setPending((prev) => ({ ...prev, quiz: false }));
      }
    },
    [loadAllResults, ownResult, pending.quiz, refreshPlayers, syncClockOffset],
  );

  const registerFocusLoss = useCallback(() => {
    setFocusLossCount((count) => count + 1);
  }, []);

  const dismissOpponentLeft = useCallback(() => {
    setLeftOpponentName(null);
  }, []);

  const handleCountdownComplete = useCallback(() => {
    const current = sessionRef.current;
    const currentRoom = roomRef.current;
    const currentMatch = matchRef.current;
    if (!current || !currentRoom || !currentMatch) {
      return;
    }
    const key = `${currentMatch.id}:ack`;
    if (ackSentRef.current === key) {
      return;
    }
    ackSentRef.current = key;
    void ackRaceStart(currentRoom.id, current.playerId, current.sessionToken)
      .then((result) => {
        setRoom(result.room);
        setMatch(result.match);
        syncClockOffset();
      })
      .catch(() => {
        ackSentRef.current = null;
      });
  }, [syncClockOffset]);

  return {
    roomCode,
    phase,
    room,
    players,
    session,
    match,
    passage,
    passageLoading,
    ownResult,
    matchResults,
    matchView,
    clockOffsetMs,
    focusLossCount,
    error,
    actionError,
    pending,
    hostPlayer,
    selfPlayer,
    opponent,
    isHost,
    bothReady,
    canToggleReady,
    canStart,
    matchStarted,
    leftOpponentName,
    handleJoin,
    handleToggleReady,
    handleStart,
    handleLeave,
    handleRequestRematch,
    handleFinishReading,
    handleSubmitQuiz,
    handleCountdownComplete,
    registerFocusLoss,
    dismissOpponentLeft,
  };
}
