"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { NeoButton, NeoCard } from "@/components/ui/neo";

type Item = {
  stageId: string;
  full: string;
  display: string;
  blank: string;
  meaningId: string;
  referenceAudio: string;
};

export function GapClient({ items }: { items: Item[] }) {
  const [i, setI] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const router = useRouter();
  const cur = items[i];
  if (!cur) {
    return <p className="font-bold">No items. Run seed.</p>;
  }

  return (
    <div className="space-y-4">
      <NeoCard tone="yellow" hover={false}>
        <p className="text-[10px] font-black uppercase opacity-70">
          {i + 1}/{items.length}
        </p>
        <p className="text-2xl font-black tracking-tight">{cur.display}</p>
        {revealed ? (
          <p className="mt-2 text-sm font-bold">
            Full: <span className="font-black">{cur.full}</span>
            <br />
            Gap was: <span className="font-black">{cur.blank}</span>
          </p>
        ) : (
          <p className="mt-2 text-xs font-bold opacity-70">
            Meaning: {cur.meaningId || "—"}
          </p>
        )}
      </NeoCard>
      <div className="flex flex-wrap gap-2">
        <NeoButton tone="white" onClick={() => setRevealed((v) => !v)}>
          {revealed ? "Hide" : "Reveal"}
        </NeoButton>
        <NeoButton
          tone="ink"
          onClick={() =>
            router.push(`/learn/${cur.stageId}?review=1`)
          }
        >
          Speak full phrase
        </NeoButton>
        <NeoButton
          tone="cyan"
          disabled={i >= items.length - 1}
          onClick={() => {
            setI((x) => x + 1);
            setRevealed(false);
          }}
        >
          Next gap
        </NeoButton>
      </div>
    </div>
  );
}
