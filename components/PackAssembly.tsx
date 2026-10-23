'use client';

import { useRef } from 'react';
import { gsap, useGSAP } from '@/lib/gsap';

/*
 * One world, one camera. The world is drawn once at system scale; the scene is a
 * scroll-scrubbed camera pull-back from a single cell to the whole BESS on the grid.
 */

const CW = 12.5; // cell pitch x (world units)
const CH = 15; // cell pitch y
const COLS = 12;
const ROWS = 4;
const RACK_X = [175, 375, 575]; // multiples of CW so the cell pattern aligns
const SLOT_Y = Array.from({ length: 6 }, (_, j) => 195 + j * 75); // multiples of CH
const HERO = { x: RACK_X[1], y: SLOT_Y[0] }; // the module we zoom out from
const CELL = { x: HERO.x + 1.25, y: HERO.y + 1.5, w: 10, h: 12 };

const HERO_CELLS = Array.from({ length: COLS * ROWS }, (_, i) => ({ c: i % COLS, r: Math.floor(i / COLS) })).filter(
  (k) => !(k.c === 0 && k.r === 0),
);

type Shot = { s: number; cx: number; cy: number };
const SHOTS: { land: Shot[]; port: Shot[] } = {
  land: [
    { s: 30, cx: CELL.x + 5, cy: CELL.y + 6 },
    { s: 7, cx: HERO.x + 75, cy: HERO.y + 30 },
    { s: 1.55, cx: HERO.x + 75, cy: 412 },
    { s: 0.82, cx: 540, cy: 455 },
  ],
  port: [
    { s: 24, cx: CELL.x + 5, cy: CELL.y + 6 },
    { s: 4.2, cx: HERO.x + 75, cy: HERO.y + 30 },
    { s: 2, cx: HERO.x + 75, cy: 412 },
    { s: 0.72, cx: 580, cy: 405 },
  ],
};

const STAGES = [
  { tag: 'Cell', title: 'It starts with one cell.', body: 'Every system I validate begins here: electrochemical characterisation, HPPC, DCIR and lifecycle testing.' },
  { tag: 'Module', title: 'Cells become a module.', body: 'Balanced, monitored and protected by a BMS whose SOC and SOH algorithms I calibrate and validate.' },
  { tag: 'Rack', title: 'Modules stack into racks.', body: 'Each one tested against a design validation plan written for IEC, UL and UN compliance.' },
  { tag: 'System', title: 'Racks become a grid asset.', body: 'Liquid-cooled, integrated with PCS, inverter and EMS, then commissioned on site.' },
];

