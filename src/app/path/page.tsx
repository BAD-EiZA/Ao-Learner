import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { requireUser } from "@/lib/auth/user";
import { getStagesWithProgress } from "@/lib/db/progress";
import { NeoBadge, NeoCard, NeoLink } from "@/components/ui/neo";
import type { StageView } from "@/types/stage";
import { crownEmoji } from "@/lib/learning/crowns";
import { LANGUAGE_META, LANGUAGES, parseLangParam } from "@/lib/languages";
import { type Locale } from "@/lib/i18n/messages";

export const dynamic = "force-dynamic";

const CEFR = ["A1", "A2", "B1", "B2", "C1"] as const;

export default async function PathPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const locale = ((await cookies()).get("ao_locale")?.value === "id" ? "id" : "en") as Locale;
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
      <NeoBadge tone="info">{locale === "id" ? "Jalur belajar" : "Learning path"}</NeoBadge>
      <h1 className="text-3xl font-black text-neo-ink">
        {locale === "id" ? "Jalur" : "Path"} {LANGUAGE_META[lang].label}
      </h1>
      <p className="max-w-xl text-sm font-medium text-neo-muted">
        {locale === "id"
          ? "Selesaikan stage aktif untuk membuka stage berikutnya."
          : "Complete active stages to unlock what comes next."}
      </p>
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
        {locale === "id" ? "Checkpoint" : "Checkpoints"} {LANGUAGE_META[lang].label}
      </NeoLink>

      {byCefr.map(({ level, stages: list }) => (
        <section key={level} className="space-y-3">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-black text-neo-ink">{level}</h2>
            <p className="text-xs font-bold text-neo-muted">
              {list.filter((stage) => stage.isCompleted).length}/{list.length} {locale === "id" ? "selesai" : "complete"}
            </p>
          </div>
          <ol className="relative space-y-3 border-l-4 border-neo-ink pl-4">
            {list.map((s) => {
              const done = s.isCompleted;
              const coolingDown = s.cooldownActive;
              const locked = !s.unlocked || coolingDown;
              const state = done
                ? locale === "id" ? "Selesai" : "Complete"
                : coolingDown
                  ? locale === "id" ? "Menunggu" : "Waiting"
                  : locked
                    ? locale === "id" ? "Terkunci" : "Locked"
                    : locale === "id" ? "Stage aktif" : "Active stage";
              return (
                <li key={s.id} className="relative">
                  <span
                    aria-hidden
                    className={`absolute -left-[1.78rem] top-6 h-4 w-4 rounded-full border-2 border-neo-ink ${
                      done ? "bg-neo-success" : locked ? "bg-neo-white" : "bg-neo-primary"
                    }`}
                  />
                  <NeoCard
                    tone={done ? "success" : locked ? "surface" : "info"}
                    className="flex flex-wrap items-center justify-between gap-3"
                  >
                    <div>
                      <p className="text-xs font-black uppercase opacity-70">
                        {locale === "id" ? "Stage" : "Stage"} {s.order} · {state}
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
                      {coolingDown ? (
                        <p className="mt-1 text-xs font-black text-neo-warning-ink">
                          {locale === "id" ? "Coba lagi setelah cooldown selesai" : "Try again after cooldown ends"}
                        </p>
                      ) : null}
                    </div>
                    {!locked ? (
                      <NeoLink href={`/learn/${s.id}`} tone={done ? "surface" : "primary"}>
                        {done ? locale === "id" ? "Ulangi" : "Retry" : locale === "id" ? "Mulai" : "Start"}
                      </NeoLink>
                    ) : (
                      <span className="text-xs font-black opacity-50">{locale === "id" ? "Terkunci" : "Locked"}</span>
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
