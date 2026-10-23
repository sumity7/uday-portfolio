'use client';

import { useRef, type PointerEvent } from 'react';
import { gsap, useGSAP } from '@/lib/gsap';
import { certs } from '@/lib/data';
import RevealHeading from './RevealHeading';

export default function Certifications() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      gsap.from(q('.ce-card'), {
        y: 140,
        rotateX: -65,
        opacity: 0,
        transformOrigin: '50% 100%',
        duration: 1.4,
        ease: 'expo.out',
        stagger: 0.12,
        scrollTrigger: { trigger: q('.ce-grid')[0], start: 'top 80%' },
      });
      gsap.from(q('.ce-edu > *'), {
        y: 40,
        opacity: 0,
        duration: 1,
        stagger: 0.12,
        ease: 'power3.out',
        scrollTrigger: { trigger: q('.ce-edu')[0], start: 'top 85%' },
      });
    },
    { scope: root },
  );

  const tilt = (e: PointerEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    el.style.setProperty('--gx', `${px * 100}%`);
    el.style.setProperty('--gy', `${py * 100}%`);
    gsap.to(el, { rotateY: (px - 0.5) * 18, rotateX: (0.5 - py) * 14, duration: 0.6, ease: 'power3.out' });
  };
  const untilt = (e: PointerEvent<HTMLDivElement>) => {
    gsap.to(e.currentTarget, { rotateY: 0, rotateX: 0, duration: 1, ease: 'elastic.out(1, 0.4)' });
  };

  return (
    <section className="certs" ref={root} aria-label="Certifications and education">
      <div className="wrap">
        <RevealHeading text="Certified to the standard." className="h-section" />
        <div className="ce-grid">
          {certs.map((c) => (
            <div className="ce-card" key={c.code} onPointerMove={tilt} onPointerLeave={untilt}>
              <div className="ce-glare" />
              <span className="ce-code">{c.code}</span>
              <svg className="ce-seal" viewBox="0 0 48 48" aria-hidden="true">
                <circle cx="24" cy="24" r="21" />
                <path d="M15 24.5l6 6 12-13" />
              </svg>
              <h3>{c.title}</h3>
              <p>{c.note}</p>
            </div>
          ))}
        </div>
        <div className="ce-edu">
          <div>
            <h3>B.Tech (Hons), Electronics &amp; Communication Engineering</h3>
            <p>IES College of Technology, Bhopal, 2018 to 2022</p>
          </div>
          <div>
            <h3>Languages</h3>
            <p>English and Hindi, full professional proficiency</p>
          </div>
        </div>
      </div>
    </section>
  );
}
