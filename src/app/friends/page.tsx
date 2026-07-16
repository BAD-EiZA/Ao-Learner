"use client";

import { useEffect, useState } from "react";
import { NeoBadge, NeoButton, NeoCard, NeoLink } from "@/components/ui/neo";

export default function FriendsPage() {
  const [code, setCode] = useState("");
  const [input, setInput] = useState("");
  const [quest, setQuest] = useState<{
    myXp: number;
    theirXp: number;
    combined: number;
    target: number;
    met: boolean;
  } | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(true);
  const [failed, setFailed] = useState(false);

  const load = () =>
    fetch("/api/friends")
      .then((r) => r.json())
      .then((d) => {
        setCode(d.code ?? "");
        setQuest(d.quest);
      })
      .catch(() => {
        setFailed(true);
        setMsg("Could not load friend quest.");
      })
      .finally(() => setBusy(false));

  useEffect(() => {
    void load();
  }, []);

  const link = async () => {
    setBusy(true);
    setFailed(false);
    const res = await fetch("/api/friends", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: input }),
    });
    const j = await res.json();
    setFailed(!res.ok);
    setMsg(res.ok ? "Linked!" : j.error ?? "Could not link friend.");
    void load();
  };

  const claim = async () => {
    setBusy(true);
    setFailed(false);
    const res = await fetch("/api/friends", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "claim" }),
    });
    const j = await res.json();
    setFailed(!res.ok);
    setMsg(res.ok ? "Quest claimed!" : j.error ?? "Could not claim quest.");
    setBusy(false);
  };

  return (
    <div className="mx-auto max-w-lg space-y-6 px-3 py-8" aria-busy={busy}>
      <NeoBadge tone="info">Friends</NeoBadge>
      <h1 className="text-3xl font-black">Friend quest</h1>
      <NeoCard hover={false}>
        <p className="text-xs font-black uppercase opacity-70">Your code</p>
        <p className="text-2xl font-black tracking-widest">{code || "…"}</p>
      </NeoCard>
      <div className="flex flex-col gap-2 sm:flex-row">
        <label htmlFor="friend-code" className="sr-only">Friend code</label>
        <input
          id="friend-code"
          className="neo-border min-h-11 min-w-0 flex-1 rounded-xl px-3 py-2 font-black uppercase"
          placeholder="Friend code"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <NeoButton
          tone="primary"
          className="w-full sm:w-auto"
          onClick={() => void link()}
          disabled={busy}
        >
          Link
        </NeoButton>
      </div>
      {quest && (
        <NeoCard tone="warning" hover={false}>
          <p className="font-black">Today duo XP</p>
          <p className="text-sm font-bold">
            You {quest.myXp} + Friend {quest.theirXp} = {quest.combined}/
            {quest.target}
          </p>
          {quest.met && (
            <NeoButton tone="success" className="mt-2" disabled={busy} onClick={() => void claim()}>
              Claim reward
            </NeoButton>
          )}
        </NeoCard>
      )}
      {msg && <p className="text-xs font-black" role={failed ? "alert" : "status"} aria-live="polite">{msg}</p>}
      <div className="flex flex-wrap gap-2">
        <NeoLink href="/club" tone="info">Clubs</NeoLink>
        <NeoLink href="/dashboard" tone="surface">← Dashboard</NeoLink>
      </div>
    </div>
  );
}
