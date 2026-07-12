"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { NeoBadge, NeoButton, NeoCard } from "@/components/ui/neo";

const GOALS = [
  { n: 10, label: "Casual", desc: "10 XP / day" },
  { n: 20, label: "Regular", desc: "20 XP / day" },
  { n: 30, label: "Serious", desc: "30 XP / day" },
] as const;

const WHYS = [
  { id: "travel", label: "Travel" },
  { id: "work", label: "Work" },
  { id: "school", label: "School" },
  { id: "fun", label: "Fun" },
] as const;

export default function OnboardingPage() {
  const router = useRouter();
  const [goal, setGoal] = useState(20);
  const [why, setWhy] = useState<string>("fun");
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    try {
      await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal }),
      });
      await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ learningWhy: why }),
      }).catch(() => null);
      router.push("/dashboard");
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg space-y-6 px-3 py-10">
      <NeoBadge tone="cyan">Habit setup</NeoBadge>
      <h1 className="text-3xl font-black text-neo-ink">Build a habit</h1>
      <p className="text-sm font-medium text-neo-muted">
        Pick a daily XP goal. You can change it later.
      </p>

      <div className="grid gap-2">
        {GOALS.map((g) => (
          <button key={g.n} type="button" onClick={() => setGoal(g.n)}>
            <NeoCard
              tone={goal === g.n ? "lime" : "white"}
              hover={false}
              className="text-left"
            >
              <p className="font-black">{g.label}</p>
              <p className="text-sm font-bold opacity-80">{g.desc}</p>
            </NeoCard>
          </button>
        ))}
      </div>

      <p className="text-xs font-black uppercase text-neo-muted">Why learn?</p>
      <div className="flex flex-wrap gap-2">
        {WHYS.map((w) => (
          <button
            key={w.id}
            type="button"
            onClick={() => setWhy(w.id)}
            className={`neo-border neo-shadow-sm rounded-xl px-3 py-2 text-sm font-black ${
              why === w.id ? "bg-neo-ink text-neo-white" : "bg-neo-white"
            }`}
          >
            {w.label}
          </button>
        ))}
      </div>

      <NeoButton
        tone="ink"
        className="w-full"
        disabled={busy}
        onClick={save}
      >
        {busy ? "…" : "Start learning"}
      </NeoButton>
    </div>
  );
}
