import { redirect, notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/user";
import {
  clearExpiredCooldown,
  getStageForUser,
  getStageNeighbors,
} from "@/lib/db/progress";
import { getDailyChallenge } from "@/lib/db/daily";
import { getAdaptivePassThreshold } from "@/lib/learning/adaptive";
import { LearnSession } from "@/components/learn/LearnSession";
import type { StageView } from "@/types/stage";
import { NeoCard, NeoLink } from "@/components/ui/neo";

export const dynamic = "force-dynamic";

export default async function LearnPage({
  params,
  searchParams,
}: {
  params: Promise<{ stageId: string }>;
  searchParams: Promise<{
    daily?: string;
    review?: string;
    shadow?: string;
  }>;
}) {
  const user = await requireUser();
  if (!user) redirect("/api/auth/login?post_login_redirect_url=/dashboard");

  const { stageId } = await params;
  const sp = await searchParams;
  const isDaily = sp.daily === "1";
  const isReview = sp.review === "1";
  const isShadow = sp.shadow === "1";

  await clearExpiredCooldown(user.id, stageId);
  const stage = await getStageForUser(user.id, stageId);
  if (!stage) notFound();

  if (isDaily) {
    const daily = await getDailyChallenge(user.id);
    if (!daily || daily.stage.id !== stageId) {
      redirect("/dashboard");
    }
  }

  const neighbors = await getStageNeighbors(user.id, stageId);
  const passThreshold = await getAdaptivePassThreshold(
    user.id,
    stage.cefrLevel
  );

  // review/shadow/daily can open locked stages
  if (!isDaily && !isReview && !isShadow && !stage.unlocked) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <NeoCard tone="orange" hover={false} className="space-y-3">
          <h1 className="text-2xl font-black uppercase">Stage locked</h1>
          <p className="text-sm font-medium">
            Complete the previous stage first — or try Review / Daily.
          </p>
          <NeoLink href="/dashboard" tone="ink" className="w-full">
            Back to dashboard
          </NeoLink>
        </NeoCard>
      </div>
    );
  }

  return (
    <div>
      <div className="mx-auto max-w-6xl px-3 pt-4 sm:px-6">
        <NeoLink
          href="/dashboard"
          tone="surface"
          className="px-3 py-1.5 text-xs"
        >
          ← Dashboard
        </NeoLink>
      </div>
      <LearnSession
        stage={stage as StageView}
        prevStageId={isDaily || isReview ? null : neighbors.prevId}
        nextStageId={isDaily || isReview ? null : neighbors.nextId}
        isDaily={isDaily}
        isReview={isReview}
        isShadow={isShadow}
        passThreshold={passThreshold}
      />
    </div>
  );
}
