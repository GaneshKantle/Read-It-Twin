import { Container } from '@/components/layout/Container';
import { Text } from '@/components/ui/Text';

export function Footer() {
  return (
    <footer className="border-t border-border">
      <Container className="flex flex-col gap-8 py-10 sm:flex-row sm:items-end sm:justify-between sm:py-14">
        <div>
          <span className="font-display text-2xl uppercase tracking-[-0.03em] sm:text-3xl">
            Read It Twin
          </span>
          <Text as="p" variant="eyebrow" className="mt-3">
            Two people / One passage / One winner
          </Text>
        </div>

        <Text as="p" variant="eyebrow">
          {new Date().getFullYear()}
        </Text>
      </Container>
    </footer>
  );
}
