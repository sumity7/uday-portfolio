'use client';

import { useRef } from 'react';
import { gsap, useGSAP } from '@/lib/gsap';
import { scramble } from '@/lib/scramble';
import { profile } from '@/lib/data';
import { SplitChars } from './Split';
import SparkField from './SparkField';
import CircuitTraces from './CircuitTraces';

export default function Hero({ ready }: { ready: boolean }) {
  const root = useRef<HTMLElement>(null);
  const roleRef = useRef<HTMLParagraphElement>(null);

  useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      if (!ready) {
        gsap.set(q('.hero-name .char'), { yPercent: 125, rotateX: -95, opacity: 0 });
        gsap.set(q('.hero-fade'), { opacity: 0, y: 30 });
        gsap.set(q('.hero-rule'), { scaleX: 0 });
        gsap.set(q('.hero-bg'), { scale: 1.3, opacity: 0 });
        return;
      }

      let cancel: (() => void) | undefined;
      gsap
        .timeline({ delay: 0.1 })
        .to(q('.hero-bg'), { scale: 1, opacity: 1, duration: 2.4, ease: 'expo.out' }, 0)
        .to(q('.hero-name .char'), { yPercent: 0, rotateX: 0, opacity: 1, duration: 1.5, ease: 'expo.out', stagger: 0.055 }, 0.1)
        .to(q('.hero-rule'), { scaleX: 1, duration: 1.4, ease: 'expo.inOut' }, 0.4)
        .call(() => {
          if (roleRef.current) cancel = scramble(roleRef.current, profile.role, 1.6);
        }, [], 0.7)
        .to(q('.hero-fade'), { opacity: 1, y: 0, duration: 1.1, ease: 'power3.out', stagger: 0.09 }, 0.7);

      // Camera pull as you leave the hero: the name tears apart and blurs out.
      gsap
        .timeline({ scrollTrigger: { trigger: root.current, start: 'top top', end: 'bottom top', scrub: true } })
        .to(q('.hero-line-1'), { xPercent: -22, opacity: 0.05, filter: 'blur(8px)', ease: 'none' }, 0)
        .to(q('.hero-line-2'), { xPercent: 22, opacity: 0.05, filter: 'blur(8px)', ease: 'none' }, 0)
        .to(q('.hero-bg'), { scale: 1.35, opacity: 0.25, ease: 'none' }, 0)
        .to(q('.hero-top, .hero-bottom'), { y: -100, opacity: 0, ease: 'none' }, 0);

      return () => cancel?.();
    },
    { scope: root, dependencies: [ready] },
  );

  return (
    <section className="hero" id="top" ref={root} data-cursor="Click to discharge">
      <div className="hero-bg">
        <CircuitTraces />
        <SparkField />
      </div>
      <div className="hero-vignette" />

      <div className="hero-content">
        <div className="hero-top hero-fade">
          <span>Electronics &amp; Communication Engineer</span>
          <span>{profile.location}</span>
        </div>

        <h1 className="hero-name">
          <span className="hero-line hero-line-1">
            <SplitChars text="UDAYRAJ" />
          </span>
          <span className="hero-line hero-line-2">
            <SplitChars text="YADAV" />
          </span>
        </h1>

        <div className="hero-rule" />

        <div className="hero-bottom">
          <p className="hero-role hero-fade" ref={roleRef}>
            {profile.role}
          </p>
          <p className="hero-sub hero-fade">
            Four years taking lithium-ion packs from the first cell test to commissioned, grid-ready storage.
          </p>
          <div className="hero-scroll hero-fade">
            <span className="hero-scroll-track">
              <span />
            </span>
            Scroll to charge
          </div>
        </div>
      </div>

      <a href="#contact" className="hero-badge hero-fade" data-cursor="Let's talk">
        <svg viewBox="0 0 200 200" aria-hidden="true">
          <defs>
            <path id="badge-circle" d="M100,100 m-78,0 a78,78 0 1,1 156,0 a78,78 0 1,1 -156,0" />
          </defs>
          <text>
            <textPath href="#badge-circle">Available for BESS projects • Available for BESS projects • </textPath>
          </text>
        </svg>
        <span className="hero-badge-core">
          <svg viewBox="0 0 40 64" aria-hidden="true">
            <path d="M25 2 L5 37 H19 L13 62 L35 25 H21 Z" />
          </svg>
        </span>
        <span className="sr-only">Contact Udayraj</span>
      </a>
    </section>
  );
}
