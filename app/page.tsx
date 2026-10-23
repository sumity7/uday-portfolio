'use client';

import { useCallback, useState } from 'react';
import SmoothScroll from '@/components/SmoothScroll';
import Loader from '@/components/Loader';
import Cursor from '@/components/Cursor';
import Grain from '@/components/Grain';
import Nav from '@/components/Nav';
import ChargeMeter from '@/components/ChargeMeter';
import Hero from '@/components/Hero';
import PackAssembly from '@/components/PackAssembly';
import About from '@/components/About';
import Stats from '@/components/Stats';
import Experience from '@/components/Experience';
import Oscilloscope from '@/components/Oscilloscope';
import Skills from '@/components/Skills';
import Certifications from '@/components/Certifications';
import Contact from '@/components/Contact';

export default function Home() {
  const [ready, setReady] = useState(false);
  const onReady = useCallback(() => setReady(true), []);

  return (
    <>
      <SmoothScroll paused={!ready} />
      <Loader onComplete={onReady} />
      <Cursor />
      <Grain />
      <Nav ready={ready} />
      <ChargeMeter />
      <main>
        <Hero ready={ready} />
        <PackAssembly />
        <About />
        <Stats />
        <Experience />
        <Oscilloscope />
        <Skills />
        <Certifications />
        <Contact />
      </main>
    </>
  );
}
