const GLYPHS = '01<>/\\[]{}=+*^#%&ΩµΔΣ≈∿⏚';

/** Decodes text into place like a signal locking on. Returns a cancel function. */
export function scramble(el: HTMLElement, text: string, duration = 1.4): () => void {
  let raf = 0;
  const start = performance.now();
  const frame = (now: number) => {
    const p = Math.min(1, (now - start) / (duration * 1000));
    const locked = Math.floor(p * text.length);
    let out = '';
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      out += i < locked || ch === ' ' ? ch : GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
    }
    el.textContent = out;
    if (p < 1) raf = requestAnimationFrame(frame);
  };
  raf = requestAnimationFrame(frame);
  return () => cancelAnimationFrame(raf);
}
