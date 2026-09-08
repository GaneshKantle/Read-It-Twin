import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ShareAction } from '@/components/share/ShareAction';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { fadeUp } from '@/lib/motion';
import { resultShareMessage } from '@/lib/share';

interface ResultActionsProps {
  onRunItBack: () => void;
  onNewRun: () => void;
  /** A run is already starting; both routes are one-shot. */
  busy: boolean;
  wpm: number;
  comprehension: number;
  score: number;
  personalBest?: boolean;
}

export function ResultActions({
  onRunItBack,
  onNewRun,
  busy,
  wpm,
  comprehension,
  score,
  personalBest = false,
}: ResultActionsProps) {
  const navigate = useNavigate();
  const shareText = resultShareMessage({
    mode: 'solo',
    wpm,
    comprehension,
    score,
    personalBest,
  });
  const challengeUrl =
    typeof window !== 'undefined' ? `${window.location.origin}/challenge` : '/challenge';

  return (
    <motion.div variants={fadeUp} className="mt-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Button
          size="lg"
          arrow
          className="w-full sm:w-auto"
          disabled={busy}
          onClick={onRunItBack}
        >
          Run it back
        </Button>
        <ShareAction
          payload={{
            title: 'Read It Twin',
            text: shareText,
            url: challengeUrl,
          }}
          shareLabel="Share result"
          copyLabel="Share result"
          analyticsEvent="result_shared"
          variant="secondary"
          className="w-full sm:w-auto"
          disabled={busy}
        />
        <Button
          size="lg"
          variant="ghost"
          className="w-full sm:w-auto"
          disabled={busy}
          onClick={() => navigate('/challenge')}
        >
          Challenge a friend
        </Button>
        <Button
          size="lg"
          variant="ghost"
          className="w-full sm:w-auto"
          disabled={busy}
          onClick={onNewRun}
        >
          New run
        </Button>
      </div>

      <Text as="p" variant="small" className="mt-3 text-muted-foreground">
        Run it back keeps this difficulty and category. New run lets you change them.
      </Text>
    </motion.div>
  );
}
