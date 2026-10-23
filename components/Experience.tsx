'use client';

import { useRef } from 'react';
import { gsap, ScrollTrigger, useGSAP } from '@/lib/gsap';
import { jobs } from '@/lib/data';

/** Pinned horizontal scene: four roles ride a busbar that charges toward the present. */
export default function Experience() {
  const root = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      const tr = track.current!;
      const fill = q('.ex-bus-fill')[0];
      const spark = q('.ex-bus-spark')[0];
      const dist = () => tr.scrollWidth - window.innerWidth;

      const tween = gsap.to(tr, {
        x: () => -dist(),
        ease: 'none',
        scrollTrigger: {
          trigger: root.current,
          start: 'top top',
          end: () => `+=${dist()}`,
          pin: true,
          scrub: 1,
          invalidateOnRefresh: true,
          anticipatePin: 1,
          onUpdate: (self: { progress: number }) => {
            gsap.set(fill, { scaleX: self.progress });
            gsap.set(spark, { left: `${self.progress * 100}%` });
          },
        },
      });

      q('.ex-panel').forEach((panel) => {
        const year = panel.querySelector('.ex-year');
        if (year) {
          gsap.fromTo(year, { xPercent: 25 }, {
            xPercent: -25,
            ease: 'none',
            scrollTrigger: { trigger: panel, containerAnimation: tween, start: 'left right', end: 'right left', scrub: true },
          });
        }
        gsap.from(panel.querySelectorAll('.ex-anim'), {
          y: 70,
          opacity: 0,
          duration: 1,
          ease: 'power4.out',
          stagger: 0.07,
          scrollTrigger: { trigger: panel, containerAnimation: tween, start: 'left 75%' },
        });
        const node = panel.querySelector('.ex-node');
        if (node) {
          ScrollTrigger.create({
            trigger: panel,
            containerAnimation: tween,
            start: 'left 55%',
            onEnter: () => node.classList.add('on'),
            onLeaveBack: () => node.classList.remove('on'),
          });
        }
      });
    },
    { scope: root },
  );

  return (
    <section className="exp" id="work" ref={root}>
      <div className="ex-track" ref={track}>
        <div className="ex-panel ex-intro">
          <h2 className="h-section ex-anim">Four roles. One direction: more energy.</h2>
          <p className="ex-anim ex-hint">
            Keep scrolling <span aria-hidden="true">⟶</span>
          </p>
        </div>
        {jobs.map((job) => (
          <article className="ex-panel" key={job.title}>
            <div className="ex-year" aria-hidden="true">
              {job.year}
            </div>
            <div className="ex-body">
              <span className="ex-node" aria-hidden="true" />
              <p className="ex-when ex-anim">
                {job.from} to {job.to}
              </p>
              <h3 className="ex-anim">
                {job.title}
                {job.promoted && <span className="ex-promo">Promoted</span>}
              </h3>
              <p className="ex-co ex-anim">
                {job.company}, {job.place}
              </p>
              <ul>
                {job.points.map((p) => (
                  <li className="ex-anim" key={p}>
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          </article>
        ))}
      </div>
      <div className="ex-bus" aria-hidden="true">
        <div className="ex-bus-fill" />
        <div className="ex-bus-spark" />
      </div>
    </section>
  );
}
