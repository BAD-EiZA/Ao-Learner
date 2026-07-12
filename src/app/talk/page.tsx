"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { NeoBadge, NeoButton, NeoCard } from "@/components/ui/neo";

type Turn = { role: "user" | "tutor"; text: string };

export default function TalkPage() {
  const [lang, setLang] = useState<"English" | "German">("English");
  const [history, setHistory] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const send = async () => {
    const msg = input.trim();
    if (!msg || busy) return;
    setBusy(true);
    setInput("");
    const nextHist = [...history, { role: "user" as const, text: msg }];
    setHistory(nextHist);
    try {
      const res = await fetch("/api/talk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: msg,
          language: lang,
          history,
          level: "A1",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setHistory((h) => [
          ...h,
          { role: "tutor", text: data.error ?? "Error" },
        ]);
        return;
      }
      setHistory((h) => [...h, { role: "tutor", text: data.reply }]);
      if (data.audio_content) {
        const mime = data.audio_mime || "audio/wav";
        const a = new Audio(`data:${mime};base64,${data.audio_content}`);
        audioRef.current = a;
        void a.play().catch(() => undefined);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-4 px-3 py-8">
      <NeoBadge tone="pink">Talk with Ao</NeoBadge>
      <h1 className="text-3xl font-black">AI conversation</h1>
      <div className="flex gap-2">
        <NeoButton
          tone={lang === "English" ? "ink" : "white"}
          onClick={() => setLang("English")}
        >
          EN
        </NeoButton>
        <NeoButton
          tone={lang === "German" ? "ink" : "white"}
          onClick={() => setLang("German")}
        >
          DE
        </NeoButton>
      </div>
      <NeoCard tone="white" hover={false} className="min-h-[280px] space-y-2">
        {history.length === 0 && (
          <p className="text-sm font-bold text-neo-muted">
            Say hello — Ao replies in {lang} with voice.
          </p>
        )}
        {history.map((t, i) => (
          <div
            key={i}
            className={`rounded-xl px-3 py-2 text-sm font-bold ${
              t.role === "user"
                ? "ml-8 bg-neo-cyan/30"
                : "mr-8 bg-neo-pink/40"
            }`}
          >
            <span className="text-[10px] uppercase opacity-60">
              {t.role === "user" ? "You" : "Ao"}
            </span>
            <p>{t.text}</p>
          </div>
        ))}
      </NeoCard>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          className="neo-border min-h-11 min-w-0 flex-1 rounded-xl px-3 py-2 text-sm font-bold"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && void send()}
          placeholder="Type what you would say…"
          disabled={busy}
        />
        <NeoButton
          tone="ink"
          className="w-full sm:w-auto"
          disabled={busy}
          onClick={() => void send()}
        >
          {busy ? "…" : "Send"}
        </NeoButton>
      </div>
      <Link href="/dashboard">
        <NeoButton tone="white">← Dashboard</NeoButton>
      </Link>
    </div>
  );
}
