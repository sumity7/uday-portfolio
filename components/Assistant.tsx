'use client';

import { Fragment, useCallback, useEffect, useRef, useState, type CSSProperties, type FormEvent, type KeyboardEvent, type ReactNode } from 'react';
import { profile, starterQuestions } from '@/lib/data';

type Msg = { id: number; role: 'user' | 'assistant'; content: string; error?: boolean };

const MAX_INPUT = 400;

const ERRORS: Record<string, string> = {
  not_configured: "The assistant isn't switched on yet.",
  rate_limited: "That's a lot of questions in a short time. Please try again in a few minutes.",
  busy: "I'm getting a lot of questions right now. Please try again in a few seconds.",
};
const FALLBACK_ERROR = "Sorry, I couldn't answer that just now. Please try again in a moment.";

const TOKEN = /(\*\*[^*\n]+\*\*|https?:\/\/[^\s)]*[^\s).,;:!?]|[\w.+-]+@[\w-]+\.[\w.-]*\w|\+\d[\d ]{8,}\d)/g;

/** Inline formatting without dangerouslySetInnerHTML: bold, links, emails and phone numbers. */
function inline(text: string): ReactNode[] {
  return text.split(TOKEN).map((part, i) => {
    if (!part) return null;
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) return <strong key={i}>{part.slice(2, -2)}</strong>;
    if (/^https?:\/\//.test(part))
      return (
        <a key={i} href={part} target="_blank" rel="noopener noreferrer">
          {part.replace(/^https?:\/\/(www\.)?/, '')}
        </a>
      );
    if (/^[\w.+-]+@/.test(part)) return <a key={i} href={`mailto:${part}`}>{part}</a>;
    if (/^\+\d/.test(part)) return <a key={i} href={`tel:${part.replace(/\s/g, '')}`}>{part}</a>;
    return <Fragment key={i}>{part}</Fragment>;
  });
}

/** Paragraphs and "- " bullet lists, which is all the system prompt allows the model to produce. */
function Rich({ text }: { text: string }) {
  const blocks: ReactNode[] = [];
  let bullets: string[] = [];
  const flush = () => {
    if (!bullets.length) return;
    const items = bullets;
    blocks.push(
      <ul key={`u${blocks.length}`}>
        {items.map((b, i) => (
          <li key={i}>{inline(b)}</li>
        ))}
      </ul>,
    );
    bullets = [];
  };
  for (const line of text.split('\n')) {
    const m = line.match(/^\s*[-*•]\s+(.*)$/);
    if (m) bullets.push(m[1]);
    else {
      flush();
      if (line.trim()) blocks.push(<p key={`p${blocks.length}`}>{inline(line.trim())}</p>);
    }
  }
  flush();
  return <>{blocks}</>;
}

/** Four-point sparkle in the Gemini style, with its blue-to-rose gradient. Each instance needs its own gradient id. */
function Spark({ id }: { id: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="3" y1="21" x2="21" y2="3" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#4285f4" />
          <stop offset="0.55" stopColor="#9b72cb" />
          <stop offset="1" stopColor="#d96570" />
        </linearGradient>
      </defs>
      <path fill={`url(#${id})`} d="M12 0C12 6.63 6.63 12 0 12c6.63 0 12 5.37 12 12 0-6.63 5.37-12 12-12-6.63 0-12-5.37-12-12Z" />
    </svg>
  );
}

