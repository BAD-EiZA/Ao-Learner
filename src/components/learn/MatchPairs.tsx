"use client";

import { useMemo, useState } from "react";
import { NeoButton, NeoCard } from "@/components/ui/neo";
import { trackClient } from "@/lib/analytics";

export type MatchItem = {
  stageId: string;
  phrase: string;
  meaningId: string;
};

type Side = { id: string; text: string; pairId: string; kind: "p" | "m" };

function shuffle<T>(arr: T[]) {
  return [...arr].sort(() => Math.random() - 0.5);
}

export function MatchPairs({
  items,
  onDone,
}: {
  items: MatchItem[];
  onDone?: (correct: number, total: number) => void;
}) {
  const deck = useMemo(() => {
    const left: Side[] = items.map((it) => ({
      id: `p-${it.stageId}`,
      text: it.phrase,
      pairId: it.stageId,
      kind: "p",
    }));
    const right: Side[] = items.map((it) => ({
      id: `m-${it.stageId}`,
      text: it.meaningId,
      pairId: it.stageId,
      kind: "m",
    }));
    return { left: shuffle(left), right: shuffle(right) };
  }, [items]);

  const [picked, setPicked] = useState<Side | null>(null);
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [wrong, setWrong] = useState<string | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [done, setDone] = useState(false);

  const select = (card: Side) => {
    if (matched.has(card.pairId) || done) return;
    if (wrong) return;

    if (!picked) {
      setPicked(card);
      return;
    }
    if (picked.id === card.id) {
      setPicked(null);
      return;
    }
    if (picked.kind === card.kind) {
      setPicked(card);
      return;
    }
    if (picked.pairId === card.pairId) {
      const next = new Set(matched);
      next.add(card.pairId);
      setMatched(next);
      setPicked(null);
      if (next.size >= items.length) {
        setDone(true);
        onDone?.(items.length - mistakes, items.length);
        trackClient("match_pairs", {
          correct: items.length - mistakes,
          total: items.length,
        });
      }
    } else {
      setWrong(`${picked.id}|${card.id}`);
      setMistakes((m) => m + 1);
      setTimeout(() => {
        setWrong(null);
        setPicked(null);
      }, 500);
    }
  };

  const isActive = (c: Side) => picked?.id === c.id;
  const isMatched = (c: Side) => matched.has(c.pairId);
  const isWrong = (c: Side) => wrong?.includes(c.id);

  return (
    <div className="space-y-4">
      <p className="text-sm font-bold text-neo-muted">
        Tap a phrase, then its meaning. {matched.size}/{items.length}
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <p className="text-xs font-black uppercase">Phrase</p>
          {deck.left.map((c) => (
            <button
              key={c.id}
              type="button"
              disabled={isMatched(c)}
              onClick={() => select(c)}
              className={`neo-border min-h-11 w-full rounded-xl px-3 py-3 text-left text-sm font-black transition ${
                isMatched(c)
                  ? "bg-neo-lime opacity-70"
                  : isWrong(c)
                    ? "bg-neo-pink"
                    : isActive(c)
                      ? "bg-neo-ink text-neo-white"
                      : "bg-neo-white hover:bg-neo-yellow"
              }`}
            >
              {c.text}
            </button>
          ))}
        </div>
        <div className="space-y-2">
          <p className="text-xs font-black uppercase">Meaning (ID)</p>
          {deck.right.map((c) => (
            <button
              key={c.id}
              type="button"
              disabled={isMatched(c)}
              onClick={() => select(c)}
              className={`neo-border min-h-11 w-full rounded-xl px-3 py-3 text-left text-sm font-bold transition ${
                isMatched(c)
                  ? "bg-neo-lime opacity-70"
                  : isWrong(c)
                    ? "bg-neo-pink"
                    : isActive(c)
                      ? "bg-neo-ink text-neo-white"
                      : "bg-neo-white hover:bg-neo-cyan"
              }`}
            >
              {c.text}
            </button>
          ))}
        </div>
      </div>
      {done && (
        <NeoCard tone="lime" hover={false}>
          <p className="font-black">
            Done! {items.length - mistakes}/{items.length} clean matches
          </p>
          <p className="text-xs font-bold opacity-80">Mistakes: {mistakes}</p>
        </NeoCard>
      )}
      <NeoButton
        tone="white"
        className="text-xs"
        onClick={() => {
          setMatched(new Set());
          setPicked(null);
          setWrong(null);
          setMistakes(0);
          setDone(false);
        }}
      >
        Reset
      </NeoButton>
    </div>
  );
}
