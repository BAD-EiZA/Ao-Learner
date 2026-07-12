"use client";

import { MatchPairs, type MatchItem } from "@/components/learn/MatchPairs";
import { NeoCard } from "@/components/ui/neo";

export function MatchGameClient({ items }: { items: MatchItem[] }) {
  return (
    <NeoCard tone="white" hover={false}>
      <MatchPairs items={items} />
    </NeoCard>
  );
}
