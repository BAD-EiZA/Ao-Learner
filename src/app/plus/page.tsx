"use client";

import { useEffect, useState } from "react";
import { NeoBadge, NeoButton, NeoCard, NeoLink } from "@/components/ui/neo";

type PlusState = {
  isPlus: boolean;
  plusUntil: string | null;
  perks: string[];
};

export default function PlusPage() {
  const [state, setState] = useState<PlusState | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/plus")
      .then((r) => r.json())
      .then(setState)
      .catch(() => setState({ isPlus: false, plusUntil: null, perks: [] }));
  }, []);

  const activate = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/plus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ days: 30 }),
      });
      const data = await res.json();
      setState(data);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg space-y-6 px-3 py-8" aria-busy={busy || !state}>
      <NeoBadge tone="pink">Ao Plus</NeoBadge>
      <h1 className="text-3xl font-black text-neo-ink">Go Plus</h1>
      <p className="text-sm font-medium text-neo-muted">
        Soft demo — no payment. Unlimited hearts & fewer cooldowns.
      </p>

      <NeoCard tone="purple" hover={false} className="space-y-3">
        <ul className="space-y-1 text-sm font-bold">
          {(state?.perks ?? []).map((p) => (
            <li key={p}>✓ {p}</li>
          ))}
        </ul>
        {state?.isPlus ? (
          <p className="font-black text-neo-ink">
            Active until{" "}
            {state.plusUntil
              ? new Date(state.plusUntil).toLocaleDateString()
              : "—"}
          </p>
        ) : (
          <NeoButton
            tone="ink"
            className="w-full"
            disabled={busy}
            onClick={activate}
          >
            {busy ? "…" : "Activate 30 days (demo)"}
          </NeoButton>
        )}
      </NeoCard>

      <NeoLink href="/dashboard" tone="white">← Dashboard</NeoLink>
    </div>
  );
}
