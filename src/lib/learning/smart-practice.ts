import { getWeakSpots } from "@/lib/learning/adaptive";
import { getDueReviews } from "@/lib/learning/srs";
import { prisma } from "@/lib/db/prisma";

export async function getSmartPracticeQueue(userId: string, limit = 8) {
  const out: {
    stageId: string;
    title: string;
    expectedText: string;
    reason: string;
    kind: "review" | "weak" | "fail";
  }[] = [];

  const due = await getDueReviews(userId, 4);
  for (const d of due) {
    out.push({
      stageId: d.stageId,
      title: d.stage.title,
      expectedText: d.stage.expectedText,
      reason: "SRS due",
      kind: "review",
    });
  }

  const weak = await getWeakSpots(userId, 4);
  for (const w of weak) {
    if (out.some((o) => o.stageId === w.stageId)) continue;
    out.push({
      stageId: w.stageId,
      title: w.title,
      expectedText: w.expectedText,
      reason: `Weak · avg ${Math.round(w.avgScore)}`,
      kind: "weak",
    });
  }

  // recent fails
  const fails = await prisma.attemptHistory.findMany({
    where: { userId, passed: false },
    orderBy: { createdAt: "desc" },
    take: 10,
    include: { stage: true },
  });
  for (const f of fails) {
    if (out.some((o) => o.stageId === f.stageId)) continue;
    out.push({
      stageId: f.stageId,
      title: f.stage.title,
      expectedText: f.stage.expectedText,
      reason: `Recent fail · ${f.score}`,
      kind: "fail",
    });
    if (out.length >= limit) break;
  }

  return out.slice(0, limit);
}
