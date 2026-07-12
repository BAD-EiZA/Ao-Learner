import { prisma } from "@/lib/db/prisma";
import type { Language } from "@/generated/prisma/client";

export async function addToWordBank(params: {
  userId: string;
  phrase: string;
  meaningId?: string;
  language: Language;
  stageId?: string;
}) {
  try {
    return await prisma.wordBankItem.create({
      data: {
        userId: params.userId,
        phrase: params.phrase,
        meaningId: params.meaningId ?? "",
        language: params.language,
        stageId: params.stageId,
      },
    });
  } catch {
    return null; // duplicate
  }
}

export async function listWordBank(userId: string) {
  return prisma.wordBankItem.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export async function removeWordBank(userId: string, id: string) {
  await prisma.wordBankItem.deleteMany({ where: { id, userId } });
}

/** Auto-save passed phrases */
export async function maybeBankPassedPhrase(params: {
  userId: string;
  stageId: string;
  score: number;
  passed: boolean;
}) {
  if (!params.passed || params.score < 75) return;
  const stage = await prisma.stage.findUnique({
    where: { id: params.stageId },
  });
  if (!stage) return;
  await addToWordBank({
    userId: params.userId,
    phrase: stage.expectedText,
    meaningId: stage.meaningId,
    language: stage.language,
    stageId: stage.id,
  });
}
