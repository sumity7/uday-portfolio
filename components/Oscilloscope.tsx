'use client';

import { useEffect, useRef, useState } from 'react';
import RevealHeading from './RevealHeading';

type Trace = { name: string; seq: number[]; tone: 'volt' | 'amp'; clock?: boolean };
type Proto = { key: string; label: string; readout: string; decoded: { k: string; v: string }[]; traces: () => Trace[] };

const bits = (byte: number) => Array.from({ length: 8 }, (_, i) => (byte >> (7 - i)) & 1);

const PROTOCOLS: Proto[] = [
  {
    key: 'CAN',
    label: 'CAN',
    readout: 'CH1 CAN_H  CH2 CAN_L  500 kbit/s',
    decoded: [
      { k: 'ID', v: '0x18FF50E5' },
      { k: 'Pack voltage', v: '812.4 V' },
      { k: 'Current', v: '−124.6 A' },
    ],
    traces: () => {
      const s = [1, 1, 0, ...bits(0x18), ...bits(0xff), ...bits(0x50), 0, 1, 1, 0, 1, 1, 1];
      return [
        { name: 'CAN_H', seq: s.map((b) => (b ? 0.5 : 0.2)), tone: 'volt' },
        { name: 'CAN_L', seq: s.map((b) => (b ? 0.5 : 0.8)), tone: 'amp' },
      ];
    },
  },
  {
    key: 'RS485',
    label: 'RS-485',
    readout: 'CH1 A  CH2 B  Modbus RTU  9600 baud',
    decoded: [
      { k: 'Register', v: '40001' },
      { k: 'PCS state', v: 'Grid-tied, discharging' },
    ],
    traces: () => {
      const s = [1, 1, 0, ...bits(0x01), 1, 0, ...bits(0x03), 1, 0, ...bits(0x9c), 1, 1, 1];
      return [
        { name: 'A', seq: s.map((b) => (b ? 0.25 : 0.45)), tone: 'volt' },
        { name: 'B', seq: s.map((b) => (b ? 0.75 : 0.55)), tone: 'amp' },
      ];
    },
  },
  {
    key: 'UART',
    label: 'UART',
    readout: 'CH1 TX  115200 baud  8N1',
    decoded: [
      { k: 'TX', v: '"SOC"' },
      { k: 'Source', v: 'BMS debug console' },
    ],
    traces: () => {
      const s = [1, 1];
      for (const c of 'SOC') s.push(0, ...bits(c.charCodeAt(0)).reverse(), 1, 1);
      return [{ name: 'TX', seq: s.map((b) => (b ? 0.3 : 0.7)), tone: 'volt' }];
    },
  },
  {
    key: 'I2C',
    label: 'I²C',
    readout: 'CH1 SCL  CH2 SDA  400 kHz',
    decoded: [
      { k: 'Address', v: '0x08 (AFE)' },
      { k: 'Cell 14', v: '3.312 V' },
    ],
    traces: () => {
      const sda = [1, 0, ...bits(0x10), 0, ...bits(0x4e), 0, 0, 1, 1];
      return [
        { name: 'SCL', seq: sda.map((_, i) => (i < 2 || i > sda.length - 3 ? 1 : 0)), tone: 'amp', clock: true },
        { name: 'SDA', seq: sda.map((b) => (b ? 0.58 : 0.82)), tone: 'volt' },
      ];
    },
  },
  {
    key: 'SPI',
    label: 'SPI',
    readout: 'CH1 SCLK  CH2 MOSI  1 MHz',
    decoded: [
      { k: 'Command', v: '0x02' },
      { k: 'Isolation', v: '> 500 MΩ' },
    ],
    traces: () => {
      const mosi = [0, 0, ...bits(0x02), ...bits(0xa5), 0, 0];
      return [
        { name: 'SCLK', seq: mosi.map((_, i) => (i < 2 || i > mosi.length - 3 ? 0 : 1)), tone: 'amp', clock: true },
        { name: 'MOSI', seq: mosi.map((b) => (b ? 0.58 : 0.82)), tone: 'volt' },
      ];
    },
  },
];

const TONES = { volt: '61,245,255', amp: '255,176,32' };

