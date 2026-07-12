import { prisma } from "@/lib/db/prisma";
import { getDueReviews } from "@/lib/learning/srs";
import { getWeakSpots } from "@/lib/learning/adaptive";
import { todayKey } from "@/lib/db/streak";

export type PlanItem = {
  kind: "review" | "weak" | "new" | "daily";
  stageId: string;
  title: string;
  expectedText: string;
  language: string;
  cefrLevel: string;
  reason: string;
};

/** Build today's bite-sized plan (max ~5 items) */
export async function buildStudyPlan(userId: string): Promise<{
  dateKey: string;
  items: PlanItem[];
}> {
  const dateKey = todayKey();
  const items: PlanItem[] = [];

  const due = await getDueReviews(userId, 3);
  for (const d of due) {
    items.push({
      kind: "review",
      stageId: d.stageId,
      title: d.stage.title,
      expectedText: d.stage.expectedText,
      language: d.stage.language,
      cefrLevel: d.stage.cefrLevel,
      reason: "Due for spaced review",
    });
  }

  const weak = await getWeakSpots(userId, 2);
  for (const w of weak) {
    if (items.some((i) => i.stageId === w.stageId)) continue;
    items.push({
      kind: "weak",
      stageId: w.stageId,
      title: w.title,
      expectedText: w.expectedText,
      language: w.language,
      cefrLevel: w.cefrLevel,
      reason: `Weak spot · avg ${w.avgScore}`,
    });
  }

  // one new unlocked incomplete stage
  const stages = await prisma.stage.findMany({
    where: { mode: { in: ["PHRASE", "DIALOGUE"] } },
    orderBy: [{ language: "asc" }, { order: "asc" }],
    include: { userProgress: { where: { userId }, take: 1 } },
  });

  let prevDone = true;
  for (const s of stages) {
    const done = s.userProgress[0]?.isCompleted ?? false;
    const unlocked = prevDone;
    if (unlocked && !done && !items.some((i) => i.stageId === s.id)) {
      items.push({
        kind: "new",
        stageId: s.id,
        title: s.title,
        expectedText: s.expectedText,
        language: s.language,
        cefrLevel: s.cefrLevel,
        reason: "New stage on your path",
      });
      break;
    }
    prevDone = done;
  }

  return { dateKey, items: items.slice(0, 5) };
}
