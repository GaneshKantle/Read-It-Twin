import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Container } from '@/components/layout/Container';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { cn } from '@/lib/cn';

interface RunTopBarProps {
  backTo: string;
  backLabel: string;
}

export function RunTopBar({ backTo, backLabel }: RunTopBarProps) {
  return (
    <header className="border-b border-border">
      <Container className="flex items-center justify-between gap-4 py-4">
        <Link
          to={backTo}
          className={cn(
            'inline-flex items-center gap-2 rounded-sm text-label font-medium uppercase tracking-[0.14em] text-muted-foreground transition-colors duration-fast ease-fluid hover:text-foreground',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          )}
        >
          <ArrowLeft className="h-4 w-4" />
          {backLabel}
        </Link>
        <ThemeToggle />
      </Container>
    </header>
  );
}
