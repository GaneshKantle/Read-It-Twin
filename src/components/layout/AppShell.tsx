import { useEffect, type ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Logo } from '@/components/brand/Logo';
import { Container } from '@/components/layout/Container';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { useScrollStarted } from '@/hooks/useScrollStarted';
import { useSmoothScroll } from '@/hooks/useSmoothScroll';
import { cn } from '@/lib/cn';

const focusRing =
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background';

const sectionLinks = [
  { href: '#how-it-works', label: 'How it works' },
  { href: '#passages', label: 'Passages' },
  { href: '#faq', label: 'FAQ' },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { pathname, hash } = useLocation();
  const navigate = useNavigate();
  const scrolled = useScrollStarted();
  const onHome = pathname === '/';

  useSmoothScroll();

  // Router state survives a route change, so a new page would otherwise open at
  // the previous page's scroll offset. Anchor links keep their own target.
  useEffect(() => {
    if (!hash) {
      window.scrollTo(0, 0);
    }
  }, [hash, pathname]);

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground transition-colors duration-base ease-fluid">
      <header className="fixed inset-x-0 top-0 z-50">
        <Container className="flex items-center justify-between gap-3 py-3 sm:py-4">
          <Link
            to="/"
            aria-label="Read It Twin home"
            className={cn(
              'rounded-full transition-colors duration-base ease-fluid',
              // Once the page moves, the mark needs its own backing so it stays
              // readable over whichever candy section is passing behind it.
              scrolled && 'bg-background/70 py-1 pr-4 backdrop-blur-md',
              focusRing,
            )}
          >
            <Logo showTagline={!scrolled} />
          </Link>

          {onHome && (
            <nav
              className={cn(
                'hidden items-center gap-1.5 rounded-full p-1 transition-colors duration-base ease-fluid md:flex',
                scrolled && 'bg-background/70 backdrop-blur-md',
              )}
            >
              {sectionLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'rounded-full bg-chip px-4 py-2 text-label font-bold text-chip-foreground transition-transform duration-fast ease-fluid hover:-translate-y-0.5',
                    focusRing,
                  )}
                >
                  {link.label}
                </a>
              ))}
            </nav>
          )}

          <div
            className={cn(
              'flex items-center gap-2 rounded-full transition-colors duration-base ease-fluid',
              scrolled && 'bg-background/70 p-1 backdrop-blur-md',
            )}
          >
            <Button
              size="sm"
              variant="secondary"
              arrow
              className="hidden sm:inline-flex"
              onClick={() => navigate('/play')}
            >
              Start reading
            </Button>
            <ThemeToggle />
          </div>
        </Container>
      </header>

      {/* No top padding: the candy sections run under the floating header. */}
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
