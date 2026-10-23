'use client';

import { useRef } from 'react';
import { gsap, useGSAP } from '@/lib/gsap';
import { stats } from '@/lib/data';

export default function Stats() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      gsap.from(q('.st-item'), {
        y: 120,
        rotateX: -50,
        opacity: 0,
        duration: 1.3,
        ease: 'expo.out',
        stagger: 0.12,
        scrollTrigger: { trigger: root.current, start: 'top 75%' },
      });
      q('.st-item').forEach((item, i) => {
        const num = item.querySelector<HTMLElement>('.st-num')!;
        const s = stats[i];
        const o = { v: 0 };
        gsap.to(o, {
          v: s.value,
          duration: 2.2,
          ease: 'power3.out',
          delay: i * 0.12,
          onUpdate: () => {
            num.textContent = o.v.toFixed(s.decimals);
          },
          scrollTrigger: { trigger: root.current, start: 'top 75%' },
        });
        gsap.fromTo(
          item.querySelector('.st-bar i'),
          { scaleX: 0 },
          { scaleX: 1, duration: 2.2, ease: 'power3.out', delay: i * 0.12, scrollTrigger: { trigger: root.current, start: 'top 75%' } },
        );
      });
      gsap.fromTo(q('.st-ghost'), { xPercent: 10 }, {
        xPercent: -30,
        ease: 'none',
        scrollTrigger: { trigger: root.current, start: 'top bottom', end: 'bottom top', scrub: true },
      });
    },
    { scope: root },
  );

  return (
    <section className="stats" ref={root} aria-label="Career in numbers">
      <div className="st-ghost" aria-hidden="true">
        361.72 kWh 361.72 kWh
      </div>
      <div className="wrap st-grid">
        {stats.map((s) => (
          <div className="st-item" key={s.label}>
            <div className="st-value">
              <span className="st-num">0</span>
              <span className="st-unit">{s.unit}</span>
            </div>
            <div className="st-bar">
              <i />
            </div>
            <p>{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
