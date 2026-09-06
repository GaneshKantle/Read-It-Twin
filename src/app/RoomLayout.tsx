import { Outlet, ScrollRestoration } from 'react-router-dom';

/**
 * Quiet multiplayer chrome — same idea as RunLayout: no marketing header/footer.
 */
export function RoomLayout() {
  return (
    <>
      <ScrollRestoration />
      <div className="flex min-h-screen flex-col bg-background text-foreground transition-colors duration-base ease-fluid">
        <Outlet />
      </div>
    </>
  );
}
