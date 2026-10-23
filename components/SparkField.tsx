'use client';

import { useEffect, useRef } from 'react';

type Tone = 'volt' | 'amp';
type Particle = { x: number; y: number; vx: number; vy: number; life: number; hot: number };
type Bolt = { pts: [number, number][]; life: number; width: number };

const COLORS: Record<Tone, { base: number[]; hot: number[] }> = {
  volt: { base: [61, 245, 255], hot: [255, 176, 32] },
  amp: { base: [255, 176, 32], hot: [255, 92, 56] },
};

/**
 * Electrons drifting through a flow field. They swirl around the pointer like a
 * magnetic field, and a click discharges lightning into the nearest particles.
 */
export default function SparkField({ tone = 'volt', count = 180 }: { tone?: Tone; count?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext('2d')!;
    const host = (canvas.closest('section') as HTMLElement | null) ?? canvas.parentElement!;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const { base, hot } = COLORS[tone];
    const rgba = (c: number[], a: number) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;

    let W = 0;
    let H = 0;
    let t = 0;
    let raf = 0;
    let visible = true;
    let flash = 0;
    let particles: Particle[] = [];
    const bolts: Bolt[] = [];
    const hotOnes: (Particle | number)[] = [];
    const mouse = { x: -9999, y: -9999, active: false };

    const spawn = (): Particle => ({ x: Math.random() * W, y: Math.random() * H, vx: 0, vy: 0, life: 200 + Math.random() * 500, hot: 0 });

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, canvas.clientWidth < 700 ? 1.5 : 2);
      W = canvas.clientWidth;
      H = canvas.clientHeight;
      canvas.width = Math.max(1, W * dpr);
      canvas.height = Math.max(1, H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = W < 700 ? Math.round(count * 0.5) : count;
      particles = Array.from({ length: n }, spawn);
    };

    const field = (x: number, y: number) =>
      Math.sin(x * 0.0021 + t * 0.00025) * Math.PI + Math.cos(y * 0.0027 - t * 0.0002) * Math.PI;

    const makeBolt = (x1: number, y1: number, x2: number, y2: number, width: number): Bolt => {
      let pts: [number, number][] = [
        [x1, y1],
        [x2, y2],
      ];
      let offset = Math.hypot(x2 - x1, y2 - y1) * 0.28;
      for (let g = 0; g < 6; g++) {
        const next: [number, number][] = [];
        for (let i = 0; i < pts.length - 1; i++) {
          const [ax, ay] = pts[i];
          const [bx, by] = pts[i + 1];
          next.push([ax, ay], [(ax + bx) / 2 + (Math.random() - 0.5) * offset, (ay + by) / 2 + (Math.random() - 0.5) * offset]);
        }
        next.push(pts[pts.length - 1]);
        pts = next;
        offset *= 0.52;
      }
      return { pts, life: 1, width };
    };

    const discharge = (x: number, y: number) => {
      const near = [...particles].sort((a, b) => Math.hypot(a.x - x, a.y - y) - Math.hypot(b.x - x, b.y - y)).slice(0, 4);
      near.forEach((p, i) => bolts.push(makeBolt(x, y, p.x + (p.x - x) * 1.6, p.y + (p.y - y) * 1.6, i === 0 ? 2.6 : 1.4)));
      const ang = Math.random() * Math.PI * 2;
      bolts.push(makeBolt(x, y, x + Math.cos(ang) * W * 0.45, y + Math.sin(ang) * H * 0.45, 2));
      for (const p of particles) {
        const d = Math.hypot(p.x - x, p.y - y);
        if (d < 280 && d > 1) {
          const f = (280 - d) / 280;
          p.vx += ((p.x - x) / d) * f * 11;
          p.vy += ((p.y - y) / d) * f * 11;
          p.hot = 1;
        }
      }
      flash = 1;
    };

    const drawBolt = (b: Bolt) => {
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      b.pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      ctx.strokeStyle = rgba(hot, 0.25 * b.life);
      ctx.lineWidth = b.width * 6;
      ctx.stroke();
      ctx.strokeStyle = rgba(base, 0.7 * b.life);
      ctx.lineWidth = b.width * 2.2;
      ctx.stroke();
      ctx.strokeStyle = `rgba(255,255,255,${b.life})`;
      ctx.lineWidth = b.width * 0.7;
      ctx.stroke();
    };

    const step = () => {
      t += 16;
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = 'rgba(0,0,0,0.13)';
      ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'lighter';

      // Cool particles share one style, so they go out as a single path; only the few hot ones are stroked individually.
      ctx.strokeStyle = rgba(base, 0.32);
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      for (const p of particles) {
        const a = field(p.x, p.y);
        p.vx += Math.cos(a) * 0.12;
        p.vy += Math.sin(a) * 0.12;
        if (mouse.active) {
          const dx = mouse.x - p.x;
          const dy = mouse.y - p.y;
          const d = Math.hypot(dx, dy);
          if (d < 190 && d > 1) {
            const f = (190 - d) / 190;
            p.vx += (-dy / d) * f * 0.95 + (dx / d) * f * 0.14;
            p.vy += (dx / d) * f * 0.95 + (dy / d) * f * 0.14;
            p.hot = Math.max(p.hot, f);
          }
        }
        p.vx *= 0.93;
        p.vy *= 0.93;
        const ox = p.x;
        const oy = p.y;
        p.x += p.vx;
        p.y += p.vy;
        p.hot *= 0.975;
        p.life -= 1;
        if (p.x < -20 || p.x > W + 20 || p.y < -20 || p.y > H + 20 || p.life < 0) {
          Object.assign(p, spawn());
          continue;
        }
        if (p.hot < 0.05) {
          ctx.moveTo(ox, oy);
          ctx.lineTo(p.x, p.y);
          continue;
        }
        hotOnes.push(p, ox, oy);
      }
      ctx.stroke();

      for (let i = 0; i < hotOnes.length; i += 3) {
        const p = hotOnes[i] as Particle;
        const c = p.hot > 0.3 ? hot : base;
        ctx.strokeStyle = rgba(c, 0.32 + p.hot * 0.6);
        ctx.lineWidth = 1.1 + p.hot * 1.4;
        ctx.beginPath();
        ctx.moveTo(hotOnes[i + 1] as number, hotOnes[i + 2] as number);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
      }
      hotOnes.length = 0;

      if (!reduce && Math.random() < 0.007 && particles.length > 2) {
        const a = particles[(Math.random() * particles.length) | 0];
        const b = particles.find((o) => {
          const d = Math.hypot(o.x - a.x, o.y - a.y);
          return o !== a && d > 80 && d < 230;
        });
        if (b) bolts.push(makeBolt(a.x, a.y, b.x, b.y, 0.9));
      }

      for (let i = bolts.length - 1; i >= 0; i--) {
        drawBolt(bolts[i]);
        bolts[i].life -= 0.07;
        if (bolts[i].life <= 0) bolts.splice(i, 1);
      }

      if (flash > 0.02) {
        ctx.fillStyle = rgba(base, flash * 0.08);
        ctx.fillRect(0, 0, W, H);
        flash *= 0.82;
      }
    };

    const loop = () => {
      if (visible) step();
      raf = requestAnimationFrame(loop);
    };

    const local = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    const onMove = (e: PointerEvent) => {
      const p = local(e);
      mouse.x = p.x;
      mouse.y = p.y;
      mouse.active = true;
    };
    const onLeave = () => {
      mouse.active = false;
    };
    const onDown = (e: PointerEvent) => {
      if ((e.target as HTMLElement).closest('a, button')) return;
      const p = local(e);
      discharge(p.x, p.y);
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    io.observe(canvas);
    host.addEventListener('pointermove', onMove);
    host.addEventListener('pointerleave', onLeave);
    host.addEventListener('pointerdown', onDown);
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      host.removeEventListener('pointermove', onMove);
      host.removeEventListener('pointerleave', onLeave);
      host.removeEventListener('pointerdown', onDown);
    };
  }, [tone, count]);

  return <canvas ref={ref} className="sparkfield" aria-hidden="true" />;
}
