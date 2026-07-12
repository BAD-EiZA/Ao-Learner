"use client";

import { useEffect, useRef, useState } from "react";
import { NeoCard } from "@/components/ui/neo";

/** Draw simple amplitude envelopes for tutor vs user (visual compare). */
export function CompareWaveform({
  tutorUrl,
  userBlob,
}: {
  tutorUrl: string | null;
  userBlob: Blob | null;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tutorUrl && !userBlob) return;
    let cancelled = false;

    (async () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const w = (canvas.width = canvas.clientWidth * 2 || 600);
      const h = (canvas.height = 120);

      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, w, h);

      const draw = async (
        source: ArrayBuffer | null,
        color: string,
        y0: number,
        label: string
      ) => {
        if (!source) return;
        const AC =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext;
        const ac = new AC();
        try {
          const audio = await ac.decodeAudioData(source.slice(0));
          const data = audio.getChannelData(0);
          const step = Math.max(1, Math.floor(data.length / (w - 20)));
          ctx.strokeStyle = color;
          ctx.lineWidth = 2;
          ctx.beginPath();
          for (let x = 0; x < w - 20; x++) {
            let max = 0;
            const start = x * step;
            for (let i = 0; i < step; i++) {
              max = Math.max(max, Math.abs(data[start + i] ?? 0));
            }
            const y = y0 - max * 40;
            if (x === 0) ctx.moveTo(10 + x, y);
            else ctx.lineTo(10 + x, y);
          }
          ctx.stroke();
          ctx.fillStyle = color;
          ctx.font = "bold 16px sans-serif";
          ctx.fillText(label, 12, y0 - 44);
        } finally {
          await ac.close().catch(() => undefined);
        }
      };

      try {
        let tutorBuf: ArrayBuffer | null = null;
        if (tutorUrl) {
          const res = await fetch(tutorUrl);
          if (res.ok) tutorBuf = await res.arrayBuffer();
        }
        let userBuf: ArrayBuffer | null = null;
        if (userBlob) userBuf = await userBlob.arrayBuffer();

        if (cancelled) return;
        await draw(tutorBuf, "#1B4EF5", 50, "Tutor");
        await draw(userBuf, "#FF6B9D", 110, "You");
      } catch {
        if (!cancelled) setError("Could not compare audio");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [tutorUrl, userBlob]);

  if (!tutorUrl && !userBlob) return null;

  return (
    <NeoCard tone="white" hover={false} className="space-y-2">
      <p className="text-xs font-black uppercase opacity-70">Compare audio</p>
      {error ? (
        <p className="text-sm font-bold text-neo-muted">{error}</p>
      ) : (
        <canvas
          ref={canvasRef}
          className="neo-border h-[120px] w-full rounded-xl bg-neo-white"
        />
      )}
    </NeoCard>
  );
}
