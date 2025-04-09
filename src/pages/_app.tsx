// src/pages/_app.tsx
import React from 'react';
import type { AppProps } from 'next/app';
import { UIProvider } from '../contexts/UIContext';
import '../styles/globals.css';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <UIProvider>
      <Component {...pageProps} />
    </UIProvider>
  );
}

export default MyApp;