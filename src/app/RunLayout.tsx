import { Outlet, ScrollRestoration } from 'react-router-dom';
import { RunProvider } from '@/app/providers/RunProvider';

/**
 * The run branch deliberately drops the marketing header and footer. Each page
 * below renders only the chrome its screen needs, so the reading view can go
 * quiet.
 */
export function RunLayout() {
  return (
    <RunProvider>
      <ScrollRestoration />
      <div className="flex min-h-screen flex-col bg-background text-foreground transition-colors duration-base ease-fluid">
        <Outlet />
      </div>
    </RunProvider>
  );
}
