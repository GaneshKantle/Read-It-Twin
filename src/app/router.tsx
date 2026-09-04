import { createBrowserRouter } from 'react-router-dom';
import { App } from '@/app/App';
import { RunLayout } from '@/app/RunLayout';
import { DesignSystemPage } from '@/pages/DesignSystemPage';
import { HomePage } from '@/pages/HomePage';
import { ReadingPage } from '@/pages/ReadingPage';
import { RunSummaryPage } from '@/pages/RunSummaryPage';
import { SetupPage } from '@/pages/SetupPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: 'design-system',
        element: <DesignSystemPage />,
      },
    ],
  },
  {
    path: '/play',
    element: <RunLayout />,
    children: [
      {
        index: true,
        element: <SetupPage />,
      },
      {
        path: 'read',
        element: <ReadingPage />,
      },
      {
        path: 'finish',
        element: <RunSummaryPage />,
      },
    ],
  },
]);
