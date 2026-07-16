"use client";

import { useEffect, useState } from "react";
import { NeoBadge, NeoButton, NeoCard, NeoLink } from "@/components/ui/neo";

type M = {
  days: number;
  title: string;
  emoji: string;
  xp: number;
  gems: number;
  reached: boolean;
  claimed: boolean;
};

export default function SocietyPage() {
  const [streak, setStreak] = useState(0);
  const [milestones, setMilestones] = useState<M[]>([]);
  const [msg, setMsg] = useState<string | null>(null);

  const load = () =>
    fetch("/api/streak-society")
      .then((r) => r.json())
      .then((d) => {
        setStreak(d.streak ?? 0);
        setMilestones(d.milestones ?? []);
      });

  useEffect(() => {
    void load();
  }, []);

  const claim = async (days: number) => {
    const res = await fetch("/api/streak-society", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ days }),
    });
    const j = await res.json();
    if (!res.ok) setMsg(j.error ?? "fail");
    else {
      setMsg(`Claimed ${j.title}! +${j.xp} XP +${j.gems} gems`);
      void load();
    }
  };

  return (
    <div className="mx-auto max-w-lg space-y-6 px-3 py-8">
      <NeoBadge tone="orange">Streak society</NeoBadge>
      <h1 className="text-3xl font-black">🔥 {streak} day streak</h1>
      {msg && (
        <p role="status" aria-live="polite" className="neo-border rounded-lg bg-neo-info px-2 py-1 text-xs font-black">
          {msg}
        </p>
      )}
      <ul className="space-y-2">
        {milestones.map((m) => (
          <li key={m.days}>
            <NeoCard
              tone={m.claimed ? "lime" : m.reached ? "yellow" : "white"}
              className="flex items-center justify-between gap-2"
            >
              <div>
                <p className="font-black">
                  {m.emoji} {m.title}
                </p>
                <p className="text-xs font-bold opacity-70">
                  {m.days} days · +{m.xp} XP · +{m.gems} 💎
                </p>
              </div>
              {m.reached && !m.claimed ? (
                <NeoButton tone="ink" onClick={() => claim(m.days)}>
                  Claim
                </NeoButton>
              ) : m.claimed ? (
                <span className="text-xs font-black">✓</span>
              ) : (
                <span className="text-xs font-bold opacity-50">🔒</span>
              )}
            </NeoCard>
          </li>
        ))}
      </ul>
      <NeoLink href="/dashboard" tone="white">← Dashboard</NeoLink>
    </div>
  );
}
