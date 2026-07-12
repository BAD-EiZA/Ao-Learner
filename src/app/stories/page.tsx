import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/user";
import { prisma } from "@/lib/db/prisma";
import { NeoBadge, NeoButton, NeoCard } from "@/components/ui/neo";

export const dynamic = "force-dynamic";

export default async function StoriesPage() {
  const user = await requireUser();
  if (!user) redirect("/api/auth/login?post_login_redirect_url=/stories");

  const stages = await prisma.stage.findMany({
    where: { mode: "STORY" },
    orderBy: [{ language: "asc" }, { order: "asc" }],
    include: {
      userProgress: {
        where: { userId: user.id },
        take: 1,
      },
    },
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-3 py-8">
      <NeoBadge tone="purple">Stories</NeoBadge>
      <h1 className="text-3xl font-black text-neo-ink">Speak the story</h1>
      <p className="text-sm font-medium text-neo-muted">
        Multi-line scenes. Listen first, then say each line in order.
      </p>

      {stages.length === 0 ? (
        <NeoCard tone="white" hover={false}>
          <p className="font-black">No stories yet</p>
          <p className="text-sm font-medium opacity-80">
            Run <code className="font-black">npm run db:seed</code>
          </p>
        </NeoCard>
      ) : (
        <ul className="space-y-3">
          {stages.map((s) => {
            const done = s.userProgress[0]?.isCompleted ?? false;
            const turns = Array.isArray(s.turns) ? s.turns.length : 0;
            return (
              <li key={s.id}>
                <NeoCard
                  tone={done ? "lime" : "purple"}
                  className="flex flex-wrap items-center justify-between gap-3"
                >
                  <div>
                    <p className="text-[10px] font-black uppercase opacity-70">
                      {s.language === "ENGLISH" ? "EN" : "DE"} · {s.cefrLevel}
                      {turns ? ` · ${turns} lines` : ""}
                      {done ? " · done" : ""}
                    </p>
                    <p className="font-black">{s.title}</p>
                    <p className="text-sm font-medium opacity-90">
                      {s.description}
                    </p>
                  </div>
                  <Link href={`/learn/${s.id}`}>
                    <NeoButton tone="ink">{done ? "Replay" : "Start"}</NeoButton>
                  </Link>
                </NeoCard>
              </li>
            );
          })}
        </ul>
      )}

      <div className="flex flex-wrap gap-2">
        <Link href="/dashboard">
          <NeoButton tone="white">← Dashboard</NeoButton>
        </Link>
        <Link href="/scenarios">
          <NeoButton tone="cyan">Role-play</NeoButton>
        </Link>
      </div>
    </div>
  );
}
