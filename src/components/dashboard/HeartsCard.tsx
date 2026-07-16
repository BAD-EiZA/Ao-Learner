"use client";

import { NeoCard, NeoLink } from "@/components/ui/neo";

export function HeartsCard({
  hearts,
  max = 5,
  isPlus,
  nextHeartAt,
}: {
  hearts: number;
  max?: number;
  isPlus: boolean;
  nextHeartAt?: string | null;
}) {
  return (
    <NeoCard tone="pink" hover={false} className="space-y-2">
      <p className="text-xs font-black uppercase opacity-70">Hearts</p>
      <p className="text-2xl font-black tracking-tight">
        {"❤️".repeat(Math.max(0, hearts))}
        {"🖤".repeat(Math.max(0, max - hearts))}
      </p>
      <p className="text-sm font-bold">
        {isPlus ? "Unlimited (Plus)" : `${hearts}/${max}`}
      </p>
      {!isPlus && hearts < max && nextHeartAt && (
        <p className="text-xs font-medium opacity-80">
          Next in ~30 min ·{" "}
          {new Date(nextHeartAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      )}
      {!isPlus && hearts === 0 && (
        <NeoLink href="/plus" tone="ink" className="mt-1 w-full text-xs">
            Get Plus · unlimited
          </NeoLink>
      )}
    </NeoCard>
  );
}
