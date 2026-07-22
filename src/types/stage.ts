export type CefrLevel = "A1" | "A2" | "B1" | "B2" | "C1";

export type StageTurn = {
  expectedText: string;
  meaningId: string;
  prompt?: string;
};

export type StageView = {
  id: string;
  title: string;
  description: string;
  expectedText: string;
  meaningId: string;
  referenceAudio: string;
  language:
    | "ENGLISH"
    | "GERMAN"
    | "FRENCH"
    | "SPANISH"
    | "ITALIAN"
    | "PORTUGUESE";
  order: number;
  cefrLevel: CefrLevel;
  mode?: "PHRASE" | "DIALOGUE" | "ROLEPLAY" | "STORY";
  turns?: StageTurn[] | null;
  unlocked: boolean;
  isCompleted: boolean;
  attemptsCount: number;
  attemptsLeft: number;
  bestScore: number | null;
  cooldownUntil: string | null;
  cooldownActive: boolean;
  crowns?: number;
  legendary?: boolean;
};
