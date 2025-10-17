import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import pizzeriaIconPng from './pizzeria_161-playstore.png';
import pizzeriaIconWebp from './pizzeria_round.webp';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Dynamically set favicon (WebP preferred) with PNG fallback and apple-touch-icon (PNG)
(() => {
  // Prefer adding new <link> tags to keep fallbacks intact
  const addIcon = (attrs: Partial<HTMLLinkElement>) => {
    const link = document.createElement('link');
    Object.assign(link, attrs);
    document.head.appendChild(link);
  };

  // WebP favicon (modern browsers)
  addIcon({ rel: 'icon', type: 'image/webp', href: pizzeriaIconWebp } as HTMLLinkElement);
  // PNG fallback favicon
  addIcon({ rel: 'icon', type: 'image/png', href: pizzeriaIconPng } as HTMLLinkElement);
  // Apple touch icon must be PNG
  addIcon({ rel: 'apple-touch-icon', href: pizzeriaIconPng } as HTMLLinkElement);
})();

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();

// Silence console in production
if (process.env.NODE_ENV === 'production') {
  const noop = () => {};
  // Preserve reference for potential future enabling if needed
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const originalConsole = { ...console };
  console.log = noop;
  console.info = noop;
  console.warn = noop;
  console.error = noop;
  console.debug = noop;
}

// Development-only: verbose error diagnostics for unhandled rejections and errors
if (process.env.NODE_ENV !== 'production') {
  const formatReason = (reason: unknown): string => {
    try {
      if (reason instanceof Error) return `${reason.name}: ${reason.message}\n${reason.stack || ''}`;
      if (typeof reason === 'object') return JSON.stringify(reason as object, null, 2);
      return String(reason);
    } catch {
      return 'Unknown reason (could not stringify)';
    }
  };

  window.addEventListener('unhandledrejection', (event) => {
    // Mark as handled to suppress dev overlay/error screens
    if (event && typeof event.preventDefault === 'function') {
      event.preventDefault();
    }
    // eslint-disable-next-line no-console
    console.error('🚨 Unhandled Promise Rejection:', {
      reason: formatReason(event.reason),
      rawReason: event.reason,
      promise: event.promise,
    });
  });

  window.addEventListener('error', (event) => {
    // eslint-disable-next-line no-console
    console.error('💥 Global Error:', {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: event.error,
    });
  });
}