export default function PackAssembly() {
  const root = useRef<HTMLElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const camRef = useRef<SVGGElement>(null);

  useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      const svg = svgRef.current!;
      const camEl = camRef.current!;
      const portrait = window.innerWidth < window.innerHeight;
      const shots = portrait ? SHOTS.port : SHOTS.land;
      const vbW = portrait ? 700 : 1200;
      const vbH = portrait ? 1000 : 700;
      svg.setAttribute('viewBox', `0 0 ${vbW} ${vbH}`);

      const cam = { ...shots[0] };
      const zoomEl = q('.pk-zoom')[0] as HTMLElement;
      const apply = () => {
        camEl.setAttribute('transform', `translate(${vbW / 2} ${vbH / 2}) scale(${cam.s}) translate(${-cam.cx} ${-cam.cy})`);
        zoomEl.textContent = `${(cam.s / shots[3].s).toFixed(1)}×`;
      };
      apply();

      const caps = q('.pk-cap');
      const steps = q('.pk-step');
      const kwh = q('.pk-kwh')[0] as HTMLElement;
      const energy = { v: 0 };
      const showEnergy = () => {
        kwh.textContent = energy.v.toFixed(2).padStart(6, '0');
      };

      gsap.set(caps, { autoAlpha: 0, y: 50 });
      gsap.set(caps[0], { autoAlpha: 1, y: 0 });
      gsap.set(q('.pk-hcell'), { opacity: 0.12 });
      gsap.set(q('.pk-rack1, .pk-other'), { opacity: 0.1 });
      gsap.set(q('.pk-draw'), { strokeDashoffset: 1 });
      gsap.set(q('.pk-sys, .pk-energy, .pk-racklabel'), { autoAlpha: 0 });

      const tl = gsap.timeline({
        defaults: { ease: 'power2.inOut' },
        scrollTrigger: {
          trigger: root.current,
          start: 'top top',
          end: '+=450%',
          pin: true,
          scrub: 1,
          anticipatePin: 1,
        },
        onUpdate: () => {
          const tm = tl.time();
          const L = tl.labels;
          const stage = tm < L.module + 0.4 ? 0 : tm < L.rack + 0.4 ? 1 : tm < L.system + 0.4 ? 2 : 3;
          steps.forEach((el, i) => el.classList.toggle('on', i <= stage));
        },
      });

      const swap = (from: number, to: number, at: string) => {
        tl.to(caps[from], { autoAlpha: 0, y: -50, duration: 0.45, ease: 'power2.in' }, at).to(
          caps[to],
          { autoAlpha: 1, y: 0, duration: 0.6, ease: 'power3.out' },
          `${at}+=0.35`,
        );
      };

      // Shot 1: the cell charges up.
      tl.fromTo(
        q('.pk-cellfill'),
        { attr: { y: CELL.y + CELL.h - 0.8, height: 0 } },
        { attr: { y: CELL.y + 0.8, height: CELL.h - 1.6 }, duration: 1.1, ease: 'none' },
        0,
      )
        .to(q('.pk-cellglow'), { opacity: 1, duration: 0.6 }, 0.5)

        // Shot 2: pull back to the module, the other cells light in a wave.
        .addLabel('module', 1.3)
        .to(cam, { ...shots[1], duration: 1.7, onUpdate: apply }, 'module')
        .to(q('.pk-cellglow'), { opacity: 0, duration: 0.6 }, 'module+=0.6')
        .to(q('.pk-hcell'), { opacity: 1, duration: 0.25, stagger: 0.02, ease: 'none' }, 'module+=0.8');
      swap(0, 1, 'module+=0.2');

      // Shot 3: pull back to the rack.
      tl.addLabel('rack', 'module+=2.8')
        .to(cam, { ...shots[2], duration: 1.7, onUpdate: apply }, 'rack')
        .to(q('.pk-rack1'), { opacity: 1, duration: 0.4, stagger: 0.15 }, 'rack+=0.9')
        .to(q('.pk-racklabel'), { autoAlpha: 1, duration: 0.4 }, 'rack+=1.1');
      swap(1, 2, 'rack+=0.2');

      // Shot 4: the full system, cooling loop and grid connection.
      tl.addLabel('system', 'rack+=2.8')
        .to(cam, { ...shots[3], duration: 1.9, onUpdate: apply }, 'system')
        .to(q('.pk-other'), { opacity: 1, duration: 0.4, stagger: { each: 0.03, from: 'random' } }, 'system+=0.5')
        .to(q('.pk-draw'), { strokeDashoffset: 0, duration: 1.1, stagger: 0.08 }, 'system+=0.9')
        .to(q('.pk-sys'), { autoAlpha: 1, duration: 0.5, stagger: 0.12 }, 'system+=1.4')
        .to(q('.pk-energy'), { autoAlpha: 1, duration: 0.4 }, 'system+=1.2')
        .to(energy, { v: 361.72, duration: 1.4, ease: 'power2.out', onUpdate: showEnergy }, 'system+=1.2')
        .to({}, { duration: 0.8 });
      swap(2, 3, 'system+=0.2');
    },
    { scope: root },
  );

  return (
    <section className="pack" id="build" ref={root} aria-label="From one cell to a grid-scale battery system">
      <svg ref={svgRef} className="pk-svg" viewBox="0 0 1200 700" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
        <defs>
          <pattern id="pk-cells" width={CW} height={CH} patternUnits="userSpaceOnUse">
            <rect x={1.25} y={1.5} width={10} height={12} rx={1.4} className="pk-pcell" />
          </pattern>
          <linearGradient id="pk-fillgrad" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0" stopColor="#0aa6c9" />
            <stop offset="1" stopColor="#7dfbff" />
          </linearGradient>
          <radialGradient id="pk-glowgrad">
            <stop offset="0" stopColor="#3df5ff" stopOpacity="0.55" />
            <stop offset="1" stopColor="#3df5ff" stopOpacity="0" />
          </radialGradient>
          <pattern id="pk-floor" width={25} height={25} patternUnits="userSpaceOnUse">
            <path d="M25 0H0V25" className="pk-floorline" />
          </pattern>
        </defs>

        <g ref={camRef}>
          <rect x={-400} y={-300} width={2000} height={1300} fill="url(#pk-floor)" />

          {/* container */}
          <path className="pk-container pk-draw" d="M140 150 H770 V670 H140 Z" pathLength={1} />
          <text className="pk-label pk-sys" x={140} y={138}>
            BESS container, liquid-cooled
          </text>

          {/* racks and modules */}
          {RACK_X.map((rx, ri) => (
            <g key={rx}>
              <rect className="pk-rackframe" x={rx - 10} y={180} width={170} height={465} rx={4} />
              <text className="pk-label pk-small pk-racklabel" x={rx - 10} y={175}>
                Rack {ri + 1}
              </text>
              {SLOT_Y.map((sy, si) => {
                const isHero = ri === 1 && si === 0;
                return (
                  <g key={sy}>
                    <rect className="pk-module" x={rx - 2} y={sy - 3} width={154} height={66} rx={3} />
                    {!isHero && (
                      <rect className={ri === 1 ? 'pk-rack1' : 'pk-other'} x={rx} y={sy} width={150} height={60} fill="url(#pk-cells)" />
                    )}
                  </g>
                );
              })}
            </g>
          ))}

          {/* the hero module, cell by cell */}
          {HERO_CELLS.map(({ c, r }) => (
            <rect key={`${c}-${r}`} className="pk-hcell" x={HERO.x + c * CW + 1.25} y={HERO.y + r * CH + 1.5} width={10} height={12} rx={1.4} />
          ))}

          {/* the hero cell */}
          <circle className="pk-cellglow" cx={CELL.x + 5} cy={CELL.y + 6} r={11} fill="url(#pk-glowgrad)" opacity={0} />
          <rect className="pk-cellbody" x={CELL.x} y={CELL.y} width={CELL.w} height={CELL.h} rx={1.2} />
          <rect className="pk-cellfill" x={CELL.x + 0.8} y={CELL.y + CELL.h - 0.8} width={CELL.w - 1.6} height={0} rx={0.6} fill="url(#pk-fillgrad)" />
          <rect className="pk-term" x={CELL.x + 1.6} y={CELL.y - 0.7} width={2.2} height={0.9} rx={0.2} />
          <rect className="pk-term" x={CELL.x + 6.2} y={CELL.y - 0.7} width={2.2} height={0.9} rx={0.2} />
          <text className="pk-celltext" x={CELL.x + 5} y={CELL.y + 4} textAnchor="middle">
            LFP
          </text>
          <text className="pk-celltext pk-celltext-sm" x={CELL.x + 5} y={CELL.y + 5.4} textAnchor="middle">
            3.2 V nominal
          </text>
          <text className="pk-celltext pk-celltext-sm" x={CELL.x + 2.6} y={CELL.y - 0.95} textAnchor="middle">
            +
          </text>
          <text className="pk-celltext pk-celltext-sm" x={CELL.x + 7.3} y={CELL.y - 0.95} textAnchor="middle">
            −
          </text>

          {/* liquid cooling loop */}
          {['M158 655 H758', 'M158 655 V188', 'M357 655 V188', 'M557 655 V188', 'M752 655 V188'].map((d) => (
            <path key={d} d={d} className="pk-pipe pk-draw" pathLength={1} />
          ))}
          {['M158 655 H758', 'M357 655 V188', 'M557 655 V188'].map((d) => (
            <path key={`f${d}`} d={d} className="pk-pipeflow pk-sys" />
          ))}

          {/* power path */}
          <path className="pk-wire pk-draw" d="M770 405 H870" pathLength={1} />
          <path className="pk-wire pk-draw" d="M945 440 V560" pathLength={1} />
          <path className="pk-wire pk-dash pk-draw" d="M945 240 V370" pathLength={1} />
          <path className="pk-wire pk-dash pk-draw" d="M870 205 H770" pathLength={1} />
          <path className="pk-flow pk-sys" d="M770 405 H870" />
          <path className="pk-flow pk-sys" d="M945 440 V560" />

          {[
            { y: 170, t: 'EMS', s: 'Energy management' },
            { y: 370, t: 'PCS + Inverter', s: 'DC ⇄ AC conversion' },
            { y: 560, t: 'Grid', s: 'Commissioned' },
          ].map((b) => (
            <g key={b.t} className="pk-sys">
              <rect className="pk-box" x={870} y={b.y} width={150} height={70} rx={4} />
              <text className="pk-boxtitle" x={884} y={b.y + 31}>
                {b.t}
              </text>
              <text className="pk-label pk-small" x={884} y={b.y + 50}>
                {b.s}
              </text>
            </g>
          ))}
        </g>
      </svg>

      <div className="pk-hud">
        <div className="pk-head">
          <span>From cell to grid</span>
          <span>
            Zoom <b className="pk-zoom">1.0×</b>
          </span>
        </div>
        <ol className="pk-steps">
          {STAGES.map((s) => (
            <li className="pk-step" key={s.tag}>
              {s.tag}
            </li>
          ))}
        </ol>
        <div className="pk-caps">
          {STAGES.map((s) => (
            <div className="pk-cap" key={s.tag}>
              <h2>{s.title}</h2>
              <p>{s.body}</p>
            </div>
          ))}
        </div>
        <div className="pk-energy">
          <span className="pk-kwh">000.00</span>
          <small>kWh</small>
          <em>Largest platform commissioned</em>
        </div>
      </div>
    </section>
  );
}
