"use client";

import { useEffect, useState } from "react";
import { NeoButton, NeoCard, NeoLink } from "@/components/ui/neo";

export function ComebackBanner() {
  const [show, setShow] = useState(false);
  const [days, setDays] = useState(0);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [stageIds, setStageIds] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/comeback")
      .then((r) => r.json())
      .then((d) => {
        if (d.active || d.eligible) {
          setShow(true);
          setDays(d.daysAway ?? 0);
        }
      })
      .catch(() => undefined);
  }, []);

  if (!show) return null;

  const claim = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/comeback", { method: "POST" });
      const j = await res.json();
      if (!res.ok) {
        setMsg(j.error ?? "Not available");
        return;
      }
      setMsg(`Welcome back! +${j.xp} XP · +${j.gems} 💎 · full hearts`);
      setStageIds(j.easyStageIds ?? []);
    } finally {
      setBusy(false);
    }
  };

  return (
    <NeoCard tone="cyan" hover={false} className="space-y-2">
      <p className="font-black">Welcome back{days ? ` · ${days}d away` : ""}</p>
      <p className="text-sm font-bold opacity-90">
        Easy comeback path + bonus XP/gems/hearts. Claim once.
      </p>
      {msg && <p className="text-xs font-black">{msg}</p>}
      <div className="flex flex-wrap gap-2">
        <NeoButton tone="ink" disabled={busy} onClick={() => void claim()}>
          {busy ? "…" : "Claim comeback"}
        </NeoButton>
        {stageIds[0] && (
          <NeoLink href={`/learn/${stageIds[0]}?review=1`} tone="lime">Easy stage</NeoLink>
        )}
      </div>
    </NeoCard>
  );
}
