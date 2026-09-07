import { useNavigate, useParams } from 'react-router-dom';
import { JoinPanel } from '@/components/room/JoinPanel';
import { LobbyPanel } from '@/components/room/LobbyPanel';
import { MatchQuizScreen } from '@/components/room/MatchQuizScreen';
import { MatchReadingScreen } from '@/components/room/MatchReadingScreen';
import { MatchResultsScreen } from '@/components/room/MatchResultsScreen';
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

  const racing = lobby.phase === 'racing';
  const showReading =
    racing &&
    lobby.passage &&
    lobby.match &&
    lobby.selfPlayer &&
    (lobby.matchView === 'countdown' ||
      lobby.matchView === 'reading' ||
      lobby.matchView === 'waiting');
  const showQuiz =
    racing &&
    lobby.passage &&
    (lobby.matchView === 'quiz' || lobby.matchView === 'quiz_waiting');
  const showResults = racing && lobby.matchView === 'results' && lobby.room;

  return (
    <>
      <RunTopBar backTo="/" backLabel="Home" />
      {lobby.phase === 'loading' ? (
        <main className="flex-1">
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
        </main>
      ) : null}

      {lobby.phase === 'unavailable' || lobby.phase === 'error' ? (
        lobby.error ? <RoomError error={lobby.error} /> : null
      ) : null}

      {lobby.phase === 'join' && lobby.room ? (
        <main className="flex-1">
          <Container className="py-8 sm:py-12 lg:py-16">
            <JoinPanel
              roomCode={lobby.room.room_code}
              hostName={lobby.hostPlayer?.nickname ?? null}
              pending={lobby.pending.join}
              errorMessage={lobby.actionError}
              onJoin={(nickname) => void lobby.handleJoin(nickname)}
            />
          </Container>
        </main>
      ) : null}

      {lobby.phase === 'lobby' && lobby.room ? (
        <main className="flex-1">
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
        </main>
      ) : null}

      {racing && lobby.passageLoading && !lobby.passage ? (
        <main className="flex-1">
          <Container className="py-14 sm:py-20">
            <div className="mx-auto max-w-[34rem] rounded-lg border-2 border-border bg-surface p-7 sm:p-9">
              <Text as="p" variant="subheading">
                Loading passage…
              </Text>
              <Text as="p" variant="small" className="mt-3 text-muted-foreground">
                Fetching the shared race text.
              </Text>
            </div>
          </Container>
        </main>
      ) : null}

      {showReading && lobby.passage && lobby.match && lobby.selfPlayer ? (
        <div className="flex min-h-0 flex-1 flex-col">
          <MatchReadingScreen
            view={lobby.matchView}
            passage={lobby.passage}
            match={lobby.match}
            selfPlayer={lobby.selfPlayer}
            opponent={lobby.opponent}
            clockOffsetMs={lobby.clockOffsetMs}
            focusLossCount={lobby.focusLossCount}
            finishPending={lobby.pending.finish}
            actionError={lobby.actionError}
            onCountdownComplete={lobby.handleCountdownComplete}
            onFinish={() => void lobby.handleFinishReading()}
            onFocusLoss={lobby.registerFocusLoss}
          />
        </div>
      ) : null}

      {showQuiz && lobby.passage ? (
        <div className="flex min-h-0 flex-1 flex-col">
          <MatchQuizScreen
            view={lobby.matchView}
            passage={lobby.passage}
            opponent={lobby.opponent}
            ownResult={lobby.ownResult}
            quizPending={lobby.pending.quiz}
            actionError={lobby.actionError}
            onSubmit={lobby.handleSubmitQuiz}
          />
        </div>
      ) : null}

      {showResults && lobby.room ? (
        <MatchResultsScreen
          room={lobby.room}
          match={lobby.match}
          passage={lobby.passage}
          selfPlayer={lobby.selfPlayer}
          opponent={lobby.opponent}
          matchResults={lobby.matchResults}
          rematchPending={lobby.pending.rematch}
          leavePending={lobby.pending.leave}
          actionError={lobby.actionError}
          onRematch={() => void lobby.handleRequestRematch()}
          onLeave={() => void handleLeave()}
        />
      ) : null}
    </>
  );
}

/** Clears a stale session when intentionally navigating away via invite-again flows. */
export function resetRoomLocalSession(): void {
  clearRoomSession();
}
