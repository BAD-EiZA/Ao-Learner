"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { NeoBadge, NeoButton, NeoCard } from "@/components/ui/neo";

type ShopData = {
  gems: number;
  items: { id: string; name: string; cost: number; desc: string }[];
  chestsClaimed: number;
  chestsUnlocked: number;
  streakFreezes: number;
};

export default function ShopPage() {
  const [data, setData] = useState<ShopData | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = () =>
    fetch("/api/shop")
      .then((r) => r.json())
      .then(setData)
      .catch(() => null);

  useEffect(() => {
    void load();
  }, []);

  const buy = async (itemId: string) => {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/shop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId }),
      });
      const j = await res.json();
      if (!res.ok) setMsg(j.error ?? "Failed");
      else {
        setMsg(`Bought! Gems left: ${j.gems}`);
        void load();
      }
    } finally {
      setBusy(false);
    }
  };

  const claimChest = async (index: number) => {
    setBusy(true);
    try {
      const res = await fetch("/api/shop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "chest", index }),
      });
      const j = await res.json();
      if (!res.ok) setMsg(j.error ?? "Locked");
      else {
        setMsg(`Chest! +${j.gems} gems +${j.xp} XP`);
        void load();
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg space-y-6 px-3 py-8">
      <NeoBadge tone="yellow">Shop</NeoBadge>
      <h1 className="text-3xl font-black">Gems & freezes</h1>
      <p className="text-2xl font-black">💎 {data?.gems ?? "…"}</p>
      <p className="text-sm font-bold text-neo-muted">
        Freezes: {data?.streakFreezes ?? 0}
      </p>
      {msg && (
        <p className="neo-border rounded-lg bg-neo-lime px-2 py-1 text-xs font-black">
          {msg}
        </p>
      )}
      <ul className="space-y-2">
        {(data?.items ?? []).map((it) => (
          <li key={it.id}>
            <NeoCard className="flex items-center justify-between gap-2">
              <div>
                <p className="font-black">{it.name}</p>
                <p className="text-xs font-bold opacity-70">
                  {it.desc} · {it.cost} 💎
                </p>
              </div>
              <NeoButton
                tone="ink"
                disabled={busy}
                onClick={() => buy(it.id)}
              >
                Buy
              </NeoButton>
            </NeoCard>
          </li>
        ))}
      </ul>
      <section className="space-y-2">
        <h2 className="font-black">Path chests</h2>
        <p className="text-xs font-bold text-neo-muted">
          Every 5 stages · claimed {data?.chestsClaimed ?? 0}/
          {data?.chestsUnlocked ?? 0}
        </p>
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: Math.max(1, data?.chestsUnlocked ?? 0) }).map(
            (_, i) => (
              <NeoButton
                key={i}
                tone={
                  i < (data?.chestsClaimed ?? 0) ? "white" : "orange"
                }
                disabled={busy || i < (data?.chestsClaimed ?? 0)}
                onClick={() => claimChest(i)}
              >
                📦 #{i + 1}
              </NeoButton>
            )
          )}
        </div>
      </section>
      <Link href="/dashboard">
        <NeoButton tone="white">← Dashboard</NeoButton>
      </Link>
    </div>
  );
}
