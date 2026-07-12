import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/user";
import { getStagesWithProgress } from "@/lib/db/progress";
import { NeoBadge, NeoButton, NeoCard } from "@/components/ui/neo";
import type { StageView } from "@/types/stage";
import { crownEmoji } from "@/lib/learning/crowns";

export const dynamic = "force-dynamic";

const CEFR = ["A1", "A2", "B1"] as const;

export default async function PathPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const user = await requireUser();
  if (!user) redirect("/api/auth/login?post_login_redirect_url=/path");

  const sp = await searchParams;
  const lang = sp.lang === "de" ? "GERMAN" : "ENGLISH";
  const stages = (await getStagesWithProgress(
    user.id,
    lang
  )) as StageView[];

  const byCefr = CEFR.map((level) => ({
    level,
    stages: stages.filter(
      (s) =>
        s.cefrLevel === level &&
        (s.mode === "PHRASE" || !s.mode)
    ),
  }));

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-3 py-8">
      <NeoBadge tone="cyan">Learning path</NeoBadge>
      <h1 className="text-3xl font-black text-neo-ink">Your path</h1>
      <div className="flex flex-wrap gap-2">
        <Link href="/path?lang=en">
          <NeoButton tone={lang === "ENGLISH" ? "ink" : "white"}>
            English
          </NeoButton>
        </Link>
        <Link href="/path?lang=de">
          <NeoButton tone={lang === "GERMAN" ? "ink" : "white"}>
            German
          </NeoButton>
        </Link>
        <Link href="/dashboard">
          <NeoButton tone="pink">Dashboard</NeoButton>
        </Link>
        <Link href="/checkpoint">
          <NeoButton tone="ink">Checkpoints</NeoButton>
        </Link>
        <Link href="/shop">
          <NeoButton tone="yellow">Shop</NeoButton>
        </Link>
      </div>

      {byCefr.map(({ level, stages: list }) => (
        <section key={level} className="space-y-3">
          <h2 className="text-lg font-black text-neo-ink">{level}</h2>
          <ol className="relative space-y-3 border-l-4 border-neo-ink pl-4">
            {list.map((s) => {
              const done = s.isCompleted;
              const locked = !s.unlocked;
              return (
                <li key={s.id}>
                  <NeoCard
                    tone={
                      done ? "lime" : locked ? "white" : "yellow"
                    }
                    className="flex flex-wrap items-center justify-between gap-3"
                  >
                    <div>
                      <p className="text-[10px] font-black uppercase opacity-70">
                        #{s.order}
                        {done ? " · done" : locked ? " · locked" : " · open"}
                        {s.bestScore != null ? ` · best ${s.bestScore}` : ""}
                        {(s.crowns ?? 0) > 0
                          ? ` · ${crownEmoji(s.crowns ?? 0)}`
                          : ""}
                        {s.legendary ? " · ⭐ legendary" : ""}
                      </p>
                      <p className="font-black">{s.title}</p>
                      <p className="text-sm font-bold opacity-80">
                        {s.expectedText}
                      </p>
                    </div>
                    {!locked ? (
                      <Link href={`/learn/${s.id}`}>
                        <NeoButton tone={done ? "cyan" : "ink"}>
                          {done ? "Retry" : "Start"}
                        </NeoButton>
                      </Link>
                    ) : (
                      <span className="text-xs font-black opacity-50">🔒</span>
                    )}
                  </NeoCard>
                </li>
              );
            })}
          </ol>
        </section>
      ))}
    </div>
  );
}
