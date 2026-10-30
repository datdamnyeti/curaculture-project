// src/pages/_app.tsx
import React from 'react';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import { UIProvider } from '../contexts/UIContext';
import { SessionProvider } from '../contexts/SessionContext';
import '../styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <UIProvider>
      <SessionProvider>
        <Head>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>CuraCulture</title>
        </Head>
        <Component {...pageProps} />
      </SessionProvider>
    </UIProvider>
  );
}
