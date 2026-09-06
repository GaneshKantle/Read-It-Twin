import { useNavigate, useParams } from 'react-router-dom';
import { JoinPanel } from '@/components/room/JoinPanel';
import { LobbyPanel } from '@/components/room/LobbyPanel';
import { RoomError } from '@/components/room/RoomError';
import { Container } from '@/components/layout/Container';
import { RunTopBar } from '@/components/run/RunTopBar';
import { Text } from '@/components/ui/Text';
import { useRoomLobby } from '@/hooks/useRoomLobby';
import { clearRoomSession } from '@/lib/session/playerSession';

export function RoomPage() {
  const { roomCode = '' } = useParams();
  const navigate = useNavigate();
  const lobby = useRoomLobby(roomCode);

  const handleLeave = async () => {
    await lobby.handleLeave();
    navigate('/');
  };

  return (
    <>
      <RunTopBar backTo="/" backLabel="Home" />
      <main className="flex-1">
        {lobby.phase === 'loading' ? (
          <Container className="py-14 sm:py-20">
            <div className="mx-auto max-w-[34rem] rounded-lg border-2 border-border bg-surface p-7 sm:p-9">
              <Text as="p" variant="subheading">
                Loading room…
              </Text>
              <Text as="p" variant="small" className="mt-3 text-muted-foreground">
                Pulling the latest lobby state.
              </Text>
            </div>
          </Container>
        ) : null}

        {lobby.phase === 'unavailable' || lobby.phase === 'error' ? (
          lobby.error ? <RoomError error={lobby.error} /> : null
        ) : null}

        {lobby.phase === 'join' && lobby.room ? (
          <Container className="py-8 sm:py-12 lg:py-16">
            <JoinPanel
              roomCode={lobby.room.room_code}
              hostName={lobby.hostPlayer?.nickname ?? null}
              pending={lobby.pending.join}
              errorMessage={lobby.actionError}
              onJoin={(nickname) => void lobby.handleJoin(nickname)}
            />
          </Container>
        ) : null}

        {lobby.phase === 'lobby' && lobby.room ? (
          <Container className="py-8 sm:py-12 lg:py-16">
            <LobbyPanel
              room={lobby.room}
              selfPlayer={lobby.selfPlayer}
              opponent={lobby.opponent}
              hostPlayerId={lobby.room.host_player_id}
              isHost={lobby.isHost}
              bothReady={lobby.bothReady}
              canToggleReady={lobby.canToggleReady}
              canStart={lobby.canStart}
              matchStarted={lobby.matchStarted}
              match={lobby.match}
              leftOpponentName={lobby.leftOpponentName}
              pending={lobby.pending}
              actionError={lobby.actionError}
              onToggleReady={() => void lobby.handleToggleReady()}
              onStart={() => void lobby.handleStart()}
              onLeave={() => void handleLeave()}
              onDismissOpponentLeft={lobby.dismissOpponentLeft}
            />
          </Container>
        ) : null}
      </main>
    </>
  );
}

/** Clears a stale session when intentionally navigating away via invite-again flows. */
export function resetRoomLocalSession(): void {
  clearRoomSession();
}
