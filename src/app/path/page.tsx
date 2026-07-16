import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/user";
import { getStagesWithProgress } from "@/lib/db/progress";
import { NeoBadge, NeoCard, NeoLink } from "@/components/ui/neo";
import type { StageView } from "@/types/stage";
import { crownEmoji } from "@/lib/learning/crowns";
import { LANGUAGE_META, LANGUAGES, parseLangParam } from "@/lib/languages";

export const dynamic = "force-dynamic";

const CEFR = ["A1", "A2", "B1", "B2", "C1"] as const;

export default async function PathPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const user = await requireUser();
  if (!user) redirect("/api/auth/login?post_login_redirect_url=/path");

  const sp = await searchParams;
  const lang = parseLangParam(sp.lang);
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
      <nav className="flex flex-wrap gap-2" aria-label="Path language">
        {LANGUAGES.map((l) => (
          <NeoLink
            key={l}
            href={`/path?lang=${LANGUAGE_META[l].code}`}
            tone={lang === l ? "primary" : "surface"}
            aria-current={lang === l ? "page" : undefined}
          >
            {LANGUAGE_META[l].label}
          </NeoLink>
        ))}
      </nav>
      <NeoLink
        href={`/checkpoint?lang=${LANGUAGE_META[lang].code}`}
        tone="surface"
      >
        Checkpoints for {LANGUAGE_META[lang].label}
      </NeoLink>

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
                      <p className="text-xs font-black uppercase opacity-70">
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
                      <NeoLink href={`/learn/${s.id}`} tone={done ? "info" : "primary"}>
                        {done ? "Retry" : "Start"}
                      </NeoLink>
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
