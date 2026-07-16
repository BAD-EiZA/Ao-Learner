"use client";

import { useEffect, useState } from "react";
import { NeoButton, NeoCard, NeoLink } from "@/components/ui/neo";

export function SuperTrialBanner() {
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/trial")
      .then((r) => r.json())
      .then((d) => setShow(!!d.showBanner))
      .catch(() => undefined);
  }, []);

  if (!show) return null;

  const start = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/trial", { method: "POST" });
      if (res.ok) {
        setShow(false);
        window.location.reload();
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <NeoCard tone="pink" hover={false} className="space-y-2">
      <p className="font-black">Out of hearts? Try Super free</p>
      <p className="text-sm font-bold opacity-90">
        48h unlimited hearts + short cooldowns. One-time trial.
      </p>
      <div className="flex flex-wrap gap-2">
        <NeoButton tone="ink" disabled={busy} onClick={() => void start()}>
          {busy ? "…" : "Start Super trial"}
        </NeoButton>
        <NeoLink href="/plus" tone="white">See Plus</NeoLink>
      </div>
    </NeoCard>
  );
}
