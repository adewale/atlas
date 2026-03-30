import { StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router';
import { router } from './routes';
import './globals.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Suspense fallback={<div>Loading…</div>}>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <RouterProvider router={router} />
    </Suspense>
  </StrictMode>,
);
