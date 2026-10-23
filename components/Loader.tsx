'use client';

import { useRef, useState } from 'react';
import { gsap, useGSAP } from '@/lib/gsap';

const LOG = [
  'BMS wake-up',
  'Cell voltage scan',
  'Thermal sensors nominal',
  'Isolation resistance > 500 MΩ',
  'Pre-charge complete',
  'Main contactors closed',
];

/** Opening shot: the pack boots, charges to 100%, flashes, and the screen splits open. */
export default function Loader({ onComplete }: { onComplete: () => void }) {
  const root = useRef<HTMLDivElement>(null);
  const done = useRef(onComplete);
  done.current = onComplete;
  const [gone, setGone] = useState(false);

  useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      const num = q('.ld-num')[0] as HTMLElement;
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const tl = gsap.timeline({ onComplete: () => setGone(true) });

      if (reduce) {
        tl.call(() => done.current(), [], 0).to(root.current, { autoAlpha: 0, duration: 0.3 });
        return;
      }

      const count = { v: 0 };
      tl.fromTo(q('.ld-bolt path'), { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1.1, ease: 'power2.inOut' }, 0)
        .to(q('.ld-bolt path'), { fill: 'var(--amp)', duration: 0.4 }, 1.1)
        .to(count, {
          v: 100,
          duration: 2.7,
          ease: 'power3.inOut',
          onUpdate: () => {
            num.textContent = String(Math.round(count.v)).padStart(3, '0');
          },
        }, 0)
        .to(q('.ld-fill'), { scaleX: 1, duration: 2.7, ease: 'power3.inOut' }, 0)
        .to(q('.ld-log li'), { opacity: 1, x: 0, stagger: 0.38, duration: 0.3, ease: 'power2.out' }, 0.25)
        .to(q('.ld-seam'), { scaleX: 1, duration: 0.35, ease: 'power3.out' }, 2.7)
        .to(q('.ld-flash'), { opacity: 1, duration: 0.06 }, 2.75)
        .to(q('.ld-flash'), { opacity: 0, duration: 0.6 }, 2.81)
        .to(q('.ld-center'), { scale: 1.25, opacity: 0, filter: 'blur(12px)', duration: 0.55, ease: 'power2.in' }, 2.7)
        .call(() => done.current(), [], 3.0)
        .to(q('.ld-top'), { yPercent: -100, duration: 1.35, ease: 'expo.inOut' }, 2.95)
        .to(q('.ld-bot'), { yPercent: 100, duration: 1.35, ease: 'expo.inOut' }, 2.95)
        .to(q('.ld-seam'), { opacity: 0, duration: 0.3 }, 3.15);
    },
    { scope: root },
  );

  if (gone) return null;

  return (
    <div className="loader" ref={root} aria-hidden="true">
      <div className="ld-top" />
      <div className="ld-bot" />
      <div className="ld-seam" />
      <div className="ld-center">
        <svg className="ld-bolt" viewBox="0 0 40 64">
          <path d="M25 2 L5 37 H19 L13 62 L35 25 H21 Z" pathLength={1} />
        </svg>
        <div className="ld-num">000</div>
        <div className="ld-bar">
          <div className="ld-fill" />
        </div>
        <ul className="ld-log">
          {LOG.map((l) => (
            <li key={l}>
              {l}
              <span>OK</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="ld-flash" />
    </div>
  );
}
