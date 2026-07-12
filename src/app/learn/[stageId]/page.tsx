import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/user";
import {
  clearExpiredCooldown,
  getStageForUser,
  getStageNeighbors,
} from "@/lib/db/progress";
import { LearnSession } from "@/components/learn/LearnSession";
import type { StageView } from "@/types/stage";
import { NeoButton, NeoCard } from "@/components/ui/neo";

export const dynamic = "force-dynamic";

export default async function LearnPage({
  params,
}: {
  params: Promise<{ stageId: string }>;
}) {
  const user = await requireUser();
  if (!user) redirect("/api/auth/login?post_login_redirect_url=/dashboard");

  const { stageId } = await params;
  await clearExpiredCooldown(user.id, stageId);
  const stage = await getStageForUser(user.id, stageId);
  if (!stage) notFound();

  const neighbors = await getStageNeighbors(user.id, stageId);

  if (!stage.unlocked) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <NeoCard tone="orange" hover={false} className="space-y-3">
          <h1 className="text-2xl font-black uppercase">Stage locked</h1>
          <p className="text-sm font-medium">
            Complete the previous stage first.
          </p>
          <Link href="/dashboard">
            <NeoButton tone="ink" className="w-full">
              Back to dashboard
            </NeoButton>
          </Link>
        </NeoCard>
      </div>
    );
  }

  return (
    <div>
      <div className="mx-auto max-w-6xl px-3 pt-4 sm:px-6">
        <Link
          href="/dashboard"
          className="neo-border neo-shadow-sm neo-press inline-flex rounded-xl bg-neo-white px-3 py-1.5 text-xs font-black uppercase text-neo-ink"
        >
          ← Dashboard
        </Link>
      </div>
      <LearnSession
        stage={stage as StageView}
        prevStageId={neighbors.prevId}
        nextStageId={neighbors.nextId}
      />
    </div>
  );
}
