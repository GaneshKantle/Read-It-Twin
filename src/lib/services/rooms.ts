import { getSupabaseClient } from '@/lib/supabase/client';
import { AppError, fromSupabaseError } from '@/lib/supabase/errors';
import type { RoomRow } from '@/types/database';
import type { RoomStatus } from '@/types/room';

function mapRoomError(error: { code?: string; message?: string }): AppError {
  const message = (error.message ?? '').toLowerCase();
  if (message.includes('expired')) {
    return new AppError('EXPIRED_ROOM', { cause: error });
  }
  if (message.includes('not found') || error.code === 'P0002') {
    return new AppError('INVALID_ROOM', { cause: error });
  }
  return fromSupabaseError(error, 'INVALID_ROOM');
}

function assertNotExpired(room: RoomRow): RoomRow {
  if (room.status === 'closed' || new Date(room.expires_at).getTime() <= Date.now()) {
    throw new AppError('EXPIRED_ROOM', { message: `Room ${room.room_code} is expired or closed` });
  }
  return room;
}

export async function createRoom(passageId?: string | null): Promise<RoomRow> {
  const client = getSupabaseClient();
  const { data, error } = await client.rpc('create_room_with_code', {
    p_passage_id: passageId ?? null,
  });

  if (error) {
    throw fromSupabaseError(error, 'INSERT_FAILED');
  }
  if (!data) {
    throw new AppError('INSERT_FAILED', { message: 'create_room_with_code returned no row' });
  }

  return data as RoomRow;
}

export async function getRoomByCode(roomCode: string): Promise<RoomRow> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('rooms')
    .select('*')
    .eq('room_code', roomCode.toUpperCase())
    .maybeSingle();

  if (error) {
    throw mapRoomError(error);
  }
  if (!data) {
    throw new AppError('INVALID_ROOM');
  }

  return assertNotExpired(data);
}

export async function getRoomById(roomId: string): Promise<RoomRow> {
  const client = getSupabaseClient();
  const { data, error } = await client.from('rooms').select('*').eq('id', roomId).maybeSingle();

  if (error) {
    throw mapRoomError(error);
  }
  if (!data) {
    throw new AppError('INVALID_ROOM');
  }

  return assertNotExpired(data);
}

export async function updateRoomStatus(
  roomId: string,
  status: RoomStatus,
  passageId?: string | null,
): Promise<RoomRow> {
  const client = getSupabaseClient();
  const patch: { status: RoomStatus; passage_id?: string | null } = { status };
  if (passageId !== undefined) {
    patch.passage_id = passageId;
  }

  const { data, error } = await client
    .from('rooms')
    .update(patch)
    .eq('id', roomId)
    .select('*')
    .maybeSingle();

  if (error) {
    throw fromSupabaseError(error, 'UPDATE_FAILED');
  }
  if (!data) {
    throw new AppError('INVALID_ROOM');
  }

  return data;
}

export async function expireRoom(roomId: string): Promise<RoomRow> {
  const client = getSupabaseClient();
  const { data, error } = await client.rpc('expire_room', { p_room_id: roomId });

  if (error) {
    throw mapRoomError(error);
  }
  if (!data) {
    throw new AppError('INVALID_ROOM');
  }

  return data as RoomRow;
}