export default function Oscilloscope() {
  const [active, setActive] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const state = useRef({ traces: PROTOCOLS[0].traces(), sweep: 0, hold: 0 });

  useEffect(() => {
    state.current.traces = PROTOCOLS[active].traces();
    state.current.sweep = 0;
    state.current.hold = 0;
  }, [active]);

  useEffect(() => {
    const c = canvasRef.current!;
    const ctx = c.getContext('2d')!;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let W = 0;
    let H = 0;
    let raf = 0;
    let visible = false;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = c.clientWidth;
      H = c.clientHeight;
      c.width = Math.max(1, W * dpr);
      c.height = Math.max(1, H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = () => {
      const st = state.current;
      if (st.sweep < 1) st.sweep = reduce ? 1 : Math.min(1, st.sweep + 0.009);
      else if (!reduce && ++st.hold > 140) {
        st.hold = 0;
        st.sweep = 0;
      }
      ctx.clearRect(0, 0, W, H);
      const pad = 18;
      const xw = W - pad * 2;
      const lim = pad + xw * st.sweep;

      for (const tr of st.traces) {
        const col = TONES[tr.tone];
        const n = tr.seq.length;
        const step = xw / n;
        const rise = step * 0.1;
        const jitter = () => (Math.random() - 0.5) * 0.9;
        ctx.beginPath();
        if (tr.clock) {
          const hi = H * 0.16;
          const lo = H * 0.4;
          ctx.moveTo(pad, lo);
          for (let i = 0; i < n; i++) {
            const x = pad + i * step;
            if (x > lim) break;
            if (tr.seq[i]) {
              ctx.lineTo(x + rise, hi + jitter());
              ctx.lineTo(Math.min(lim, x + step / 2), hi + jitter());
              if (x + step / 2 < lim) {
                ctx.lineTo(x + step / 2 + rise, lo + jitter());
                ctx.lineTo(Math.min(lim, x + step), lo + jitter());
              }
            } else ctx.lineTo(Math.min(lim, x + step), lo + jitter());
          }
        } else {
          let py = tr.seq[0] * H;
          ctx.moveTo(pad, py);
          for (let i = 0; i < n; i++) {
            const x = pad + i * step;
            if (x > lim) break;
            const y = tr.seq[i] * H;
            if (y !== py) ctx.lineTo(x + rise, y + jitter());
            ctx.lineTo(Math.min(lim, x + step), y + jitter());
            py = y;
          }
        }
        ctx.lineJoin = 'round';
        ctx.strokeStyle = `rgba(${col},0.18)`;
        ctx.lineWidth = 9;
        ctx.stroke();
        ctx.strokeStyle = `rgba(${col},0.95)`;
        ctx.lineWidth = 2;
        ctx.shadowColor = `rgba(${col},0.9)`;
        ctx.shadowBlur = 12;
        ctx.stroke();
        ctx.shadowBlur = 0;

        ctx.fillStyle = `rgba(${col},1)`;
        ctx.font = '600 12px var(--font-mono), monospace';
        const labelY = Math.min(...tr.seq.map((v) => (tr.clock ? 0.16 : v))) * H - 10;
        ctx.fillText(tr.name, pad + 4, Math.max(14, labelY));
      }

      if (st.sweep < 1) {
        const g = ctx.createLinearGradient(lim - 60, 0, lim, 0);
        g.addColorStop(0, 'rgba(61,245,255,0)');
        g.addColorStop(1, 'rgba(61,245,255,0.18)');
        ctx.fillStyle = g;
        ctx.fillRect(lim - 60, 0, 60, H);
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.fillRect(lim - 1, 0, 2, H);
      }
    };

    const loop = () => {
      if (visible) draw();
      raf = requestAnimationFrame(loop);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(c);
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
    });
    io.observe(c);
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
    };
  }, []);

  const p = PROTOCOLS[active];

  return (
    <section className="scope-sec" id="skills">
      <div className="wrap">
        <RevealHeading text="The languages a battery speaks." className="h-section" />
        <p className="lead">Every pack I test talks over one of these buses. Pick one to put it on the scope.</p>

        <div className="scope">
          <div className="scope-top">
            <div className="scope-chans" role="group" aria-label="Choose a protocol">
              {PROTOCOLS.map((pr, i) => (
                <button key={pr.key} type="button" aria-pressed={i === active} onClick={() => setActive(i)} data-cursor="Probe">
                  {pr.label}
                </button>
              ))}
            </div>
            <div className="scope-readout">{p.readout}</div>
          </div>
          <div className="scope-screen">
            <canvas ref={canvasRef} aria-hidden="true" />
            <span className="scope-trig">TRIG ▲</span>
          </div>
          <div className="scope-decode" aria-live="polite">
            <span>Decoded</span>
            {p.decoded.map((d) => (
              <span key={d.k} className="scope-chip">
                {d.k} <b>{d.v}</b>
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
