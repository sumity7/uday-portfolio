'use client';

import { useEffect, useRef, useState } from 'react';
import { ScrollTrigger, useGSAP } from '@/lib/gsap';

export default function Nav() {
  const ref = useRef<HTMLElement>(null);
  const [time, setTime] = useState('--:--');
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  useEffect(() => {
    const fmt = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Kolkata' });
    const tick = () => setTime(fmt.format(new Date()));
    tick();
    const id = window.setInterval(tick, 15000);
    return () => window.clearInterval(id);
  }, []);

  useGSAP(() => {
    ScrollTrigger.create({
      start: 0,
      end: 'max',
      onUpdate: (self) => {
        const el = ref.current;
        if (!el) return;
        el.classList.toggle('nav-hidden', self.direction === 1 && self.scroll() > 240 && !el.classList.contains('nav-open'));
        // Over page content the blended nav washes out, so give it a solid backing once we leave the top.
        el.classList.toggle('nav-solid', self.scroll() > 40);
      },
    });
  });

  return (
    <header className={`nav${open ? ' nav-open' : ''}`} ref={ref}>
      <a href="#top" className="nav-mark" data-cursor="Top" onClick={() => setOpen(false)}>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="2.5" y="6" width="17" height="12" rx="2" />
          <rect x="19.5" y="10" width="2.5" height="4" rx="0.6" className="nav-tip" />
          <path d="M12.5 7.5 9 12.6h3l-1.2 4 3.7-5.3h-3l1-3.8Z" className="nav-bolt" />
        </svg>
        <span>Udayraj Yadav</span>
      </a>
      <span className="nav-clock">
        <i /> Ahmedabad {time} IST
      </span>
      <button
        type="button"
        className="nav-toggle"
        aria-expanded={open}
        aria-controls="nav-links"
        aria-label={open ? 'Close menu' : 'Open menu'}
        onClick={() => setOpen((o) => !o)}
      >
        <span />
        <span />
      </button>
      <nav id="nav-links" aria-label="Sections" onClick={(e) => (e.target as HTMLElement).closest('a') && setOpen(false)}>
        <a href="#about">About</a>
        <a href="#work">Career</a>
        <a href="#skills">Skills</a>
        <a href="#contact" className="nav-cta">Contact</a>
      </nav>
    </header>
  );
}
