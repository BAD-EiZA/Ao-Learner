"use client";

import { NeoCard } from "@/components/ui/neo";
import { BUCKET_LABELS } from "@/lib/learning/phoneme-labels";

export type HeatItem = {
  bucket: string;
  language: string;
  attempts: number;
  fails: number;
  avgScore: number;
  failRate: number;
};

export function HeatmapCard({ items }: { items: HeatItem[] }) {
  if (!items.length) {
    return (
      <NeoCard tone="white" hover={false}>
        <p className="text-xs font-black uppercase opacity-70">Skill heat-map</p>
        <p className="mt-2 text-sm font-medium opacity-70">
          Practice more to unlock your pronunciation map.
        </p>
      </NeoCard>
    );
  }

  return (
    <NeoCard tone="white" hover={false} className="space-y-3">
      <p className="text-xs font-black uppercase opacity-70">Skill heat-map</p>
      <ul className="space-y-2">
        {items.slice(0, 8).map((it) => {
          const label = BUCKET_LABELS[it.bucket] ?? it.bucket;
          const hot = it.failRate >= 40 || it.avgScore < 60;
          return (
            <li key={`${it.language}-${it.bucket}`}>
              <div className="flex items-center justify-between gap-2 text-xs font-bold">
                <span>
                  {label}{" "}
                  <span className="opacity-60">({it.language})</span>
                </span>
                <span>{it.avgScore} avg</span>
              </div>
              <div className="neo-border mt-1 h-2 overflow-hidden rounded-full bg-neo-white">
                <div
                  className={`h-full ${hot ? "bg-neo-pink" : "bg-neo-ink"}`}
                  style={{ width: `${Math.min(100, it.avgScore)}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </NeoCard>
  );
}
