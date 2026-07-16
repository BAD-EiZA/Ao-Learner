import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/user";
import { buildStudyPlan } from "@/lib/learning/plan";
import { trackServer } from "@/lib/analytics-server";
import { NeoBadge, NeoCard, NeoLink } from "@/components/ui/neo";

export const dynamic = "force-dynamic";

export default async function PlanPage() {
  const user = await requireUser();
  if (!user) redirect("/api/auth/login?post_login_redirect_url=/plan");

  const plan = await buildStudyPlan(user.id);
  await trackServer("study_plan_start", {
    userId: user.id,
    props: { count: plan.items.length, dateKey: plan.dateKey },
  });

  const first = plan.items[0];

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-3 py-8">
      <NeoBadge tone="cyan">Study plan</NeoBadge>
      <h1 className="text-3xl font-black text-neo-ink">Today&apos;s plan</h1>
      <p className="text-sm font-medium text-neo-muted">
        {plan.dateKey} · Built from reviews, weak spots, and your CEFR path.
      </p>

      {plan.items.length === 0 ? (
        <NeoCard tone="lime" hover={false}>
          <p className="font-black">You&apos;re clear for today</p>
          <p className="text-sm font-medium">
            No due reviews or open stages. Explore the dashboard for more.
          </p>
          <NeoLink href="/dashboard" className="mt-3 inline-block" tone="ink">Dashboard</NeoLink>
        </NeoCard>
      ) : (
        <>
          <ol className="space-y-3">
            {plan.items.map((it, i) => (
              <li key={`${it.stageId}-${i}`}>
                <NeoCard
                  tone={
                    it.kind === "review"
                      ? "orange"
                      : it.kind === "weak"
                        ? "pink"
                        : "cyan"
                  }
                  className="flex flex-wrap items-center justify-between gap-3"
                >
                  <div>
                    <p className="text-xs font-black uppercase opacity-70">
                      {i + 1}. {it.kind} · {it.cefrLevel} · {it.language}
                    </p>
                    <p className="font-black">{it.title}</p>
                    <p className="text-sm font-bold">{it.expectedText}</p>
                    <p className="text-xs font-medium opacity-80">{it.reason}</p>
                  </div>
                  <NeoLink href={`/learn/${it.stageId}${it.kind === "review" || it.kind === "weak" ? "?review=1" : ""}`} tone="ink">Go</NeoLink>
                </NeoCard>
              </li>
            ))}
          </ol>
          {first && (
            <NeoLink href={`/learn/${first.stageId}${first.kind === "review" || first.kind === "weak" ? "?review=1" : ""}`} tone="pink" className="w-full sm:w-auto">
                Start today&apos;s plan
              </NeoLink>
          )}
        </>
      )}
    </div>
  );
}
