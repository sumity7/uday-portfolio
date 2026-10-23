import { buildSystemPrompt } from '@/lib/knowledge';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_MESSAGES = 10;
const MAX_CHARS = 600;
const MAX_BODY = 16_000;
const WINDOW_MS = 10 * 60_000;
const MAX_PER_WINDOW = 25;

type Msg = { role: 'user' | 'assistant'; content: string };

// Per-instance only: enough to stop a casual script from burning the key, not a real quota.
const hits = new Map<string, { n: number; reset: number }>();

function limited(ip: string): boolean {
  const now = Date.now();
  if (hits.size > 500) for (const [k, v] of hits) if (v.reset < now) hits.delete(k);
  const h = hits.get(ip);
  if (!h || h.reset < now) {
    hits.set(ip, { n: 1, reset: now + WINDOW_MS });
    return false;
  }
  h.n += 1;
  return h.n > MAX_PER_WINDOW;
}

const json = (body: object, status: number) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });

function clean(input: unknown): Msg[] | null {
  if (!Array.isArray(input)) return null;
  const out: Msg[] = [];
  for (const m of input.slice(-MAX_MESSAGES)) {
    if (!m || (m.role !== 'user' && m.role !== 'assistant') || typeof m.content !== 'string') return null;
    const content = m.content.trim().slice(0, MAX_CHARS * (m.role === 'assistant' ? 4 : 1));
    if (content) out.push({ role: m.role, content });
  }
  // Must end on a user turn, and the model API rejects a conversation that opens on the assistant.
  while (out.length && out[0].role !== 'user') out.shift();
  return out.length && out[out.length - 1].role === 'user' ? out : null;
}

export async function POST(req: Request) {
  const key = process.env.GROQ_API_KEY;
  if (!key) return json({ error: 'not_configured' }, 503);

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'local';
  if (limited(ip)) return json({ error: 'rate_limited' }, 429);

  const raw = await req.text();
  if (raw.length > MAX_BODY) return json({ error: 'too_large' }, 413);
  let messages: Msg[] | null = null;
  try {
    messages = clean(JSON.parse(raw)?.messages);
  } catch {
    /* falls through to the 400 below */
  }
  if (!messages) return json({ error: 'bad_request' }, 400);

  const base = (process.env.GROQ_BASE_URL || 'https://api.groq.com/openai/v1').replace(/\/$/, '');
  // Hosted models get retired; if the first choice is gone, fall through to the next instead of failing the visitor.
  const models = [...new Set([process.env.GROQ_MODEL, 'openai/gpt-oss-120b', 'openai/gpt-oss-20b'].filter(Boolean))] as string[];
  const system = buildSystemPrompt();

  let upstream: Response | null = null;
  for (const model of models) {
    try {
      upstream = await fetch(`${base}/chat/completions`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          stream: true,
          temperature: 0.35,
          // gpt-oss models think before answering and that thinking counts toward the limit, so keep it short and leave room.
          ...(model.startsWith('openai/gpt-oss') ? { reasoning_effort: 'low', max_completion_tokens: 1800 } : { max_tokens: 700 }),
          messages: [{ role: 'system', content: system }, ...messages],
        }),
        signal: AbortSignal.timeout(30_000),
      });
    } catch {
      return json({ error: 'upstream_unreachable' }, 502);
    }
    if (upstream.ok && upstream.body) break;
    // Log the provider's reason on the server only; the visitor just sees a generic failure.
    console.error('[chat] Groq responded', upstream.status, 'for', model, await upstream.text().catch(() => ''));
    if (upstream.status !== 404 && upstream.status !== 400) break;
  }

  if (!upstream || !upstream.ok || !upstream.body) return json({ error: upstream?.status === 429 ? 'busy' : 'upstream_error' }, 502);

  // Groq streams OpenAI-style SSE; turn it into plain text chunks so the browser needs no parser.
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  const reader = upstream.body.getReader();
  let buffer = '';

  const stream = new ReadableStream({
    async pull(controller) {
      const { done, value } = await reader.read();
      if (done) return controller.close();
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      for (const line of lines) {
        const t = line.trim();
        if (!t.startsWith('data:')) continue;
        const data = t.slice(5).trim();
        if (data === '[DONE]') return controller.close();
        try {
          const delta = JSON.parse(data).choices?.[0]?.delta?.content;
          if (delta) controller.enqueue(encoder.encode(delta));
        } catch {
          /* a partial or keep-alive line; the next chunk completes it */
        }
      }
    },
    cancel() {
      reader.cancel().catch(() => {});
    },
  });

  return new Response(stream, { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store', 'X-Accel-Buffering': 'no' } });
}
