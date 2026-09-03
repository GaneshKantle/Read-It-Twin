import { createBrowserRouter } from 'react-router-dom';
import { App } from '@/app/App';
import { DesignSystemPage } from '@/pages/DesignSystemPage';
import { HomePage } from '@/pages/HomePage';

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
]);
