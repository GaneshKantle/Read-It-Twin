import { getSupabaseClient } from '@/lib/supabase/client';
import { parseRoomRow } from '@/lib/services/rooms';
import type { MatchRow, RoomRow } from '@/types/database';

export type RoomRealtimeStatus = 'SUBSCRIBED' | 'TIMED_OUT' | 'CHANNEL_ERROR' | 'CLOSED';

export type PlayerLeftEvent = {
  playerId?: string;
  nickname: string;
  wasHost: boolean;
};

export type RoomRealtimeCallbacks = {
  onRoomChange?: (room: RoomRow) => void;
  onPlayersChange?: () => void;
  onPlayerLeft?: (event: PlayerLeftEvent) => void;
  onMatchChange?: (match: MatchRow) => void;
  onSubscribed?: () => void;
  onStatus?: (status: RoomRealtimeStatus) => void;
  onError?: (error: Error) => void;
};

export type RoomRealtimeHandle = {
  unsubscribe: () => void;
  notifyPlayerLeft: (event: PlayerLeftEvent) => Promise<void>;
};

function nicknameFromUnknown(value: unknown): string | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }
  const nickname = (value as { nickname?: unknown }).nickname;
  return typeof nickname === 'string' && nickname.trim() ? nickname : null;
}

function idFromUnknown(value: unknown): string | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return undefined;
  }
  const id = (value as { id?: unknown }).id;
  return typeof id === 'string' ? id : undefined;
}

/**
 * Subscribe to room + player + match changes for one room.
 * Returns an unsubscribe function. Call once per mount; clean up on unmount.
 */
export function subscribeToRoom(roomId: string, callbacks: RoomRealtimeCallbacks): RoomRealtimeHandle {
  const client = getSupabaseClient();
  const channelName = `room:${roomId}`;

  const channel = client
    .channel(channelName, {
      config: {
        broadcast: { self: false },
      },
    })
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'rooms',
        filter: `id=eq.${roomId}`,
      },
      (payload) => {
        if (payload.new && typeof payload.new === 'object' && 'id' in payload.new) {
          try {
            callbacks.onRoomChange?.(parseRoomRow(payload.new));
          } catch {
            callbacks.onRoomChange?.(payload.new as RoomRow);
          }
        } else if (payload.eventType === 'DELETE') {
          callbacks.onPlayersChange?.();
        }
      },
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'players',
        filter: `room_id=eq.${roomId}`,
      },
      (payload) => {
        if (payload.eventType === 'DELETE') {
          const nickname = nicknameFromUnknown(payload.old);
          if (nickname) {
            callbacks.onPlayerLeft?.({
              playerId: idFromUnknown(payload.old),
              nickname,
              wasHost: false,
            });
          }
        }
        callbacks.onPlayersChange?.();
      },
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'matches',
        filter: `room_id=eq.${roomId}`,
      },
      (payload) => {
        if (payload.new && typeof payload.new === 'object' && 'id' in payload.new) {
          callbacks.onMatchChange?.(payload.new as MatchRow);
        } else {
          callbacks.onPlayersChange?.();
        }
      },
    )
    .on('broadcast', { event: 'player_left' }, ({ payload }) => {
      const nickname = nicknameFromUnknown(payload);
      if (!nickname) {
        return;
      }
      callbacks.onPlayerLeft?.({
        playerId: idFromUnknown(payload),
        nickname,
        wasHost: Boolean(
          payload && typeof payload === 'object' && (payload as { wasHost?: unknown }).wasHost,
        ),
      });
    })
    .subscribe((status) => {
      if (
        status === 'SUBSCRIBED' ||
        status === 'TIMED_OUT' ||
        status === 'CHANNEL_ERROR' ||
        status === 'CLOSED'
      ) {
        callbacks.onStatus?.(status);
      }

      if (status === 'SUBSCRIBED') {
        callbacks.onSubscribed?.();
      }

      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        callbacks.onError?.(
          new Error(
            status === 'TIMED_OUT' ? 'Realtime channel timed out' : 'Realtime channel error',
          ),
        );
      }
    });

  return {
    unsubscribe: () => {
      void client.removeChannel(channel);
    },
    notifyPlayerLeft: async (event) => {
      await channel.send({
        type: 'broadcast',
        event: 'player_left',
        payload: event,
      });
    },
  };
}

export type { MatchRow, RoomRow };
