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
    // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage queue is client-only
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

  useEffect(() => {
    if (!msg) return;
    const timeout = window.setTimeout(() => setMsg(null), 5000);
    return () => window.clearTimeout(timeout);
  }, [msg]);

  if (pending === 0 && !msg) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="neo-border rounded-xl bg-neo-info px-3 py-2 text-xs font-black text-neo-ink shadow-lg"
    >
      {pending > 0 && <p>Offline queue: {pending}</p>}
      {msg && (
        <p className="text-neo-ink opacity-90">
          {msg}{" "}
          <button type="button" className="min-h-11 underline" onClick={() => setMsg(null)}>
            Dismiss
          </button>
        </p>
      )}
    </div>
  );
}
