// src/pages/_app.tsx
import React from 'react';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { UIProvider } from '../contexts/UIContext';
import { SessionProvider } from '../contexts/SessionContext';
import '../styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <UIProvider>
      <SessionProvider>
        <Head>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <link rel="icon" href="/logo.svg" type="image/svg+xml" />
          <title>CuraCulture</title>
        </Head>
        <div className={`${GeistSans.variable} ${GeistMono.variable} font-sans`}>
          <Component {...pageProps} />
        </div>
        {/* The variables are also set on <html> in _document so portals get them. */}
      </SessionProvider>
    </UIProvider>
  );
}
