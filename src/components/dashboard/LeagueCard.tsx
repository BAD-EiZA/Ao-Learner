"use client";

import Link from "next/link";
import { NeoCard, NeoButton } from "@/components/ui/neo";

const TIER_EMOJI: Record<string, string> = {
  bronze: "🥉",
  silver: "🥈",
  gold: "🥇",
  sapphire: "💎",
  ruby: "❤️‍🔥",
};

export function LeagueCard({
  tier,
  weekXp,
}: {
  tier: string;
  weekXp: number;
}) {
  const emoji = TIER_EMOJI[tier] ?? "🏅";
  return (
    <NeoCard tone="yellow" hover={false} className="space-y-2">
      <p className="text-xs font-black uppercase opacity-70">Weekly league</p>
      <p className="text-2xl font-black capitalize">
        {emoji} {tier}
      </p>
      <p className="text-sm font-bold">{weekXp} XP this week</p>
      <Link href="/path">
        <NeoButton tone="ink" className="w-full text-xs">
          Path map
        </NeoButton>
      </Link>
    </NeoCard>
  );
}
