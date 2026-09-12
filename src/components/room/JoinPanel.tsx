import { useState, type FormEvent } from 'react';
import { motion } from 'framer-motion';
import { NicknameInput } from '@/components/room/NicknameInput';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { fadeUp, staggerContainer } from '@/lib/motion';

type JoinPanelProps = {
  roomCode: string;
  hostName: string | null;
  initialNickname?: string | null;
  pending: boolean;
  errorMessage: string | null;
  onJoin: (nickname: string) => void;
};

export function JoinPanel({
  roomCode,
  hostName,
  initialNickname = null,
  pending,
  errorMessage,
  onJoin,
}: JoinPanelProps) {
  const [nickname, setNickname] = useState(initialNickname?.trim() ?? '');

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = nickname.trim();
    if (!trimmed || pending) {
      return;
    }
    onJoin(trimmed);
  };

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="mx-auto w-full max-w-[34rem]"
    >
      <motion.div variants={fadeUp}>
        <span className="inline-flex items-center rounded-full bg-ink px-4 py-1.5 text-label font-bold text-background">
          Challenge
        </span>
      </motion.div>

      <motion.h1
        variants={fadeUp}
        className="mt-6 font-display text-[clamp(2.25rem,8vw,3.75rem)] font-extrabold leading-[0.9] tracking-[-0.035em]"
      >
        {hostName ? (
          <>
            <span className="uppercase">{hostName}</span>
            <span className="block text-muted-foreground">challenged you.</span>
          </>
        ) : initialNickname ? (
          'Come back in.'
        ) : (
          'Join the race.'
        )}
      </motion.h1>

      <motion.div
        variants={fadeUp}
        className="mt-8 rounded-lg border-2 border-ink bg-pale-yellow p-5 text-black sm:p-6"
      >
        <p className="text-eyebrow font-bold text-black/65">Room</p>
        <p className="mt-2 font-display text-4xl font-extrabold tracking-[0.14em]">{roomCode}</p>
      </motion.div>

      <motion.form variants={fadeUp} className="mt-8 space-y-5" onSubmit={handleSubmit}>
        <NicknameInput
          label="Enter your nickname"
          value={nickname}
          onChange={(event) => setNickname(event.target.value)}
          placeholder="Alex"
          disabled={pending}
          required
        />

        {errorMessage ? (
          <Text as="p" variant="small" className="text-danger">
            {errorMessage}
          </Text>
        ) : null}

        <Button type="submit" size="lg" arrow className="w-full" disabled={pending || !nickname.trim()}>
          {pending ? 'Joining…' : initialNickname ? 'Rejoin race' : 'Join race'}
        </Button>
      </motion.form>
    </motion.div>
  );
}
