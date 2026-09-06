import { useCallback, useEffect, useRef, useState } from 'react';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { AppError, isAppError } from '@/lib/supabase/errors';
import {
  clearRoomSession,
  getOrCreateClientId,
  getSessionForRoom,
  writeRoomSession,
  type RoomSession,
} from '@/lib/session/playerSession';
import { getLatestMatchForRoom, startMatch } from '@/lib/services/matches';
import { getPlayersForRoom, joinRoom, leaveRoom, setPlayerReady } from '@/lib/services/players';
import { subscribeToRoom } from '@/lib/services/realtime';
import { classifyRoomState, lookupRoomByCode } from '@/lib/services/rooms';
import type { MatchRow, PlayerRow, RoomRow } from '@/types/database';

export type LobbyPhase =
  | 'loading'
  | 'unavailable'
  | 'join'
  | 'lobby'
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

export function useRoomLobby(roomCodeParam: string) {
  const roomCode = roomCodeParam.trim().toUpperCase();

  const [phase, setPhase] = useState<LobbyPhase>('loading');
  const [room, setRoom] = useState<RoomRow | null>(null);
  const [players, setPlayers] = useState<PlayerRow[]>([]);
  const [session, setSession] = useState<RoomSession | null>(null);
  const [match, setMatch] = useState<MatchRow | null>(null);
  const [error, setError] = useState<LobbyError | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pending, setPending] = useState({
    join: false,
    ready: false,
    start: false,
    leave: false,
  });
  const [leftOpponentName, setLeftOpponentName] = useState<string | null>(null);

  const sessionRef = useRef<RoomSession | null>(null);
  const playersRef = useRef<PlayerRow[]>([]);
  const roomRef = useRef<RoomRow | null>(null);
  const refreshingRef = useRef(false);

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  useEffect(() => {
    playersRef.current = players;
  }, [players]);

  useEffect(() => {
    roomRef.current = room;
  }, [room]);

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
    if (currentSession && currentRoom && !next.some((player) => player.id === currentSession.playerId)) {
      // Our player row disappeared (host closed / we were removed)
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
  }, []);

  const refreshSnapshot = useCallback(async () => {
    const currentRoom = roomRef.current;
    if (!currentRoom || refreshingRef.current) {
      return;
    }
    refreshingRef.current = true;
    try {
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

      await refreshPlayers(lookup.room.id);

      if (lookup.room.status === 'countdown' || lookup.room.passage_id) {
        const latest = await getLatestMatchForRoom(lookup.room.id);
        setMatch(latest);
      }
    } catch (err) {
      const appError = toAppError(err);
      setActionError(appError.userMessage);
    } finally {
      refreshingRef.current = false;
    }
  }, [refreshPlayers]);

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

        if (lookup.state === 'closed') {
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
          setPhase('lobby');
          if (lookup.room.status === 'countdown') {
            const latest = await getLatestMatchForRoom(lookup.room.id);
            if (!cancelled) {
              setMatch(latest);
            }
          }
          return;
        }

        if (existing) {
          clearRoomSession();
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
  }, [roomCode]);

  // Realtime subscription while in lobby
  useEffect(() => {
    if (phase !== 'lobby' || !room) {
      return;
    }

    const unsubscribe = subscribeToRoom(room.id, {
      onRoomChange: (nextRoom) => {
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
        if (nextRoom.status === 'closed') {
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
        if (nextRoom.status === 'countdown') {
          void getLatestMatchForRoom(nextRoom.id).then(setMatch);
        }
      },
      onPlayersChange: () => {
        void refreshSnapshot();
      },
    });

    return unsubscribe;
  }, [phase, room?.id, refreshPlayers, refreshSnapshot]);

  // Intentionally no pagehide leave: refresh must restore the same player.
  // Room expiry + host leave close are the cleanup fallbacks.

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
  const matchStarted = room?.status === 'countdown' || match != null;

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
        if (appError.code === 'ROOM_FULL' || appError.code === 'EXPIRED_ROOM' || appError.code === 'ROOM_CLOSED' || appError.code === 'INVALID_ROOM') {
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
    } catch (err) {
      const appError = toAppError(err);
      setActionError(appError.userMessage);
    } finally {
      setPending((prev) => ({ ...prev, start: false }));
    }
  }, [canStart, room]);

  const handleLeave = useCallback(async () => {
    const current = sessionRef.current;
    if (!current || pending.leave) {
      return;
    }
    setPending((prev) => ({ ...prev, leave: true }));
    try {
      await leaveRoom(current.playerId, current.sessionToken);
    } catch {
      // Still clear local session so the user can leave the UI
    } finally {
      clearRoomSession();
      setSession(null);
      setPending((prev) => ({ ...prev, leave: false }));
    }
  }, [pending.leave]);

  const dismissOpponentLeft = useCallback(() => {
    setLeftOpponentName(null);
  }, []);

  return {
    roomCode,
    phase,
    room,
    players,
    session,
    match,
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
    dismissOpponentLeft,
  };
}
