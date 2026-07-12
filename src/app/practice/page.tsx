import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/user";
import { getDueReviews, getReviewQueueCount } from "@/lib/learning/srs";
import { getWeakSpots, getRecommendedList } from "@/lib/learning/adaptive";
import { getSmartPracticeQueue } from "@/lib/learning/smart-practice";
import { NeoBadge, NeoButton, NeoCard } from "@/components/ui/neo";

export const dynamic = "force-dynamic";

export default async function PracticePage() {
  const user = await requireUser();
  if (!user) redirect("/api/auth/login?post_login_redirect_url=/practice");

  const reviewCount = await getReviewQueueCount(user.id);
  const due = await getDueReviews(user.id, 8);
  const weak = await getWeakSpots(user.id, 6);
  const rec = await getRecommendedList(user.id, 5);
  const smart = await getSmartPracticeQueue(user.id, 8);

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-3 py-8">
      <NeoBadge tone="orange">Practice hub</NeoBadge>
      <h1 className="text-3xl font-black text-neo-ink">Practice</h1>
      <p className="text-sm font-medium text-neo-muted">
        Reviews, weak spots, shadow — no heart cost on review/shadow.
      </p>

      <section className="space-y-2">
        <h2 className="font-black">Smart practice</h2>
        {smart.length === 0 ? (
          <p className="text-sm font-medium text-neo-muted">Queue empty.</p>
        ) : (
          <ul className="space-y-2">
            {smart.map((s) => (
              <li key={`${s.kind}-${s.stageId}`}>
                <NeoCard
                  tone={
                    s.kind === "fail"
                      ? "pink"
                      : s.kind === "weak"
                        ? "orange"
                        : "cyan"
                  }
                  className="flex justify-between gap-2"
                >
                  <div>
                    <p className="text-[10px] font-black uppercase opacity-70">
                      {s.reason}
                    </p>
                    <p className="font-black">{s.title}</p>
                    <p className="text-sm font-bold">{s.expectedText}</p>
                  </div>
                  <Link href={`/learn/${s.stageId}?review=1`}>
                    <NeoButton tone="ink">Go</NeoButton>
                  </Link>
                </NeoCard>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="grid gap-3 sm:grid-cols-2">
        <NeoCard tone="orange" hover={false}>
          <p className="text-xs font-black uppercase opacity-70">SRS reviews</p>
          <p className="text-2xl font-black">{reviewCount} due</p>
          <Link href="/review" className="mt-2 inline-block">
            <NeoButton tone="ink">Open deck</NeoButton>
          </Link>
        </NeoCard>
        <NeoCard tone="cyan" hover={false}>
          <p className="text-xs font-black uppercase opacity-70">Study plan</p>
          <p className="text-sm font-bold">Mixed path for today</p>
          <Link href="/plan" className="mt-2 inline-block">
            <NeoButton tone="ink">Open plan</NeoButton>
          </Link>
        </NeoCard>
        <NeoCard tone="lime" hover={false}>
          <p className="text-xs font-black uppercase opacity-70">Match pairs</p>
          <p className="text-sm font-bold">Phrase ↔ meaning warm-up</p>
          <Link href="/match" className="mt-2 inline-block">
            <NeoButton tone="ink">Play match</NeoButton>
          </Link>
        </NeoCard>
        <NeoCard tone="yellow" hover={false}>
          <p className="text-xs font-black uppercase opacity-70">Weekly report</p>
          <p className="text-sm font-bold">XP · weak spots · badges</p>
          <Link href="/report" className="mt-2 inline-block">
            <NeoButton tone="ink">Open report</NeoButton>
          </Link>
        </NeoCard>
        <NeoCard tone="pink" hover={false}>
          <p className="text-xs font-black uppercase opacity-70">Speak the gap</p>
          <Link href="/gap" className="mt-2 inline-block">
            <NeoButton tone="ink">Open</NeoButton>
          </Link>
        </NeoCard>
        <NeoCard tone="purple" hover={false}>
          <p className="text-xs font-black uppercase opacity-70">Talk with Ao</p>
          <Link href="/talk" className="mt-2 inline-block">
            <NeoButton tone="ink">Chat</NeoButton>
          </Link>
        </NeoCard>
      </div>

      <section className="space-y-2">
        <h2 className="font-black text-neo-ink">Due now</h2>
        {due.length === 0 ? (
          <NeoCard tone="lime" hover={false}>
            <p className="font-bold">Nothing due — nice.</p>
          </NeoCard>
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
                    <Link href={`/learn/${d.stageId}?review=1`} className="w-full sm:w-auto">
                      <NeoButton tone="orange" className="w-full sm:w-auto">
                        Review
                      </NeoButton>
                    </Link>
                    <Link href={`/learn/${d.stageId}?shadow=1`} className="w-full sm:w-auto">
                      <NeoButton tone="cyan" className="w-full sm:w-auto">
                        Shadow
                      </NeoButton>
                    </Link>
                  </div>
                </NeoCard>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-2">
        <h2 className="font-black text-neo-ink">Weak spots</h2>
        {weak.length === 0 ? (
          <p className="text-sm font-medium text-neo-muted">No data yet.</p>
        ) : (
          <ul className="space-y-2">
            {weak.map((w) => (
              <li key={w.stageId}>
                <NeoCard
                  tone="pink"
                  className="flex flex-wrap items-center justify-between gap-2"
                >
                  <div>
                    <p className="font-black">{w.title}</p>
                    <p className="text-xs font-bold opacity-70">
                      avg {Math.round(w.avgScore)} · fails {w.failCount}
                    </p>
                  </div>
                  <Link href={`/learn/${w.stageId}?review=1`}>
                    <NeoButton tone="ink">Drill</NeoButton>
                  </Link>
                </NeoCard>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-2">
        <h2 className="font-black text-neo-ink">Recommended</h2>
        <ul className="space-y-2">
          {rec.map((r) => (
            <li key={r.stageId}>
              <NeoCard
                tone="yellow"
                className="flex flex-wrap items-center justify-between gap-2"
              >
                <div>
                  <p className="font-black">{r.title}</p>
                  <p className="text-sm font-bold">{r.expectedText}</p>
                </div>
                <Link href={`/learn/${r.stageId}`}>
                  <NeoButton tone="ink">Go</NeoButton>
                </Link>
              </NeoCard>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
