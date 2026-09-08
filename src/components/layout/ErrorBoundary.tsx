import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Container } from '@/components/layout/Container';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';

type ErrorBoundaryProps = {
  children: ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
};

/**
 * Catches unexpected render errors so the app does not go fully blank.
 * In development, rethrows so the Vite overlay still surfaces the stack.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    if (import.meta.env.DEV) {
      console.error('[ErrorBoundary]', error, info.componentStack);
    }
  }

  private handleRetry = () => {
    this.setState({ hasError: false });
  };

  private handleHome = () => {
    window.location.assign('/');
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col bg-background text-foreground">
          <Container className="flex flex-1 items-center py-14 sm:py-20">
            <div className="mx-auto w-full max-w-[34rem] rounded-lg border-2 border-border bg-surface p-7 sm:p-9">
              <span className="inline-flex items-center rounded-full bg-ink px-4 py-1.5 text-label font-bold text-background">
                SOMETHING BROKE
              </span>
              <Text as="h1" variant="subheading" className="mt-5">
                This screen hit an unexpected error.
              </Text>
              <Text as="p" variant="small" className="mt-3 text-muted-foreground">
                Try again, or head home and start a fresh run.
              </Text>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Button size="lg" arrow className="w-full sm:w-auto" onClick={this.handleRetry}>
                  Try again
                </Button>
                <Button
                  size="lg"
                  variant="ghost"
                  className="w-full sm:w-auto"
                  onClick={this.handleHome}
                >
                  Go home
                </Button>
              </div>
            </div>
          </Container>
        </div>
      );
    }

    return this.props.children;
  }
}
