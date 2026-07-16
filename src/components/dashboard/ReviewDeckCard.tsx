"use client";

import { NeoBadge, NeoCard, NeoLink } from "@/components/ui/neo";

export function ReviewDeckCard({
  count,
  items,
}: {
  count: number;
  items: {
    stageId: string;
    title: string;
    expectedText: string;
    language: string;
  }[];
}) {
  return (
    <NeoCard tone="orange" hover={false} className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-black uppercase">Review deck</p>
        <NeoBadge tone="white">{count} due</NeoBadge>
      </div>
      {count === 0 ? (
        <p className="text-sm font-medium opacity-80">
          No reviews due. Keep practicing!
        </p>
      ) : (
        <>
          <ul className="space-y-1 text-sm font-bold">
            {items.slice(0, 3).map((it) => (
              <li key={it.stageId}>
                {it.title}{" "}
                <span className="opacity-70">({it.language})</span>
              </li>
            ))}
          </ul>
          <NeoLink href={`/review`} tone="ink" className="w-full sm:w-auto">
              Open review deck
            </NeoLink>
        </>
      )}
    </NeoCard>
  );
}
