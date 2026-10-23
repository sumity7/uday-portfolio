'use client';

import { useRef } from 'react';
import { gsap, useGSAP } from '@/lib/gsap';
import { profile } from '@/lib/data';
import { SplitChars } from './Split';
import SparkField from './SparkField';
import Magnetic from './Magnetic';

export default function Contact() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      gsap.from(q('.ct-title .char'), {
        yPercent: 130,
        rotateX: -90,
        opacity: 0,
        duration: 1.4,
        ease: 'expo.out',
        stagger: 0.03,
        scrollTrigger: { trigger: q('.ct-title')[0], start: 'top 80%' },
      });
      gsap.from(q('.ct-fade'), {
        y: 50,
        opacity: 0,
        duration: 1,
        ease: 'power3.out',
        stagger: 0.1,
        scrollTrigger: { trigger: q('.ct-title')[0], start: 'top 65%' },
      });
      gsap.fromTo(q('.ct-bg'), { opacity: 0, scale: 1.2 }, {
        opacity: 1,
        scale: 1,
        ease: 'none',
        scrollTrigger: { trigger: root.current, start: 'top bottom', end: 'top top', scrub: true },
      });
    },
    { scope: root },
  );

  return (
    <section className="contact" id="contact" ref={root} data-cursor="Click to discharge">
      <div className="ct-bg">
        <SparkField tone="amp" count={130} />
      </div>
      <div className="wrap ct-inner">
        <h2 className="ct-title">
          <span className="ct-line">
            <SplitChars text="Let's power" />
          </span>
          <span className="ct-line">
            <SplitChars text="the next grid." />
          </span>
        </h2>
        <p className="ct-lead ct-fade">Open to BESS, ESS and EV battery roles, projects and collaborations.</p>
        <div className="ct-links ct-fade">
          <Magnetic>
            <a className="ct-btn ct-primary" href={`mailto:${profile.email}`} data-cursor="Write">
              <span>Email</span>
              <small>{profile.email}</small>
            </a>
          </Magnetic>
          <Magnetic>
            <a className="ct-btn" href={profile.phoneHref} data-cursor="Call">
              <span>Call</span>
              <small>{profile.phone}</small>
            </a>
          </Magnetic>
          <Magnetic>
            <a className="ct-btn" href={profile.linkedin} target="_blank" rel="noopener noreferrer" data-cursor="Open">
              <span>LinkedIn</span>
              <small>View profile</small>
            </a>
          </Magnetic>
        </div>
      </div>
      <footer className="ct-foot wrap">
        <span>© {new Date().getFullYear()} Udayraj Yadav</span>
        <span>Pack at 100%. Thanks for charging it.</span>
        <a href="#top">Back to top</a>
      </footer>
    </section>
  );
}
