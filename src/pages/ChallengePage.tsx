import { useState, type FormEvent } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { NicknameInput } from '@/components/room/NicknameInput';
import { RoomError } from '@/components/room/RoomError';
import { Container } from '@/components/layout/Container';
import { RunTopBar } from '@/components/run/RunTopBar';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { getOrCreateClientId, writeRoomSession } from '@/lib/session/playerSession';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { AppError, isAppError } from '@/lib/supabase/errors';
import { createRoomAndJoin } from '@/lib/services/rooms';
import { fadeUp, staggerContainer } from '@/lib/motion';

export function ChallengePage() {
  const navigate = useNavigate();
  const [nickname, setNickname] = useState('');
  const [pending, setPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isSupabaseConfigured()) {
    return (
      <>
        <RunTopBar backTo="/" backLabel="Back" />
        <main className="flex-1">
          <RoomError
            error={{
              kind: 'network',
              title: 'SERVICE UNAVAILABLE',
              message: new AppError('SUPABASE_UNAVAILABLE').userMessage,
            }}
          />
        </main>
      </>
    );
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const trimmed = nickname.trim();
    if (!trimmed || pending) {
      return;
    }

    setPending(true);
    setErrorMessage(null);

    try {
      const clientId = getOrCreateClientId();
      const result = await createRoomAndJoin(trimmed, clientId);
      writeRoomSession({
        roomCode: result.room.room_code,
        roomId: result.room.id,
        playerId: result.player.id,
        sessionToken: result.session_token,
      });
      navigate(`/room/${result.room.room_code}`, { replace: true });
    } catch (error) {
      const message = isAppError(error)
        ? error.userMessage
        : new AppError('UNKNOWN').userMessage;
      setErrorMessage(message);
    } finally {
      setPending(false);
    }
  };

  return (
    <>
      <RunTopBar backTo="/" backLabel="Back" />
      <main className="flex-1">
        <Container className="py-8 sm:py-12 lg:py-16">
          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="mx-auto w-full max-w-[34rem]"
          >
            <motion.div variants={fadeUp}>
              <span className="inline-flex items-center rounded-full bg-ink px-4 py-1.5 text-label font-bold text-background">
                Challenge a friend
              </span>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              className="mt-6 font-display text-[clamp(2.5rem,8vw,4.25rem)] font-extrabold leading-[0.88] tracking-[-0.035em]"
            >
              Create a room.
            </motion.h1>

            <motion.div variants={fadeUp}>
              <Text as="p" className="mt-4 max-w-[36ch] text-muted-foreground">
                Pick a nickname, share the invite link, and wait for your opponent in the lobby.
              </Text>
            </motion.div>

            <motion.form variants={fadeUp} className="mt-8 space-y-5" onSubmit={(event) => void handleSubmit(event)}>
              <NicknameInput
                value={nickname}
                onChange={(event) => setNickname(event.target.value)}
                placeholder="Classyyy"
                disabled={pending}
                required
              />

              {errorMessage ? (
                <Text as="p" variant="small" className="text-danger">
                  {errorMessage}
                </Text>
              ) : null}

              <Button
                type="submit"
                size="lg"
                arrow
                className="w-full"
                disabled={pending || !nickname.trim()}
              >
                {pending ? 'Creating room…' : 'Create room'}
              </Button>
            </motion.form>
          </motion.div>
        </Container>
      </main>
    </>
  );
}
