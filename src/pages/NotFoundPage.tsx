import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Container } from '@/components/layout/Container';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { useDocumentMeta } from '@/hooks/useDocumentMeta';
import { fadeUp, staggerContainer } from '@/lib/motion';

/** Catch-all page for unknown routes. Uses the existing marketing chrome. */
export function NotFoundPage() {
  const navigate = useNavigate();

  useDocumentMeta({
    title: 'Page not found · Read It Twin',
    description: 'That page does not exist. Head home to start a reading run or challenge a friend.',
  });

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
            404
          </span>
          <Text as="h1" variant="subheading" className="mt-5">
            This page does not exist.
          </Text>
          <Text as="p" variant="small" className="mt-3 text-muted-foreground">
            The link may be mistyped, or the room invite may have expired.
          </Text>
        </motion.div>

        <motion.div variants={fadeUp} className="mt-7">
          <Button size="lg" arrow className="w-full sm:w-auto" onClick={() => navigate('/')}>
            Go home
          </Button>
        </motion.div>
      </motion.div>
    </Container>
  );
}
