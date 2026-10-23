'use client';

import { useEffect, useRef } from 'react';
import Lenis from 'lenis';
import { gsap, ScrollTrigger } from '@/lib/gsap';

/** Lenis inertia scrolling, driven by GSAP's ticker so ScrollTrigger scenes stay in sync. */
export default function SmoothScroll({ paused }: { paused: boolean }) {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    window.scrollTo(0, 0);
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.95 });
    lenisRef.current = lenis;
    lenis.on('scroll', ScrollTrigger.update);
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[href^="#"]');
      if (!a) return;
      const id = a.getAttribute('href') ?? '';
      const el = id.length > 1 ? document.querySelector<HTMLElement>(id) : null;
      if (!el) return;
      e.preventDefault();
      lenis.scrollTo(el, { duration: 1.8 });
    };
    document.addEventListener('click', onClick);

    return () => {
      document.removeEventListener('click', onClick);
      gsap.ticker.remove(tick);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('is-locked', paused);
    if (paused) lenisRef.current?.stop();
    else {
      lenisRef.current?.start();
      requestAnimationFrame(() => ScrollTrigger.refresh());
    }
  }, [paused]);

  return null;
}
