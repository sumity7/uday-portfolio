import { mulberry32 } from '@/lib/rng';

type Trace = { d: string; end: [number, number]; dur: number; delay: number };

/** PCB-style traces with 45° bends and vias, generated once from a fixed seed. */
function buildTraces(): Trace[] {
  const r = mulberry32(2022);
  const out: Trace[] = [];
  for (let i = 0; i < 38; i++) {
    const side = Math.floor(r() * 4);
    let x = side === 0 ? 0 : side === 1 ? 1600 : Math.round((r() * 1600) / 20) * 20;
    let y = side === 2 ? 0 : side === 3 ? 900 : Math.round((r() * 900) / 20) * 20;
    let dir: [number, number] = side === 0 ? [1, 0] : side === 1 ? [-1, 0] : side === 2 ? [0, 1] : [0, -1];
    let d = `M${x} ${y}`;
    const segs = 3 + Math.floor(r() * 4);
    for (let s = 0; s < segs; s++) {
      const len = 40 + Math.round(r() * 8) * 20;
      x += dir[0] * len;
      y += dir[1] * len;
      d += ` L${x} ${y}`;
      const turn = r() < 0.5 ? 1 : -1;
      const nd: [number, number] = dir[0] !== 0 ? [0, turn] : [turn, 0];
      const dl = 20 + Math.round(r() * 3) * 10;
      x += (dir[0] + nd[0]) * dl;
      y += (dir[1] + nd[1]) * dl;
      d += ` L${x} ${y}`;
      dir = nd;
    }
    out.push({ d, end: [x, y], dur: Math.round((3 + r() * 5) * 100) / 100, delay: -Math.round(r() * 800) / 100 });
  }
  return out;
}

const TRACES = buildTraces();

export default function CircuitTraces() {
  return (
    <svg className="traces" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      {TRACES.map((t, i) => (
        <g key={i}>
          <path d={t.d} className="trace-base" />
          <path
            d={t.d}
            className="trace-pulse"
            pathLength={1000}
            style={{ animationDuration: `${t.dur}s`, animationDelay: `${t.delay}s` }}
          />
          <circle cx={t.end[0]} cy={t.end[1]} r={4.5} className="trace-via" />
        </g>
      ))}
    </svg>
  );
}
