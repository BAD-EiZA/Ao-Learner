/** Client-side offline evaluate queue (IndexedDB-free: localStorage) */

const KEY = "ao_offline_queue_v1";
const PREFETCH_KEY = "ao_prefetch_stages_v1";

export type QueuedAttempt = {
  id: string;
  stageId: string;
  expectedText: string;
  audioBase64: string;
  mimeType: string;
  flags?: {
    daily?: boolean;
    review?: boolean;
    shadow?: boolean;
    hard?: boolean;
  };
  createdAt: string;
};

export type PrefetchStage = {
  id: string;
  title: string;
  expectedText: string;
  meaningId: string;
  referenceAudio: string;
  language: string;
  cefrLevel: string;
};

function readQueue(): QueuedAttempt[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    return JSON.parse(raw) as QueuedAttempt[];
  } catch {
    return [];
  }
}

function writeQueue(q: QueuedAttempt[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(q.slice(-20)));
  } catch {
    /* quota */
  }
}

export function enqueueAttempt(item: Omit<QueuedAttempt, "id" | "createdAt">) {
  const q = readQueue();
  q.push({
    ...item,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
  });
  writeQueue(q);
  return q.length;
}

export function listQueuedAttempts() {
  return readQueue();
}

export function removeQueued(id: string) {
  writeQueue(readQueue().filter((x) => x.id !== id));
}

export function savePrefetch(stages: PrefetchStage[]) {
  try {
    localStorage.setItem(PREFETCH_KEY, JSON.stringify(stages.slice(0, 5)));
  } catch {
    /* */
  }
}

export function loadPrefetch(): PrefetchStage[] {
  try {
    const raw = localStorage.getItem(PREFETCH_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as PrefetchStage[];
  } catch {
    return [];
  }
}

/** Flush queue when online — posts to /api/evaluate */
export async function flushQueue(): Promise<{ ok: number; fail: number }> {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return { ok: 0, fail: 0 };
  }
  const q = readQueue();
  let ok = 0;
  let fail = 0;
  for (const item of [...q]) {
    try {
      const bin = Uint8Array.from(atob(item.audioBase64), (c) =>
        c.charCodeAt(0)
      );
      const blob = new Blob([bin], { type: item.mimeType || "audio/webm" });
      const form = new FormData();
      form.append("stageId", item.stageId);
      form.append("audio", blob, "speech.webm");
      form.append("expectedText", item.expectedText);
      if (item.flags?.daily) form.append("daily", "1");
      if (item.flags?.review) form.append("review", "1");
      if (item.flags?.shadow) form.append("shadow", "1");
      if (item.flags?.hard) form.append("hard", "1");
      form.append("skipCooldown", "1");
      const res = await fetch("/api/evaluate", { method: "POST", body: form });
      if (res.ok) {
        removeQueued(item.id);
        ok++;
      } else {
        fail++;
      }
    } catch {
      fail++;
    }
  }
  return { ok, fail };
}

export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => {
      const s = String(r.result ?? "");
      const i = s.indexOf(",");
      resolve(i >= 0 ? s.slice(i + 1) : s);
    };
    r.onerror = () => reject(r.error);
    r.readAsDataURL(blob);
  });
}
