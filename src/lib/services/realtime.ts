import { getSupabaseClient } from '@/lib/supabase/client';
import type { PlayerRow, RoomRow } from '@/types/database';

export type RoomRealtimeCallbacks = {
  onRoomChange?: (room: RoomRow) => void;
  onPlayersChange?: () => void;
  onError?: (error: Error) => void;
};

/**
 * Subscribe to room + player changes for one room.
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
    .subscribe((status) => {
      if (status === 'CHANNEL_ERROR') {
        callbacks.onError?.(new Error('Realtime channel error'));
      }
    });

  return () => {
    void client.removeChannel(channel);
  };
}

export type { PlayerRow, RoomRow };
