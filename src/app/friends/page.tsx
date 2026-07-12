"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { NeoBadge, NeoButton, NeoCard } from "@/components/ui/neo";

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

  const load = () =>
    fetch("/api/friends")
      .then((r) => r.json())
      .then((d) => {
        setCode(d.code ?? "");
        setQuest(d.quest);
      });

  useEffect(() => {
    void load();
  }, []);

  const link = async () => {
    const res = await fetch("/api/friends", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: input }),
    });
    const j = await res.json();
    setMsg(res.ok ? "Linked!" : j.error);
    void load();
  };

  const claim = async () => {
    const res = await fetch("/api/friends", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "claim" }),
    });
    const j = await res.json();
    setMsg(res.ok ? "Quest claimed!" : j.error);
  };

  return (
    <div className="mx-auto max-w-lg space-y-6 px-3 py-8">
      <NeoBadge tone="cyan">Friends</NeoBadge>
      <h1 className="text-3xl font-black">Friend quest</h1>
      <NeoCard hover={false}>
        <p className="text-xs font-black uppercase opacity-70">Your code</p>
        <p className="text-2xl font-black tracking-widest">{code || "…"}</p>
      </NeoCard>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          className="neo-border min-h-11 min-w-0 flex-1 rounded-xl px-3 py-2 font-black uppercase"
          placeholder="Friend code"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <NeoButton
          tone="ink"
          className="w-full sm:w-auto"
          onClick={() => void link()}
        >
          Link
        </NeoButton>
      </div>
      {quest && (
        <NeoCard tone="yellow" hover={false}>
          <p className="font-black">Today duo XP</p>
          <p className="text-sm font-bold">
            You {quest.myXp} + Friend {quest.theirXp} = {quest.combined}/
            {quest.target}
          </p>
          {quest.met && (
            <NeoButton tone="lime" className="mt-2" onClick={() => void claim()}>
              Claim reward
            </NeoButton>
          )}
        </NeoCard>
      )}
      {msg && <p className="text-xs font-black">{msg}</p>}
      <Link href="/club">
        <NeoButton tone="purple">Clubs</NeoButton>
      </Link>
      <Link href="/dashboard">
        <NeoButton tone="white">← Dashboard</NeoButton>
      </Link>
    </div>
  );
}
