import React from 'react';
import ReactDOM from 'react-dom/client';
import { AppProviders } from './app/providers';
import './index.css';

async function prepare() {
  if (import.meta.env.VITE_MSW_ENABLED === 'true') {
    const { worker } = await import('./mocks/browser');
    await worker.start({ onUnhandledRequest: 'bypass' });
  }
}

prepare().then(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <AppProviders />
    </React.StrictMode>
  );
});
