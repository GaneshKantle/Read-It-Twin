import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Logo } from '@/components/brand/Logo';
import { Container } from '@/components/layout/Container';
import { Footer } from '@/components/layout/Footer';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { cn } from '@/lib/cn';

const focusRing =
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background';

export function AppShell({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground transition-colors duration-base ease-fluid">
      <header className="sticky top-0 z-20 border-b border-border/80 bg-background/90 backdrop-blur-sm">
        <Container className="flex items-center justify-between gap-4 py-4">
          <Link to="/" aria-label="Read It Twin home" className={cn('rounded-sm', focusRing)}>
            <Logo />
          </Link>
          <nav className="flex items-center gap-1 sm:gap-3">
            {pathname === '/' && (
              <a
                href="#how-it-works"
                className={cn(
                  'hidden rounded-sm px-2 py-1 text-label font-medium uppercase tracking-[0.14em] text-muted-foreground transition-colors duration-fast ease-fluid hover:text-foreground sm:inline-flex',
                  focusRing,
                )}
              >
                How it works
              </a>
            )}
            <ThemeToggle />
          </nav>
        </Container>
      </header>
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
