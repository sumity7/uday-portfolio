'use client';

import { useRef } from 'react';
import { gsap, ScrollTrigger, useGSAP } from '@/lib/gsap';

const SEGMENTS = 12;

/** The whole page is a pack: scrolling charges it from 0 to 100% SOC. */
export default function ChargeMeter() {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      const segs = q('.cm-seg') as HTMLElement[];
      const pct = q('.cm-pct')[0] as HTMLElement;
      const volt = q('.cm-v')[0] as HTMLElement;
      ScrollTrigger.create({
        start: 0,
        end: 'max',
        onUpdate: (self) => {
          const p = self.progress;
          pct.textContent = `${Math.round(p * 100)}%`;
          volt.textContent = `${(2.8 + p * 0.85).toFixed(2)} V`;
          segs.forEach((s, i) => s.classList.toggle('on', p * SEGMENTS > i + 0.01));
          root.current?.classList.toggle('full', p > 0.995);
        },
      });
    },
    { scope: root },
  );

  return (
    <div className="cm" ref={root} aria-hidden="true">
      <div className="cm-cap" />
      <div className="cm-body">
        {Array.from({ length: SEGMENTS }, (_, i) => (
          <span className="cm-seg" key={i} />
        ))}
      </div>
      <div className="cm-pct">0%</div>
      <div className="cm-v">2.80 V</div>
    </div>
  );
}
