import { getSupabaseClient } from '@/lib/supabase/client';
import type { MatchRow, RoomRow } from '@/types/database';

export type RoomRealtimeStatus = 'SUBSCRIBED' | 'TIMED_OUT' | 'CHANNEL_ERROR' | 'CLOSED';

export type RoomRealtimeCallbacks = {
  onRoomChange?: (room: RoomRow) => void;
  onPlayersChange?: () => void;
  onMatchChange?: (match: MatchRow) => void;
  onSubscribed?: () => void;
  onStatus?: (status: RoomRealtimeStatus) => void;
  onError?: (error: Error) => void;
};

/**
 * Subscribe to room + player + match changes for one room.
 * Returns an unsubscribe function. Call once per mount; clean up on unmount.
 */
export function subscribeToRoom(roomId: string, callbacks: RoomRealtimeCallbacks): () => void {
  const client = getSupabaseClient();
  const channelName = `room:${roomId}`;

  const channel = client
    .channel(channelName)
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
          callbacks.onRoomChange?.(payload.new as RoomRow);
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
      () => {
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

  return () => {
    void client.removeChannel(channel);
  };
}

export type { MatchRow, RoomRow };
