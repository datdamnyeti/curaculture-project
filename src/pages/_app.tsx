// src/pages/_app.tsx
import React from 'react';
import type { AppProps } from 'next/app';
import { UIProvider } from '../contexts/UIContext';
import { AuthProvider } from '../contexts/AuthContext';
import '../styles/globals.css';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <UIProvider>
      <AuthProvider>
        <Component {...pageProps} />
      </AuthProvider>
    </UIProvider>
  );
}

export default MyApp;