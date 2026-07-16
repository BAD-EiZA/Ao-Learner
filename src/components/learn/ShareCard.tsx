"use client";

import { useCallback, useRef, useState } from "react";
import { NeoButton, NeoCard } from "@/components/ui/neo";
import { trackClient } from "@/lib/analytics";

type Props = {
  stageTitle: string;
  expectedText: string;
  meaningId?: string;
  score: number;
  language: string;
};

export function ShareCard({
  stageTitle,
  expectedText,
  meaningId,
  score,
  language,
}: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<string | null>(null);

  const shareText = `I scored ${score}/100 on "${expectedText}" (${language}) in Ao Learner!`;

  const copyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(
        `${shareText}\n${typeof window !== "undefined" ? window.location.origin : ""}`
      );
      setStatus("Copied!");
      trackClient("share_score", { method: "copy", score });
    } catch {
      setStatus("Copy failed");
    }
  }, [shareText, score]);

  const nativeShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Ao Learner",
          text: shareText,
          url: window.location.origin,
        });
        setStatus("Shared!");
        trackClient("share_score", { method: "native", score });
      } catch {
        /* user cancelled */
      }
    } else {
      await copyLink();
    }
  }, [shareText, copyLink, score]);

  return (
    <NeoCard tone="purple" hover={false} className="space-y-3">
      <div
        ref={cardRef}
        className="neo-border rounded-2xl bg-neo-white p-4 text-neo-ink"
      >
        <p className="text-xs font-black uppercase opacity-60">Ao Learner</p>
        <p className="text-lg font-black">{stageTitle}</p>
        <p className="text-sm font-bold">&ldquo;{expectedText}&rdquo;</p>
        {meaningId ? (
          <p className="text-xs font-medium opacity-80">= {meaningId}</p>
        ) : null}
        <p className="mt-2 text-3xl font-black text-neo-ink">{score}/100</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <NeoButton type="button" tone="ink" onClick={nativeShare}>
          Share score
        </NeoButton>
        <NeoButton type="button" tone="white" onClick={copyLink}>
          Copy text
        </NeoButton>
      </div>
      {status && <p className="text-xs font-black">{status}</p>}
    </NeoCard>
  );
}
