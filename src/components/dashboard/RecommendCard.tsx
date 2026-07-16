"use client";

import Link from "next/link";
import { NeoBadge, NeoCard, NeoLink } from "@/components/ui/neo";

export type RecommendItem = {
  stageId: string;
  title: string;
  reason: string;
  language: string;
  cefrLevel: string;
  expectedText: string;
  kind: string;
};

export function RecommendCard({ items }: { items: RecommendItem[] }) {
  if (!items.length) {
    return (
      <NeoCard tone="white" hover={false}>
        <p className="font-black">Recommended</p>
        <p className="text-sm font-medium opacity-70">
          Complete a stage to get smart suggestions.
        </p>
      </NeoCard>
    );
  }

  const top = items[0]!;
  return (
    <NeoCard tone="cyan" hover={false} className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-xs font-black uppercase">Recommended for you</p>
        <NeoBadge tone="white">{top.kind}</NeoBadge>
        <NeoBadge tone="purple">{top.cefrLevel}</NeoBadge>
      </div>
      <div>
        <p className="text-lg font-black">{top.title}</p>
        <p className="text-sm font-bold">{top.expectedText}</p>
        <p className="text-xs font-medium opacity-80">{top.reason}</p>
      </div>
      <NeoLink href={`/learn/${top.stageId}`} tone="ink" className="w-full sm:w-auto">
          Start recommended
        </NeoLink>
      {items.length > 1 && (
        <ul className="space-y-1 text-xs font-bold opacity-90">
          {items.slice(1, 4).map((it) => (
            <li key={it.stageId}>
              <Link
                href={`/learn/${it.stageId}`}
                className="underline decoration-2"
              >
                {it.title}
              </Link>{" "}
              · {it.reason}
            </li>
          ))}
        </ul>
      )}
    </NeoCard>
  );
}
