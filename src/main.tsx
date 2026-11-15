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

  // Tier 1 Google Maps Platform Demo Key auth/quota listener
  (window as unknown as { gm_authFailure?: () => void }).gm_authFailure = () => {
    window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
  };
  const origConsoleError = console.error;
  console.error = (...args: unknown[]) => {
    origConsoleError.apply(console, args);
    const msg = args.map((a) => String(a)).join(' ');
    if (msg.includes('OverQuotaMapError') || msg.includes('QuotaExceededError')) {
      window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
    }
  };
}

import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ThemeProvider } from './context/ThemeContext.tsx';
import { TextSizeProvider } from './context/TextSizeContext.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <TextSizeProvider>
        <App />
      </TextSizeProvider>
    </ThemeProvider>
  </StrictMode>,
);
