# Udayraj Yadav — Portfolio

Cinematic, scroll-driven portfolio for a BESS / battery R&D engineer.
Next.js 15 (App Router) · TypeScript · GSAP + ScrollTrigger · Lenis smooth scroll.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
npm run build && npm start
```

Deploy: push to GitHub and import into Vercel (zero config).

## The scenes

| # | Scene | What happens |
|---|-------|--------------|
| 0 | Boot loader | BMS boot log, counter 000→100%, lightning bolt draws, white flash, screen splits open |
| 1 | Hero | Electron flow field reacts to the cursor; **click anywhere to discharge lightning**; PCB traces pulse; name assembles letter by letter; role text "decodes"; name tears apart and blurs as you scroll away |
| 2 | Cell → Grid (pinned) | Camera starts inside one LFP cell, it charges, then pulls back: module → rack → liquid-cooled container wired to PCS, EMS and grid; 361.72 kWh counts up |
| 3 | About | Photo reveals with a clip wipe, parallax, thermal-scan line and HUD; colour returns on hover; paragraph lights up word by word as you scroll |
| 4 | Stats | Counters + energy bars, giant ghost "361.72 kWh" drifting behind |
| 5 | Career (pinned, horizontal) | Four roles slide sideways along a busbar that charges toward 2026; nodes light up; years parallax |
| 6 | Oscilloscope | Click CAN / RS-485 / UART / I²C / SPI to see each protocol's waveform traced with phosphor glow and a decoded frame |
| 7 | Skills | Huge marquee rows that skew with scroll speed; chips pop in |
| 8 | Certifications | 3D tilt cards with light glare |
| 9 | Contact | Amber spark field, giant headline, magnetic buttons |

Always on: custom probe cursor with labels, film grain, auto-hiding nav with live
Ahmedabad clock, and a battery meter that charges 0→100% (2.80→3.65 V) as you scroll.

Respects `prefers-reduced-motion` (no smooth scroll, instant loader, static marquee).

## Edit content

All text lives in `lib/data.ts` (jobs, stats, skills, certifications, contact).
Photo: replace `public/udayraj.jpg` (portrait, 4:5 works best).

## Structure

```
app/            layout (fonts, metadata), page (scene order), globals.css
components/     one file per scene + Cursor, Loader, SmoothScroll, ChargeMeter, Nav
lib/            data.ts (content), gsap.ts (plugin registration), scramble.ts, rng.ts
public/         udayraj.jpg
```

## AI assistant

The "Ask me" chat uses Groq through a server route (`app/api/chat/route.ts`), so the key never reaches the browser.

1. Put your key in `.env.local`: `GROQ_API_KEY=...` (see `.env.example`). Restart `npm run dev` after changing it.
2. Optional: `GROQ_MODEL` to pick another Groq model (default `llama-3.3-70b-versatile`).
3. On a host such as Vercel, add the same variable in the project settings.

What the assistant knows is generated from `lib/data.ts` by `lib/knowledge.ts`, so editing the data updates its answers too.
