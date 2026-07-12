"use client";

import { NeoCard } from "@/components/ui/neo";

export type HistoryItem = {
  id: string;
  score: number;
  passed: boolean;
  feedback: string | null;
  createdAt: string;
  stageTitle: string;
  language: string;
  expectedText: string;
  meaningId: string;
};

export function HistoryList({ items }: { items: HistoryItem[] }) {
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-black uppercase tracking-tight text-neo-ink">
        Recent attempts
      </h2>
      {items.length === 0 ? (
        <p className="text-sm font-bold text-neo-muted">
          No attempts yet. Complete a stage to build history.
        </p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {items.map((item) => (
            <li key={item.id}>
              <NeoCard
                tone={item.passed ? "lime" : "pink"}
                hover={false}
                className="space-y-1"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-black uppercase opacity-70">
                      {item.language}
                    </p>
                    <p className="font-black">{item.stageTitle}</p>
                    <p className="text-xs font-medium opacity-80">
                      {item.expectedText}
                    </p>
                  </div>
                  <span className="neo-border neo-shadow-sm rounded-lg bg-neo-white px-2 py-1 text-sm font-black text-neo-ink">
                    {item.score}
                  </span>
                </div>
                <p className="text-[10px] font-bold opacity-60">
                  {new Date(item.createdAt).toLocaleString()}
                </p>
              </NeoCard>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
