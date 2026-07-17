"use client";

import { NeoCard } from "@/components/ui/neo";

export function DailyGoalCard({
  earned,
  goal,
  pct,
  met,
}: {
  earned: number;
  goal: number;
  pct: number;
  met: boolean;
}) {
  return (
    <NeoCard tone={met ? "success" : "info"} hover={false} className="space-y-2">
      <p className="text-xs font-black uppercase opacity-70">Daily XP goal</p>
      <p className="text-2xl font-black">
        {earned}
        <span className="text-sm font-bold opacity-70"> / {goal} XP</span>
      </p>
      <div className="neo-border h-3 overflow-hidden rounded-full bg-neo-white">
        <div
          className="h-full bg-neo-ink transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs font-bold opacity-80">
        {met ? "Goal met — keep going!" : `${goal - earned} XP left today`}
      </p>
    </NeoCard>
  );
}
