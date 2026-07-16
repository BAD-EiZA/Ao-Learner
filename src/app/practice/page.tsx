import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/user";
import { getDueReviews, getReviewQueueCount } from "@/lib/learning/srs";
import { getWeakSpots, getRecommendedList } from "@/lib/learning/adaptive";
import { getSmartPracticeQueue } from "@/lib/learning/smart-practice";
import { NeoBadge, NeoCard, NeoLink } from "@/components/ui/neo";

export const dynamic = "force-dynamic";

const Empty = ({ children }: { children: string }) => (
  <p className="rounded-xl bg-neo-white px-3 py-2 text-sm font-medium text-neo-muted">
    {children}
  </p>
);

export default async function PracticePage() {
  const user = await requireUser();
  if (!user) redirect("/api/auth/login?post_login_redirect_url=/practice");

  const [reviewCount, due, weak, rec, smart] = await Promise.all([
    getReviewQueueCount(user.id),
    getDueReviews(user.id, 8),
    getWeakSpots(user.id, 6),
    getRecommendedList(user.id, 1),
    getSmartPracticeQueue(user.id, 1),
  ]);
  const primary = smart[0] ?? rec[0];

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-3 py-8">
      <NeoBadge tone="warning">Practice hub</NeoBadge>
      <h1 className="text-3xl font-black text-neo-ink">Practice</h1>
      <p className="text-sm font-medium text-neo-muted">
        Focused practice. Reviews and shadowing cost no hearts.
      </p>

      <section className="space-y-2" aria-labelledby="for-you-heading">
        <h2 id="for-you-heading" className="text-lg font-black">For you</h2>
        {primary ? (
          <NeoCard tone="primary" className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase opacity-80">
                {"reason" in primary ? primary.reason : "Smart recommendation"}
              </p>
              <p className="text-xl font-black">{primary.title}</p>
              <p className="text-sm font-bold">{primary.expectedText}</p>
            </div>
            <NeoLink href={`/learn/${primary.stageId}?review=1`} tone="surface">
              Start practice
            </NeoLink>
          </NeoCard>
        ) : (
          <Empty>No recommendation yet. Complete a lesson to personalize practice.</Empty>
        )}
      </section>

      <details open className="space-y-2">
        <summary className="cursor-pointer text-lg font-black text-neo-ink">
          Due <span className="text-sm font-bold text-neo-muted">{reviewCount} reviews</span>
        </summary>
        {due.length === 0 ? (
          <Empty>Nothing due. Your review deck is clear.</Empty>
        ) : (
          <ul className="space-y-2">
            {due.map((d) => (
              <li key={d.stageId}>
                <NeoCard className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-black">{d.stage.title}</p>
                    <p className="text-sm font-bold">{d.stage.expectedText}</p>
                  </div>
                  <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                    <NeoLink href={`/learn/${d.stageId}?review=1`} tone="warning" className="w-full sm:w-auto">Review</NeoLink>
                    <NeoLink href={`/learn/${d.stageId}?shadow=1`} tone="info" className="w-full sm:w-auto">Shadow</NeoLink>
                  </div>
                </NeoCard>
              </li>
            ))}
          </ul>
        )}
      </details>

      <details className="space-y-2">
        <summary className="cursor-pointer text-lg font-black text-neo-ink">Weak spots</summary>
        {weak.length === 0 ? (
          <Empty>No weak spots yet. Keep learning to build insights.</Empty>
        ) : (
          <ul className="space-y-2">
            {weak.map((w) => (
              <li key={w.stageId}>
                <NeoCard
                  tone="danger"
                  className="flex flex-wrap items-center justify-between gap-2"
                >
                  <div>
                    <p className="font-black">{w.title}</p>
                    <p className="text-xs font-bold opacity-70">
                      avg {Math.round(w.avgScore)} · fails {w.failCount}
                    </p>
                  </div>
                  <NeoLink href={`/learn/${w.stageId}?review=1`} tone="surface">Drill</NeoLink>
                </NeoCard>
              </li>
            ))}
          </ul>
        )}
      </details>

      <details className="space-y-2">
        <summary className="cursor-pointer text-lg font-black text-neo-ink">Games</summary>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <NeoLink href="/match" tone="success" className="w-full">Match pairs</NeoLink>
          <NeoLink href="/gap" tone="danger" className="w-full">Speak the gap</NeoLink>
          <NeoLink href="/talk" tone="info" className="w-full">Talk with Ao</NeoLink>
          <NeoLink href="/plan" tone="surface" className="w-full">Study plan</NeoLink>
        </div>
      </details>
    </div>
  );
}
