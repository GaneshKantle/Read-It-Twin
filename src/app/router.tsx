import { createBrowserRouter } from 'react-router-dom';
import { App } from '@/app/App';
import { RoomLayout } from '@/app/RoomLayout';
import { RunLayout } from '@/app/RunLayout';
import { ChallengePage } from '@/pages/ChallengePage';
import { DesignSystemPage } from '@/pages/DesignSystemPage';
import { HomePage } from '@/pages/HomePage';
import { JoinRedirectPage } from '@/pages/JoinRedirectPage';
import { QuizPage } from '@/pages/QuizPage';
import { ReadingPage } from '@/pages/ReadingPage';
import { ResultsPage } from '@/pages/ResultsPage';
import { RoomPage } from '@/pages/RoomPage';
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
        path: 'quiz',
        element: <QuizPage />,
      },
      {
        path: 'results',
        element: <ResultsPage />,
      },
    ],
  },
  {
    element: <RoomLayout />,
    children: [
      {
        path: 'challenge',
        element: <ChallengePage />,
      },
      {
        path: 'room/:roomCode',
        element: <RoomPage />,
      },
      {
        path: 'join/:roomCode',
        element: <JoinRedirectPage />,
      },
    ],
  },
]);
