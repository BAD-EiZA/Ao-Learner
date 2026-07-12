import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/user";
import { getDueReviews } from "@/lib/learning/srs";
import { NeoBadge, NeoButton, NeoCard } from "@/components/ui/neo";

export const dynamic = "force-dynamic";

export default async function ReviewPage() {
  const user = await requireUser();
  if (!user) redirect("/api/auth/login?post_login_redirect_url=/review");

  const items = await getDueReviews(user.id, 20);

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-3 py-8">
      <NeoBadge tone="orange">Spaced repetition</NeoBadge>
      <h1 className="text-3xl font-black text-neo-ink">Review deck</h1>
      <p className="text-sm font-medium text-neo-muted">
        Phrases due today based on your past scores. Short reps stick longer.
      </p>

      {items.length === 0 ? (
        <NeoCard tone="lime" hover={false}>
          <p className="font-black">All clear!</p>
          <p className="text-sm font-medium">No reviews due right now.</p>
          <Link href="/dashboard" className="mt-3 inline-block">
            <NeoButton tone="ink">Back to dashboard</NeoButton>
          </Link>
        </NeoCard>
      ) : (
        <ul className="space-y-3">
          {items.map((it) => (
            <li key={it.id}>
              <NeoCard tone="white" className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase opacity-70">
                    {it.stage.language} · {it.stage.cefrLevel}
                  </p>
                  <p className="font-black">{it.stage.title}</p>
                  <p className="text-sm font-bold">{it.stage.expectedText}</p>
                  {it.stage.meaningId ? (
                    <p className="text-xs opacity-80">= {it.stage.meaningId}</p>
                  ) : null}
                </div>
                <div className="flex flex-col gap-2">
                  <Link href={`/learn/${it.stageId}?review=1`}>
                    <NeoButton tone="orange">Review</NeoButton>
                  </Link>
                  <Link href={`/learn/${it.stageId}?shadow=1`}>
                    <NeoButton tone="cyan">Shadow</NeoButton>
                  </Link>
                </div>
              </NeoCard>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
