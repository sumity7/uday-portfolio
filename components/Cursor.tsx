'use client';

import { useEffect, useRef } from 'react';
import { gsap } from '@/lib/gsap';

/** A probe tip and a lagging ring that grows and labels itself over interactive things. */
export default function Cursor() {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!window.matchMedia('(pointer: fine)').matches) return;
    const d = dot.current!;
    const r = ring.current!;
    const l = label.current!;
    document.documentElement.classList.add('has-cursor');
    gsap.set([d, r], { xPercent: -50, yPercent: -50, x: -100, y: -100 });

    const xD = gsap.quickTo(d, 'x', { duration: 0.1, ease: 'power3' });
    const yD = gsap.quickTo(d, 'y', { duration: 0.1, ease: 'power3' });
    const xR = gsap.quickTo(r, 'x', { duration: 0.55, ease: 'power3' });
    const yR = gsap.quickTo(r, 'y', { duration: 0.55, ease: 'power3' });

    const move = (e: PointerEvent) => {
      xD(e.clientX);
      yD(e.clientY);
      xR(e.clientX);
      yR(e.clientY);
    };
    const over = (e: PointerEvent) => {
      const t = (e.target as HTMLElement).closest<HTMLElement>('a, button, [data-cursor]');
      const text = t?.dataset.cursor ?? '';
      const interactive = !!t && (t.tagName === 'A' || t.tagName === 'BUTTON');
      r.classList.toggle('is-hover', interactive);
      r.classList.toggle('has-label', !!text);
      l.textContent = text;
    };
    const down = () => r.classList.add('is-down');
    const up = () => r.classList.remove('is-down');
    const leave = () => gsap.to([d, r], { opacity: 0, duration: 0.3 });
    const enter = () => gsap.to([d, r], { opacity: 1, duration: 0.3 });

    window.addEventListener('pointermove', move);
    window.addEventListener('pointerover', over);
    window.addEventListener('pointerdown', down);
    window.addEventListener('pointerup', up);
    document.documentElement.addEventListener('pointerleave', leave);
    document.documentElement.addEventListener('pointerenter', enter);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerover', over);
      window.removeEventListener('pointerdown', down);
      window.removeEventListener('pointerup', up);
      document.documentElement.removeEventListener('pointerleave', leave);
      document.documentElement.removeEventListener('pointerenter', enter);
      document.documentElement.classList.remove('has-cursor');
    };
  }, []);

  return (
    <>
      <div className="cursor-dot" ref={dot} aria-hidden="true" />
      <div className="cursor-ring" ref={ring} aria-hidden="true">
        <span ref={label} />
      </div>
    </>
  );
}
