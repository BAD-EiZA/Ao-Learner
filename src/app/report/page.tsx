import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/user";
import { getWeeklyReport } from "@/lib/learning/report";
import { NeoBadge, NeoCard, NeoLink } from "@/components/ui/neo";

export const dynamic = "force-dynamic";

export default async function ReportPage() {
  const user = await requireUser();
  if (!user) redirect("/api/auth/login?post_login_redirect_url=/report");

  const r = await getWeeklyReport(user.id);

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-3 py-8">
      <NeoBadge tone="yellow">Weekly report</NeoBadge>
      <h1 className="text-3xl font-black text-neo-ink">This week</h1>
      <p className="text-sm font-medium text-neo-muted">
        {r.weekKey} · {r.activeDays} active day{r.activeDays === 1 ? "" : "s"}
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        <NeoCard tone="cyan" hover={false}>
          <p className="text-xs font-black uppercase opacity-70">Attempts</p>
          <p className="text-2xl font-black">{r.totalAttempts}</p>
          <p className="text-xs font-bold">
            {r.passed} passed · {r.failRate}% fail
          </p>
        </NeoCard>
        <NeoCard tone="lime" hover={false}>
          <p className="text-xs font-black uppercase opacity-70">Avg score</p>
          <p className="text-2xl font-black">{r.avgScore}</p>
        </NeoCard>
        <NeoCard tone="purple" hover={false}>
          <p className="text-xs font-black uppercase opacity-70">Week XP</p>
          <p className="text-2xl font-black">{r.weekXp}</p>
          <p className="text-xs font-bold">
            Lv.{r.level} · total {r.xp} XP
          </p>
        </NeoCard>
        <NeoCard tone="orange" hover={false}>
          <p className="text-xs font-black uppercase opacity-70">Streak / league</p>
          <p className="text-2xl font-black">
            {r.streak}🔥
          </p>
          <p className="text-xs font-bold capitalize">{r.leagueTier}</p>
        </NeoCard>
      </div>

      <section className="space-y-2">
        <h2 className="font-black">Weak spots</h2>
        {r.weakSpots.length === 0 ? (
          <NeoCard tone="white" hover={false}>
            <p className="text-sm font-bold">No weak data yet — keep speaking.</p>
          </NeoCard>
        ) : (
          <ul className="space-y-2">
            {r.weakSpots.map((w) => (
              <li key={`${w.language}-${w.bucket}`}>
                <NeoCard tone="pink" hover={false} className="text-sm">
                  <span className="font-black">{w.bucket}</span> · avg{" "}
                  {w.avgScore ?? "—"} · {w.language}
                </NeoCard>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-2">
        <h2 className="font-black">Badges this week</h2>
        {r.badgesUnlocked.length === 0 ? (
          <p className="text-sm font-medium text-neo-muted">None yet.</p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {r.badgesUnlocked.map((b) => (
              <li
                key={b.code}
                className="neo-border rounded-xl bg-neo-lime px-3 py-1 text-sm font-black"
              >
                {b.emoji} {b.title}
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="flex flex-wrap gap-2">
        <NeoLink href="/dashboard" tone="white">← Dashboard</NeoLink>
        <NeoLink href="/practice" tone="ink">Practice weak spots</NeoLink>
      </div>
    </div>
  );
}
