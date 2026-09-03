import { MotionConfig } from 'framer-motion';
import { Outlet } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { PageTransition } from '@/components/motion/PageTransition';

export function App() {
  return (
    <MotionConfig reducedMotion="user">
      <AppShell>
        <PageTransition>
          <Outlet />
        </PageTransition>
      </AppShell>
    </MotionConfig>
  );
}
