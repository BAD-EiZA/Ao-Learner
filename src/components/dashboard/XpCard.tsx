"use client";

import { NeoCard } from "@/components/ui/neo";
import { badgeForLevel, xpProgress } from "@/lib/learning/xp-math";

export function XpCard({ xp, level }: { xp: number; level: number }) {
  const p = xpProgress(xp);
  const badge = badgeForLevel(level);

  return (
    <NeoCard tone="purple" hover={false} className="space-y-2">
      <p className="text-xs font-black uppercase opacity-70">XP · Level</p>
      <p className="text-2xl font-black">
        {badge.emoji} Lv.{level}{" "}
        <span className="text-sm font-bold opacity-80">{badge.name}</span>
      </p>
      <div className="neo-border h-3 overflow-hidden rounded-full bg-neo-white">
        <div
          className="h-full bg-neo-ink transition-all"
          style={{ width: `${p.pct}%` }}
        />
      </div>
      <p className="text-xs font-bold opacity-80">
        {xp} XP · {p.into}/{p.need} to next
      </p>
    </NeoCard>
  );
}
