import { isRouteErrorResponse, useNavigate, useRouteError } from 'react-router-dom';
import { Container } from '@/components/layout/Container';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';

/** React Router errorElement — recovers from route load/render failures. */
export function RouteErrorPage() {
  const error = useRouteError();
  const navigate = useNavigate();

  if (import.meta.env.DEV && error instanceof Error) {
    console.error('[RouteError]', error);
  }

  const isNotFound = isRouteErrorResponse(error) && error.status === 404;

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Container className="flex flex-1 items-center py-14 sm:py-20">
        <div className="mx-auto w-full max-w-[34rem] rounded-lg border-2 border-border bg-surface p-7 sm:p-9">
          <span className="inline-flex items-center rounded-full bg-ink px-4 py-1.5 text-label font-bold text-background">
            {isNotFound ? '404' : 'SOMETHING BROKE'}
          </span>
          <Text as="h1" variant="subheading" className="mt-5">
            {isNotFound ? 'This page does not exist.' : 'This screen hit an unexpected error.'}
          </Text>
          <Text as="p" variant="small" className="mt-3 text-muted-foreground">
            {isNotFound
              ? 'The link may be mistyped, or the room invite may have expired.'
              : 'Try again, or head home and start a fresh run.'}
          </Text>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            {!isNotFound ? (
              <Button size="lg" arrow className="w-full sm:w-auto" onClick={() => navigate(0)}>
                Try again
              </Button>
            ) : null}
            <Button
              size="lg"
              variant={isNotFound ? 'primary' : 'ghost'}
              arrow={isNotFound}
              className="w-full sm:w-auto"
              onClick={() => navigate('/')}
            >
              Go home
            </Button>
          </div>
        </div>
      </Container>
    </div>
  );
}
