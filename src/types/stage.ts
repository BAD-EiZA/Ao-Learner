export type StageView = {
  id: string;
  title: string;
  description: string;
  expectedText: string;
  meaningId: string;
  referenceAudio: string;
  language: "ENGLISH" | "GERMAN";
  order: number;
  unlocked: boolean;
  isCompleted: boolean;
  attemptsCount: number;
  attemptsLeft: number;
  bestScore: number | null;
  cooldownUntil: string | null;
  cooldownActive: boolean;
};
