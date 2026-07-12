"use client";

import Link from "next/link";
import { NeoCard } from "@/components/ui/neo";
export type WeakSpot = {
  stageId: string;
  title: string;
  expectedText: string;
  meaningId: string;
  language: string;
  cefrLevel: string;
  failCount: number;
  avgScore: number;
  bestScore: number | null;
};

export function WeakSpotList({ items }: { items: WeakSpot[] }) {
  if (!items.length) return null;
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-black uppercase tracking-tight text-neo-ink">
        Weak-spot drills
      </h2>
      <ul className="grid gap-3 sm:grid-cols-2">
        {items.map((w) => (
          <li key={w.stageId}>
            <Link href={`/learn/${w.stageId}?review=1`}>
              <NeoCard tone="orange" className="space-y-1">
                <p className="text-xs font-black uppercase opacity-70">
                  {w.language} · {w.cefrLevel}
                </p>
                <p className="font-black">{w.title}</p>
                <p className="text-sm font-bold">{w.expectedText}</p>
                <p className="text-xs font-medium">
                  fails {w.failCount} · avg {w.avgScore}
                  {w.bestScore != null ? ` · best ${w.bestScore}` : ""}
                </p>
              </NeoCard>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
