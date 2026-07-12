/**
 * Multi-key pool for Gemini.
 * Supports:
 *   GOOGLE_AI_API_KEY
 *   GOOGLE_AI_API_KEY_1 .. GOOGLE_AI_API_KEY_N
 *   GOOGLE_AI_API_KEYS=key1,key2,key3
 *   GEMINI_API_KEY / GOOGLE_API_KEY (legacy single)
 */

type KeyState = {
  key: string;
  label: string;
  ok: boolean | null; // null = untested
  lastError?: string;
  fails: number;
};

const pool: KeyState[] = [];
let loaded = false;

function mask(key: string) {
  if (key.length <= 8) return "****";
  return `${key.slice(0, 6)}…${key.slice(-4)}`;
}

function collectFromEnv(): { key: string; label: string }[] {
  const found: { key: string; label: string }[] = [];
  const seen = new Set<string>();

  const push = (raw: string | undefined, label: string) => {
    const key = (raw ?? "").trim().replace(/^["']|["']$/g, "");
    if (!key || seen.has(key)) return;
    seen.add(key);
    found.push({ key, label });
  };

  push(process.env.GOOGLE_AI_API_KEY, "GOOGLE_AI_API_KEY");
  push(process.env.GEMINI_API_KEY, "GEMINI_API_KEY");
  push(process.env.GOOGLE_API_KEY, "GOOGLE_API_KEY");

  const multi = process.env.GOOGLE_AI_API_KEYS ?? process.env.GEMINI_API_KEYS;
  if (multi) {
    multi.split(/[,;\s]+/).forEach((k, i) => {
      push(k, `GOOGLE_AI_API_KEYS[${i}]`);
    });
  }

  // GOOGLE_AI_API_KEY_1 .. _20
  for (let i = 1; i <= 20; i++) {
    push(process.env[`GOOGLE_AI_API_KEY_${i}`], `GOOGLE_AI_API_KEY_${i}`);
    push(process.env[`GEMINI_API_KEY_${i}`], `GEMINI_API_KEY_${i}`);
  }

  return found;
}

function ensureLoaded() {
  if (loaded) return;
  loaded = true;
  for (const { key, label } of collectFromEnv()) {
    pool.push({ key, label, ok: null, fails: 0 });
  }
}

export function listGeminiKeys() {
  ensureLoaded();
  return pool.map((k) => ({
    label: k.label,
    mask: mask(k.key),
    ok: k.ok,
    lastError: k.lastError,
    fails: k.fails,
  }));
}

export function getGeminiKeyCount() {
  ensureLoaded();
  return pool.length;
}

/** Random healthy key (ok !== false). Falls back to any key if all marked bad. */
export function getRandomGeminiKey(): { key: string; label: string } {
  ensureLoaded();
  if (pool.length === 0) {
    throw new Error(
      "No Gemini API keys. Set GOOGLE_AI_API_KEY or GOOGLE_AI_API_KEY_1.."
    );
  }

  const healthy = pool.filter((k) => k.ok !== false);
  const source = healthy.length ? healthy : pool;
  const pick = source[Math.floor(Math.random() * source.length)]!;
  return { key: pick.key, label: pick.label };
}

export function markGeminiKeyOk(key: string) {
  ensureLoaded();
  const row = pool.find((k) => k.key === key);
  if (row) {
    row.ok = true;
    row.fails = 0;
    row.lastError = undefined;
  }
}

export function markGeminiKeyBad(key: string, error?: string) {
  ensureLoaded();
  const row = pool.find((k) => k.key === key);
  if (!row) return;
  row.fails += 1;
  row.lastError = error?.slice(0, 200);
  // mark bad after first hard auth error, or 3 soft fails
  const hard =
    /API_KEY_INVALID|PERMISSION_DENIED|401|403|invalid.*key|API key not valid/i.test(
      error ?? ""
    );
  if (hard || row.fails >= 3) {
    row.ok = false;
  }
}

export function isAuthError(msg: string) {
  return /API_KEY_INVALID|PERMISSION_DENIED|401|403|invalid.*key|API key not valid|UNAUTHENTICATED/i.test(
    msg
  );
}

/**
 * Probe all keys with a tiny generateContent call.
 * Returns report for CLI / startup.
 */
export async function probeAllGeminiKeys(opts?: {
  model?: string;
}): Promise<
  {
    label: string;
    mask: string;
    ok: boolean;
    error?: string;
  }[]
> {
  ensureLoaded();
  const model = opts?.model ?? process.env.GEMINI_MODEL ?? "gemini-3.1-flash-lite";
  const { GoogleGenAI } = await import("@google/genai");

  const results: {
    label: string;
    mask: string;
    ok: boolean;
    error?: string;
  }[] = [];

  for (const row of pool) {
    try {
      const ai = new GoogleGenAI({ apiKey: row.key });
      const res = await ai.models.generateContent({
        model,
        contents: "Reply with exactly: ok",
      });
      const text = (res.text ?? "").toLowerCase();
      if (!text && !res.candidates?.length) {
        throw new Error("Empty response");
      }
      row.ok = true;
      row.fails = 0;
      row.lastError = undefined;
      results.push({ label: row.label, mask: mask(row.key), ok: true });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      row.ok = false;
      row.lastError = msg.slice(0, 200);
      row.fails += 1;
      results.push({
        label: row.label,
        mask: mask(row.key),
        ok: false,
        error: msg.slice(0, 280),
      });
    }
    // mild spacing
    await new Promise((r) => setTimeout(r, 400));
  }

  return results;
}

/** Run fn with random key; on auth fail mark bad and retry other keys */
export async function withGeminiKey<T>(
  fn: (apiKey: string, label: string) => Promise<T>,
  opts?: { retries?: number }
): Promise<T> {
  ensureLoaded();
  const max = opts?.retries ?? Math.max(pool.length, 1);
  let lastErr: unknown;

  for (let i = 0; i < max; i++) {
    const { key, label } = getRandomGeminiKey();
    try {
      const result = await fn(key, label);
      markGeminiKeyOk(key);
      return result;
    } catch (e) {
      lastErr = e;
      const msg = e instanceof Error ? e.message : String(e);
      if (isAuthError(msg)) {
        markGeminiKeyBad(key, msg);
        continue;
      }
      // rate limit / transient: soft fail, try another key
      if (/429|RESOURCE_EXHAUSTED|quota|UNAVAILABLE|500|INTERNAL/i.test(msg)) {
        markGeminiKeyBad(key, msg);
        continue;
      }
      throw e;
    }
  }

  throw lastErr instanceof Error
    ? lastErr
    : new Error("All Gemini API keys failed");
}
