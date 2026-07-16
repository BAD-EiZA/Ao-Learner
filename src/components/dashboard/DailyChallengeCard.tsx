"use client";

import { NeoBadge, NeoCard, NeoLink } from "@/components/ui/neo";

export type DailyChallengeView = {
  dateKey: string;
  stage: {
    id: string;
    title: string;
    language: string;
    expectedText: string;
    meaningId: string;
    description: string;
  };
  completed: boolean;
  score: number | null;
  passed: boolean;
};

export function DailyChallengeCard({ daily }: { daily: DailyChallengeView | null }) {
  if (!daily) {
    return (
      <NeoCard tone="white" hover={false}>
        <p className="font-black">Daily challenge</p>
        <p className="mt-1 text-sm font-medium opacity-70">No stages yet.</p>
      </NeoCard>
    );
  }

  return (
    <NeoCard tone={daily.completed ? "lime" : "cyan"} hover={false} className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-black uppercase">Daily challenge</p>
        <NeoBadge tone="white">{daily.dateKey}</NeoBadge>
      </div>
      <div>
        <p className="text-lg font-black">{daily.stage.title}</p>
        <p className="text-sm font-bold opacity-90">
          {daily.stage.expectedText}
        </p>
        {daily.stage.meaningId ? (
          <p className="text-xs font-medium opacity-80">
            = {daily.stage.meaningId}
          </p>
        ) : null}
      </div>
      {daily.completed ? (
        <p className="text-sm font-black">
          Done{daily.score != null ? ` · score ${daily.score}` : ""}
          {daily.passed ? " · passed" : ""}
        </p>
      ) : (
        <NeoLink href={`/learn/${daily.stage.id}?daily=1`} tone="ink" className="w-full sm:w-auto">
            Take today&apos;s challenge
          </NeoLink>
      )}
    </NeoCard>
  );
}
