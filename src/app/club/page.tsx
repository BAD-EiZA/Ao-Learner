"use client";

import { useEffect, useState } from "react";
import { NeoBadge, NeoButton, NeoCard, NeoLink } from "@/components/ui/neo";

export default function ClubPage() {
  const [board, setBoard] = useState<{
    code: string;
    name: string;
    weekXp: number;
    members: { rank: number; name: string; weekXp: number; isMe: boolean }[];
  } | null>(null);
  const [name, setName] = useState("Ao Club");
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(true);
  const [failed, setFailed] = useState(false);

  const load = () =>
    fetch("/api/club")
      .then((r) => r.json())
      .then((d) => setBoard(d.board))
      .catch(() => {
        setFailed(true);
        setMsg("Could not load club.");
      })
      .finally(() => setBusy(false));

  useEffect(() => {
    void load();
  }, []);

  const create = async () => {
    setBusy(true);
    setFailed(false);
    const res = await fetch("/api/club", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create", name }),
    });
    const j = await res.json();
    setFailed(!res.ok);
    setMsg(res.ok ? `Created ${j.club?.code}` : j.error ?? "Could not create club.");
    void load();
  };

  const join = async () => {
    setBusy(true);
    setFailed(false);
    const res = await fetch("/api/club", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    const j = await res.json();
    setFailed(!res.ok);
    setMsg(res.ok ? "Joined!" : j.error ?? "Could not join club.");
    void load();
  };

  return (
    <div className="mx-auto max-w-lg space-y-6 px-3 py-8" aria-busy={busy}>
      <NeoBadge tone="info">Club</NeoBadge>
      <h1 className="text-3xl font-black">Private league</h1>
      {board ? (
        <NeoCard tone="info" hover={false} className="space-y-2">
          <p className="font-black">
            {board.name} · {board.code}
          </p>
          <p className="text-sm font-bold">Week XP {board.weekXp}</p>
          <ul className="space-y-1">
            {board.members.map((m) => (
              <li
                key={m.rank}
                className={`flex justify-between text-sm font-bold ${
                  m.isMe ? "text-neo-ink" : "opacity-80"
                }`}
              >
                <span>
                  #{m.rank} {m.name}
                  {m.isMe ? " (you)" : ""}
                </span>
                <span>{m.weekXp}</span>
              </li>
            ))}
          </ul>
        </NeoCard>
      ) : (
        <div className="space-y-3">
          <NeoCard hover={false} className="space-y-2">
            <h2 className="font-black">Create club</h2>
            <label htmlFor="club-name" className="text-sm font-bold">Club name</label>
            <input
              id="club-name"
              className="neo-border w-full rounded-xl px-3 py-2 font-bold"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <NeoButton tone="primary" disabled={busy} onClick={() => void create()}>
              Create
            </NeoButton>
          </NeoCard>
          <NeoCard hover={false} className="space-y-2">
            <h2 className="font-black">Join with code</h2>
            <label htmlFor="club-code" className="text-sm font-bold">Club code</label>
            <input
              id="club-code"
              className="neo-border w-full rounded-xl px-3 py-2 font-black uppercase"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
            <NeoButton tone="info" disabled={busy} onClick={() => void join()}>
              Join
            </NeoButton>
          </NeoCard>
        </div>
      )}
      {msg && <p className="text-xs font-black" role={failed ? "alert" : "status"} aria-live="polite">{msg}</p>}
      <NeoLink href="/dashboard" tone="surface">← Dashboard</NeoLink>
    </div>
  );
}
