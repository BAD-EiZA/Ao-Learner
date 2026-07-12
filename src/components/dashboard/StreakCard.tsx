"use client";

import { NeoCard } from "@/components/ui/neo";

export function StreakCard({
  currentStreak,
  longestStreak,
  totalPassed,
  totalAttempts,
}: {
  currentStreak: number;
  longestStreak: number;
  totalPassed: number;
  totalAttempts: number;
}) {
  return (
    <NeoCard tone="pink" hover={false} className="space-y-2">
      <p className="text-xs font-black uppercase opacity-70">Daily streak</p>
      <p className="text-4xl font-black leading-none">
        {currentStreak}
        <span className="ml-1 text-base font-bold opacity-70">days</span>
      </p>
      <div className="flex flex-wrap gap-3 text-xs font-bold opacity-90">
        <span>Best: {longestStreak}d</span>
        <span>
          Passed: {totalPassed}/{totalAttempts || 0}
        </span>
      </div>
    </NeoCard>
  );
}
