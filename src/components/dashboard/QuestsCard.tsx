"use client";

import { useState } from "react";
import { NeoButton, NeoCard } from "@/components/ui/neo";

export type QuestView = {
  code: string;
  title: string;
  target: number;
  rewardXp: number;
  progress: number;
  completed: boolean;
  claimed: boolean;
};

export function QuestsCard({ initial }: { initial: QuestView[] }) {
  const [quests, setQuests] = useState(initial);
  const [busy, setBusy] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const claim = async (code: string) => {
    setBusy(code);
    try {
      const res = await fetch("/api/quests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questCode: code }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        const xp = data.rewardXp ?? 0;
        setQuests((q) =>
          q.map((x) => (x.code === code ? { ...x, claimed: true } : x))
        );
        setToast(`+${xp} XP claimed!`);
        setTimeout(() => setToast(null), 2500);
      }
    } finally {
      setBusy(null);
    }
  };

  return (
    <NeoCard tone="orange" hover={false} className="relative space-y-3">
      <p className="text-xs font-black uppercase opacity-70">Daily quests</p>
      {toast && (
        <p className="neo-border rounded-lg bg-neo-lime px-2 py-1 text-xs font-black text-neo-ink">
          {toast}
        </p>
      )}
      <ul className="space-y-2">
        {quests.map((q) => (
          <li
            key={q.code}
            className="neo-border rounded-xl bg-neo-white px-3 py-2 text-sm"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-black text-neo-ink">{q.title}</p>
                <p className="text-xs font-bold text-neo-muted">
                  {Math.min(q.progress, q.target)}/{q.target} · +{q.rewardXp} XP
                </p>
              </div>
              {q.completed && !q.claimed ? (
                <NeoButton
                  tone="lime"
                  className="text-xs"
                  disabled={busy === q.code}
                  onClick={() => claim(q.code)}
                >
                  Claim
                </NeoButton>
              ) : q.claimed ? (
                <span className="text-xs font-black text-neo-ink">✓</span>
              ) : null}
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-neo-cyan/40">
              <div
                className="h-full bg-neo-ink"
                style={{
                  width: `${Math.min(100, (q.progress / q.target) * 100)}%`,
                }}
              />
            </div>
          </li>
        ))}
      </ul>
    </NeoCard>
  );
}
