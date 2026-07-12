"use client";

import { useState } from "react";
import { NeoButton, NeoCard } from "@/components/ui/neo";

type Row = {
  rank: number;
  name: string;
  xp: number;
  level: number;
  streak: number;
  passed: number;
};

export function LeaderboardPanel({
  initialOptIn,
  initialRows,
}: {
  initialOptIn: boolean;
  initialRows: Row[];
}) {
  const [optIn, setOptIn] = useState(initialOptIn);
  const [rows, setRows] = useState(initialRows);
  const [loading, setLoading] = useState(false);

  const toggle = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/leaderboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ optIn: !optIn }),
      });
      const data = await res.json();
      setOptIn(!!data.optIn);
      setRows(data.rows ?? []);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-black uppercase tracking-tight text-neo-ink">
          Leaderboard
        </h2>
        <NeoButton
          type="button"
          tone={optIn ? "lime" : "white"}
          disabled={loading}
          onClick={toggle}
        >
          {optIn ? "Opted in ✓" : "Opt in"}
        </NeoButton>
      </div>
      {!optIn ? (
        <p className="text-sm font-bold text-neo-muted">
          Opt in to appear on the public XP board. Off by default.
        </p>
      ) : rows.length === 0 ? (
        <p className="text-sm font-bold text-neo-muted">
          You&apos;re in — be the first on the board!
        </p>
      ) : (
        <NeoCard tone="white" hover={false} className="overflow-hidden p-0">
          <ul className="divide-y-2 divide-neo-ink">
            {rows.map((r) => (
              <li
                key={r.rank}
                className="flex items-center justify-between gap-2 px-3 py-2 text-sm font-bold"
              >
                <span className="min-w-0 truncate">
                  #{r.rank} {r.name}
                </span>
                <span className="shrink-0 font-black">
                  Lv.{r.level} · {r.xp} XP
                </span>
              </li>
            ))}
          </ul>
        </NeoCard>
      )}
    </section>
  );
}
