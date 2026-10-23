'use client';

import { useRef } from 'react';
import { gsap, ScrollTrigger, useGSAP } from '@/lib/gsap';
import { marqueeRows, skillGroups } from '@/lib/data';

function Glyph() {
  return (
    <svg className="mq-glyph" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M13.5 2 5 13.5h6L9.5 22 19 9.5h-6Z" />
    </svg>
  );
}

export default function Skills() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      const skew = gsap.quickTo(q('.mq-rows')[0], 'skewX', { duration: 0.5, ease: 'power3' });
      ScrollTrigger.create({
        trigger: root.current,
        start: 'top bottom',
        end: 'bottom top',
        onUpdate: (self) => skew(gsap.utils.clamp(-14, 14, self.getVelocity() / -260)),
      });
      const reset = () => skew(0);
      ScrollTrigger.addEventListener('scrollEnd', reset);

      q('.sk-group').forEach((g) => {
        gsap.from(g.querySelectorAll('.sk-chip'), {
          y: 40,
          opacity: 0,
          rotate: () => gsap.utils.random(-12, 12),
          scale: 0.7,
          stagger: 0.035,
          duration: 0.8,
          ease: 'back.out(1.8)',
          scrollTrigger: { trigger: g, start: 'top 85%' },
        });
        gsap.from(g.querySelector('h3'), { x: -40, opacity: 0, duration: 0.8, ease: 'power3.out', scrollTrigger: { trigger: g, start: 'top 85%' } });
      });

      return () => ScrollTrigger.removeEventListener('scrollEnd', reset);
    },
    { scope: root },
  );

  return (
    <section className="skills" ref={root} aria-label="Skills">
      <div className="mq-rows" aria-hidden="true">
        {marqueeRows.map((row, ri) => (
          <div className={`mq-row ${ri % 2 ? 'mq-rev' : ''} ${ri === 1 ? 'mq-outline' : ''}`} key={ri}>
            <div className="mq-inner" style={{ animationDuration: `${38 + ri * 8}s` }}>
              {[...row, ...row].map((item, i) => (
                <span className="mq-item" key={i}>
                  {item}
                  <Glyph />
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="wrap sk-grid">
        {skillGroups.map((g) => (
          <div className="sk-group" key={g.title}>
            <h3>{g.title}</h3>
            <ul>
              {g.items.map((it) => (
                <li className="sk-chip" key={it}>
                  {it}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
