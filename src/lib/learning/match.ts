import { prisma } from "@/lib/db/prisma";
import type { Language } from "@/generated/prisma/client";

export type MatchCard = {
  stageId: string;
  phrase: string;
  meaningId: string;
  language: Language;
};

/** Pick N phrase stages with meaningId for match game */
export async function getMatchDeck(
  language: Language,
  n = 6
): Promise<MatchCard[]> {
  const stages = await prisma.stage.findMany({
    where: {
      language,
      mode: "PHRASE",
      meaningId: { not: "" },
    },
    orderBy: { order: "asc" },
    take: 40,
  });
  // shuffle pick n
  const shuffled = [...stages].sort(() => Math.random() - 0.5).slice(0, n);
  return shuffled.map((s) => ({
    stageId: s.id,
    phrase: s.expectedText,
    meaningId: s.meaningId,
    language: s.language,
  }));
}
