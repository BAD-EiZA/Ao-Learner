"use client";

import { useEffect, useState } from "react";
import {
  flushQueue,
  listQueuedAttempts,
} from "@/lib/offline/queue";

export function OfflineQueue() {
  const [pending, setPending] = useState(0);
  const [msg, setMsg] = useState<string | null>(null);

  const refresh = () => setPending(listQueuedAttempts().length);

  useEffect(() => {
    refresh();
    const onOnline = async () => {
      const r = await flushQueue();
      refresh();
      if (r.ok > 0) setMsg(`Synced ${r.ok} offline attempt(s)`);
    };
    window.addEventListener("online", onOnline);
    if (navigator.onLine) void onOnline();
    return () => window.removeEventListener("online", onOnline);
  }, []);

  if (pending === 0 && !msg) return null;

  return (
    <div className="fixed bottom-[max(0.75rem,env(safe-area-inset-bottom))] left-3 z-50 max-w-[min(16rem,calc(100vw-1.5rem))] neo-border neo-shadow rounded-xl bg-neo-yellow px-3 py-2 text-xs font-black text-neo-ink">
      {pending > 0 && <p>Offline queue: {pending}</p>}
      {msg && (
        <p className="text-neo-ink opacity-90">
          {msg}{" "}
          <button type="button" className="underline" onClick={() => setMsg(null)}>
            ok
          </button>
        </p>
      )}
    </div>
  );
}
