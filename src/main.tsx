// Ensure window.fetch is writable and has setter for browser extension compatibility
if (typeof window !== 'undefined') {
  try {
    const origFetch = window.fetch ? window.fetch.bind(window) : null;
    let currentFetch = origFetch;
    if (typeof Window !== 'undefined' && Window.prototype) {
      try {
        Object.defineProperty(Window.prototype, 'fetch', {
          configurable: true,
          enumerable: true,
          get() {
            return currentFetch || origFetch;
          },
          set(fn) {
            currentFetch = fn;
            try {
              (window as unknown as { fetch: unknown }).fetch = fn;
            } catch (_) {}
          }
        });
      } catch (_) {}
    }
  } catch (_) {}
}

import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ThemeProvider } from './context/ThemeContext.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>,
);
