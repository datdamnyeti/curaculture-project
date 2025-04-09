// src/pages/index.tsx
import type { NextPage } from 'next';
import Head from 'next/head';
import CuraCulture from '../components/CuraCulture';

const Home: NextPage = () => {
  return (
    <>
      <Head>
        <title>CuraCulture | Veterinary Practice Cultural Assessment</title>
        <meta name="description" content="A cultural assessment tool for veterinary practices" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <CuraCulture />
    </>
  );
};

export default Home;