import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Container } from '@/components/layout/Container';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { fadeUp, staggerContainer } from '@/lib/motion';
import { leaveNoticeCopy } from '@/lib/leaveNotice';
import type { LobbyError } from '@/hooks/useRoomLobby';

type RoomErrorProps = {
  error: LobbyError;
  onInviteAgain?: () => void;
  onRetry?: () => void;
};

const CREATE_NEW_RACE_KINDS: LobbyError['kind'][] = [
  'expired',
  'not_found',
  'closed',
  'host_left',
];

export function RoomError({ error, onInviteAgain, onRetry }: RoomErrorProps) {
  const navigate = useNavigate();
  const canRetry = Boolean(onRetry) && (error.kind === 'network' || error.kind === 'not_found');
  const canCreateNew = CREATE_NEW_RACE_KINDS.includes(error.kind);
  const showInviteAgain =
    Boolean(onInviteAgain) && (error.kind === 'opponent_left' || error.kind === 'full');
  const hasPrimary = canRetry || showInviteAgain || canCreateNew;

  const named =
    error.opponentName && (error.kind === 'host_left' || error.kind === 'opponent_left')
      ? leaveNoticeCopy({
          nickname: error.opponentName,
          wasHost: error.kind === 'host_left',
          roomOpen: false,
        })
      : null;

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
            {named ? 'Just now' : error.title}
          </span>
          <Text as="h1" variant="subheading" className="mt-5">
            {named ? named.title : error.message}
          </Text>
          {named ? (
            <Text as="p" variant="small" className="mt-3 text-muted-foreground">
              {named.body}
            </Text>
          ) : null}
        </motion.div>

        <motion.div variants={fadeUp} className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          {canRetry ? (
            <Button size="lg" arrow className="w-full sm:w-auto" onClick={onRetry}>
              Try again
            </Button>
          ) : null}
          {showInviteAgain ? (
            <Button size="lg" arrow className="w-full sm:w-auto" onClick={onInviteAgain}>
              Invite again
            </Button>
          ) : null}
          {canCreateNew ? (
            <Button
              size="lg"
              arrow
              className="w-full sm:w-auto"
              onClick={() => navigate('/challenge')}
            >
              Create new race
            </Button>
          ) : null}
          <Button
            size="lg"
            variant={hasPrimary ? 'ghost' : 'primary'}
            arrow={!hasPrimary}
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