export default function Assistant({ ready = true }: { ready?: boolean }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);

  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const stick = useRef(true);
  const nextId = useRef(1);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: globalThis.KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);

    // On phones the keyboard shrinks only the visual viewport, so size the sheet to it or the input hides behind the keys.
    const vv = window.visualViewport;
    const fit = () => {
      if (!vv) return;
      const el = document.documentElement;
      el.style.setProperty('--as-h', `${vv.height}px`);
      el.style.setProperty('--as-top', `${vv.offsetTop}px`);
      const l = listRef.current;
      if (l && stick.current) l.scrollTop = l.scrollHeight;
    };
    fit();
    vv?.addEventListener('resize', fit);
    vv?.addEventListener('scroll', fit);
    document.documentElement.classList.add('as-lock');

    const t = window.setTimeout(() => {
      if (window.matchMedia('(pointer: fine)').matches) inputRef.current?.focus();
    }, 380);

    return () => {
      window.removeEventListener('keydown', onKey);
      vv?.removeEventListener('resize', fit);
      vv?.removeEventListener('scroll', fit);
      document.documentElement.classList.remove('as-lock');
      document.documentElement.style.removeProperty('--as-h');
      document.documentElement.style.removeProperty('--as-top');
      window.clearTimeout(t);
    };
  }, [open]);

  useEffect(() => () => abortRef.current?.abort(), []);

  // Follow the stream, unless the visitor has scrolled up to re-read something.
  useEffect(() => {
    const l = listRef.current;
    if (l && stick.current) l.scrollTop = l.scrollHeight;
  }, [messages, open]);

  const onScroll = () => {
    const l = listRef.current;
    if (l) stick.current = l.scrollHeight - l.scrollTop - l.clientHeight < 80;
  };

  const grow = () => {
    const t = inputRef.current;
    if (!t) return;
    t.style.height = 'auto';
    // scrollHeight leaves out the border, so add it back or the box is 2px short and shows a scrollbar for one line.
    const h = t.scrollHeight + (t.offsetHeight - t.clientHeight);
    t.style.height = `${Math.min(h, 112)}px`;
    t.style.overflowY = h > 112 ? 'auto' : 'hidden';
  };

  const send = useCallback(
    async (raw: string) => {
      const text = raw.trim().slice(0, MAX_INPUT);
      if (!text || busy) return;

      const user: Msg = { id: nextId.current++, role: 'user', content: text };
      const reply: Msg = { id: nextId.current++, role: 'assistant', content: '' };
      const history = [...messages, user].filter((m) => !m.error).map(({ role, content }) => ({ role, content }));

      stick.current = true;
      setMessages((m) => [...m, user, reply]);
      setInput('');
      requestAnimationFrame(grow);
      setBusy(true);

      const ctrl = new AbortController();
      abortRef.current = ctrl;
      const patch = (content: string, error = false) =>
        setMessages((m) => m.map((x) => (x.id === reply.id ? { ...x, content, error } : x)));

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: history }),
          signal: ctrl.signal,
        });
        if (!res.ok || !res.body) {
          const code = (await res.json().catch(() => ({}))).error as string | undefined;
          patch(ERRORS[code ?? ''] ?? FALLBACK_ERROR, true);
          return;
        }
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let acc = '';
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          acc += decoder.decode(value, { stream: true });
          patch(acc);
        }
        if (!acc.trim()) patch(FALLBACK_ERROR, true);
      } catch (e) {
        if ((e as Error).name !== 'AbortError') patch(FALLBACK_ERROR, true);
      } finally {
        setBusy(false);
        if (window.matchMedia('(pointer: fine)').matches) inputRef.current?.focus();
      }
    },
    [busy, messages],
  );

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    send(input);
  };
  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      send(input);
    }
  };

  const empty = messages.length === 0;
  const waiting = busy && messages[messages.length - 1]?.content === '';

  return (
    <div className={`as${ready ? ' as-ready' : ''}${open ? ' as-open' : ''}`}>
      <section className="as-panel" role="dialog" aria-label="Chat with Udayraj's AI assistant" aria-hidden={!open} inert={!open}>
        <header className="as-head">
          <span className="as-avatar">
            <Spark id="as-g-head" />
          </span>
          <div className="as-title">
            <strong>Udayraj&apos;s AI</strong>
            <span>
              <i /> Answers from his portfolio
            </span>
          </div>
          <button type="button" className="as-close" onClick={() => setOpen(false)} aria-label="Close chat">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </header>

        <div className="as-list" ref={listRef} onScroll={onScroll} data-lenis-prevent role="log" aria-live="polite" aria-busy={busy}>
          <div className="as-msg as-bot">
            <Rich text={`Hi, I'm the assistant for ${profile.name}'s portfolio. Ask me about his battery storage projects, skills, career or how to reach him.`} />
          </div>

          {empty && (
            <div className="as-starters">
              {starterQuestions.map((q, i) => (
                <button type="button" key={q} style={{ '--i': i } as CSSProperties} onClick={() => send(q)}>
                  {q}
                </button>
              ))}
            </div>
          )}

          {messages.map((m) => (
            <div key={m.id} className={`as-msg ${m.role === 'user' ? 'as-user' : 'as-bot'}${m.error ? ' as-err' : ''}`}>
              {m.role === 'user' ? m.content : m.content ? <Rich text={m.content} /> : <span className="as-typing" aria-label="Thinking"><i /><i /><i /></span>}
            </div>
          ))}
        </div>

        <form className="as-form" onSubmit={onSubmit}>
          <textarea
            ref={inputRef}
            rows={1}
            value={input}
            maxLength={MAX_INPUT}
            placeholder="Ask about Udayraj..."
            aria-label="Your question"
            enterKeyHint="send"
            onChange={(e) => {
              setInput(e.target.value);
              grow();
            }}
            onKeyDown={onKeyDown}
          />
          <button type="submit" className="as-send" disabled={busy || !input.trim()} aria-label="Send message" data-cursor="Send">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M5 12h13M13 6l6 6-6 6" />
            </svg>
          </button>
        </form>
        <p className="as-note">{waiting ? 'Thinking...' : 'AI can make mistakes. Confirm important details with Udayraj.'}</p>
      </section>

      <button type="button" className="as-fab" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-label={open ? 'Close chat' : 'Ask me: chat with the AI assistant'} data-cursor={open ? 'Close' : 'Ask me'}>
        <span className="as-fab-ring" />
        <span className="as-fab-face as-fab-ask">
          <Spark id="as-g-fab" />
          <span>Ask me</span>
        </span>
        <span className="as-fab-face as-fab-x">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </span>
      </button>
    </div>
  );
}
