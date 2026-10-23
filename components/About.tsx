'use client';

import Image from 'next/image';
import { useRef } from 'react';
import { gsap, useGSAP } from '@/lib/gsap';
import RevealHeading from './RevealHeading';
import { SplitWords } from './Split';

export default function About() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      const photo = q('.ab-photo')[0];

      gsap.fromTo(
        photo,
        { clipPath: 'inset(100% 0% 0% 0%)' },
        { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.8, ease: 'expo.inOut', scrollTrigger: { trigger: photo, start: 'top 80%' } },
      );
      gsap.fromTo(
        q('.ab-photo img'),
        { scale: 1.4, yPercent: -6 },
        { scale: 1.08, yPercent: 6, ease: 'none', scrollTrigger: { trigger: root.current, start: 'top bottom', end: 'bottom top', scrub: true } },
      );
      gsap.from(q('.ab-hud > *'), {
        opacity: 0,
        scale: 0.4,
        duration: 0.9,
        stagger: 0.08,
        ease: 'back.out(2.2)',
        scrollTrigger: { trigger: photo, start: 'top 55%' },
      });
      q('.ab-text').forEach((p) => {
        gsap.to(p.querySelectorAll('.word'), {
          opacity: 1,
          color: 'var(--ink)',
          stagger: 0.05,
          ease: 'none',
          scrollTrigger: { trigger: p, start: 'top 82%', end: 'bottom 55%', scrub: true },
        });
      });
    },
    { scope: root },
  );

  return (
    <section className="about" id="about" ref={root}>
      <div className="wrap ab-grid">
        <div className="ab-photo" data-cursor="Hello">
          <Image src="/udayraj.jpg" alt="Portrait of Udayraj Yadav" fill sizes="(max-width: 900px) 90vw, 42vw" />
          <div className="ab-tint" />
          <div className="ab-scan" />
          <div className="ab-hud" aria-hidden="true">
            <span className="ab-c tl" />
            <span className="ab-c tr" />
            <span className="ab-c bl" />
            <span className="ab-c br" />
            <span className="ab-id">ID UY-ECE-2022</span>
            <span className="ab-geo">23.02° N, 72.57° E</span>
            <span className="ab-rec">
              <i /> Live
            </span>
          </div>
        </div>

        <div className="ab-copy">
          <RevealHeading text="Find the failure before the field does." className="h-section" />
          <p className="ab-text">
            <SplitWords text="I work in new product development at Grace Renewable Energy, leading the integration of liquid-cooled battery energy storage systems with inverters, power conversion systems and energy management systems." />
          </p>
          <p className="ab-text">
            <SplitWords text="Before a pack ships, I have validated its BMS, calibrated its state-of-charge and state-of-health algorithms, and written the design validation plan it has to pass. Test to the standard, then test past it." />
          </p>
        </div>
      </div>
    </section>
  );
}
