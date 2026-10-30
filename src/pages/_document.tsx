// Puts the Geist font variables on <html> so every element, including dialogs
// and toasts rendered outside the app root, uses the same typeface.
import { Html, Head, Main, NextScript } from 'next/document';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';

export default function Document() {
  return (
    <Html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <Head />
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
