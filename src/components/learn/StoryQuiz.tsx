"use client";

import { useMemo, useState } from "react";
import { NeoButton, NeoCard } from "@/components/ui/neo";

type Turn = { expectedText: string; meaningId: string; prompt?: string };

/** Simple comprehension after story: match last line meaning */
export function StoryQuiz({
  turns,
  onPass,
}: {
  turns: Turn[];
  onPass?: () => void;
}) {
  const [done, setDone] = useState(false);
  const [wrong, setWrong] = useState(false);

  const q = useMemo(() => {
    if (!turns.length) return null;
    const target = turns[turns.length - 1]!;
    const distractors = turns
      .slice(0, -1)
      .map((t) => t.meaningId)
      .filter(Boolean);
    const options = [target.meaningId, ...distractors]
      .filter(Boolean)
      .slice(0, 3);
    const shuffled = [...options].sort((a, b) => a.localeCompare(b));
    return {
      prompt: `What did the last line mean? ("${target.expectedText}")`,
      answer: target.meaningId,
      options: shuffled.length ? shuffled : [target.meaningId],
    };
  }, [turns]);

  if (!q) return null;

  return (
    <NeoCard tone="purple" hover={false} className="space-y-2">
      <p className="text-xs font-black uppercase">Comprehension</p>
      <p className="text-sm font-bold">{q.prompt}</p>
      <div className="flex flex-col gap-2">
        {q.options.map((opt) => (
          <NeoButton
            key={opt}
            tone={done && opt === q.answer ? "lime" : "white"}
            disabled={done}
            onClick={() => {
              if (opt === q.answer) {
                setDone(true);
                setWrong(false);
                onPass?.();
              } else {
                setWrong(true);
              }
            }}
          >
            {opt}
          </NeoButton>
        ))}
      </div>
      {wrong && !done && (
        <p className="text-xs font-black text-neo-ink">Try again</p>
      )}
      {done && <p className="text-xs font-black">✓ Nice comprehension</p>}
    </NeoCard>
  );
}
