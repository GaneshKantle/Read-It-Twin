import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Container } from '@/components/layout/Container';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { fadeUp, staggerContainer } from '@/lib/motion';
import type { LobbyError } from '@/hooks/useRoomLobby';

type RoomErrorProps = {
  error: LobbyError;
  onInviteAgain?: () => void;
};

export function RoomError({ error, onInviteAgain }: RoomErrorProps) {
  const navigate = useNavigate();

  return (
    <Container className="py-14 sm:py-20">
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="mx-auto w-full max-w-[34rem] rounded-lg border-2 border-border bg-surface p-7 sm:p-9"
      >
        <motion.div variants={fadeUp}>
          <span className="inline-flex items-center rounded-full bg-ink px-4 py-1.5 text-label font-bold text-background">
            {error.title}
          </span>
          <Text as="h1" variant="subheading" className="mt-5">
            {error.message}
          </Text>
        </motion.div>

        <motion.div variants={fadeUp} className="mt-7 flex flex-col gap-3 sm:flex-row">
          {onInviteAgain && (error.kind === 'opponent_left' || error.kind === 'full') ? (
            <Button size="lg" arrow className="w-full sm:w-auto" onClick={onInviteAgain}>
              Invite again
            </Button>
          ) : null}
          <Button
            size="lg"
            variant={onInviteAgain ? 'ghost' : 'primary'}
            arrow={!onInviteAgain}
            className="w-full sm:w-auto"
            onClick={() => navigate('/')}
          >
            Go home
          </Button>
        </motion.div>
      </motion.div>
    </Container>
  );
}
