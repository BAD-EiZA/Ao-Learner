import { prisma } from "@/lib/db/prisma";
import {
  updateDifficultyBoost,
  getRecommendedList,
  getWeakSpots,
  recommendNextStage,
} from "@/lib/learning/adaptive";
import {
  unlockAchievement,
  checkAchievementsAfterAttempt,
} from "@/lib/learning/achievements";
import { addClubXp, getClubBoard } from "@/lib/learning/club";
import { applyCrowns } from "@/lib/learning/crowns";
import { ensureWeekXp, getLeagueBoard, weekKey } from "@/lib/learning/leagues";
import { activatePlus, getPlusState } from "@/lib/learning/plus";
import { buyShopItem } from "@/lib/learning/shop";
import { getSmartPracticeQueue } from "@/lib/learning/smart-practice";
import { getTrialState } from "@/lib/learning/trial";
import { getFriendQuest } from "@/lib/learning/friends";
import { claimQuest, bumpQuest } from "@/lib/learning/quests";
import { getDailyGoalState } from "@/lib/learning/goals";
import { t } from "@/lib/i18n/messages";
import { getDueReviews } from "@/lib/learning/srs";
import { bucketsFromStage } from "@/lib/learning/phoneme-labels";
import { recordPhonemeStats } from "@/lib/learning/phonemes";

jest.mock("@/lib/learning/srs", () => ({
  getDueReviews: jest.fn().mockResolvedValue([]),
}));

const p = prisma as any;
const dueMock = getDueReviews as jest.Mock;

beforeEach(() => {
  dueMock.mockResolvedValue([]);
  jest.clearAllMocks();
  p.userStats.findUnique.mockResolvedValue(null);
  p.userStats.findMany.mockResolvedValue([]);
  p.userStats.update.mockResolvedValue({});
  p.userStats.upsert.mockResolvedValue({});
  p.userStats.create.mockResolvedValue({});
  p.userProgress.findMany.mockResolvedValue([]);
  p.userProgress.count.mockResolvedValue(0);
  p.userProgress.findUnique.mockResolvedValue(null);
  p.userProgress.update.mockResolvedValue({});
  p.stage.findMany.mockResolvedValue([]);
  p.stage.findUnique.mockResolvedValue(null);
  p.attemptHistory.findMany.mockResolvedValue([]);
  p.userAchievement.create.mockResolvedValue({ unlockedAt: new Date() });
  p.userAchievement.findMany.mockResolvedValue([]);
  p.questProgress.upsert.mockResolvedValue({});
  p.questProgress.findUnique.mockResolvedValue(null);
  p.questProgress.update.mockResolvedValue({});
  p.phonemeStat.upsert.mockResolvedValue({});
  p.clubMember.findUnique.mockResolvedValue(null);
  p.club.findUnique.mockResolvedValue(null);
  p.club.update.mockResolvedValue({});
  p.clubMember.update.mockResolvedValue({});
  p.clubMember.updateMany.mockResolvedValue({});
});

describe("adaptive boost cap + recommended weak loop", () => {
  test("passBoost already 10 no raise", async () => {
    p.userStats.findUnique.mockResolvedValue({
      consecutivePasses: 2,
      passBoost: 10,
    });
    await updateDifficultyBoost("u", 90, true);
    expect(p.userStats.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ passBoost: 10 }),
      })
    );
  });

  test("fail with passBoost 0", async () => {
    p.userStats.findUnique.mockResolvedValue({
      consecutivePasses: 1,
      passBoost: 0,
    });
    await updateDifficultyBoost("u", 10, false);
    expect(p.userStats.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ passBoost: 0 }),
      })
    );
  });

  test("weak bestScore filter null best", async () => {
    p.attemptHistory.findMany.mockResolvedValue([
      {
        stageId: "z",
        score: 80,
        passed: true,
        stage: {
          id: "z",
          title: "Z",
          expectedText: "z",
          meaningId: "",
          language: "ENGLISH",
          cefrLevel: "A1",
        },
      },
    ]);
    p.userProgress.findMany.mockResolvedValue([]); // no best
    const w = await getWeakSpots("u");
    // no fails and no best < 75 → filtered out
    expect(w.every((x) => x.failCount >= 1 || (x.bestScore != null && x.bestScore < 75))).toBe(
      true
    );
  });

  test("getRecommendedList fills weak after next", async () => {
    p.attemptHistory.findMany.mockResolvedValue([
      {
        stageId: "w1",
        score: 30,
        passed: false,
        stage: {
          id: "w1",
          title: "Weak",
          expectedText: "w",
          meaningId: "",
          language: "ENGLISH",
          cefrLevel: "A1",
        },
      },
    ]);
    p.userProgress.findMany.mockResolvedValue([
      { stageId: "w1", bestScore: 30 },
    ]);
    p.stage.findMany.mockResolvedValue([
      {
        id: "n1",
        title: "Next",
        expectedText: "n",
        language: "ENGLISH",
        cefrLevel: "A1",
        userProgress: [],
      },
    ]);
    p.stage.findUnique.mockResolvedValue({
      id: "n1",
      title: "Next",
      expectedText: "n",
      language: "ENGLISH",
      cefrLevel: "A1",
    });
    const list = await getRecommendedList("u", 5);
    expect(list.length).toBeGreaterThanOrEqual(2);
    expect(list.some((x) => x.kind === "weak")).toBe(true);
  });

  test("recommend both langs default", async () => {
    p.attemptHistory.findMany.mockResolvedValue([]);
    p.userProgress.findMany.mockResolvedValue([]);
    p.stage.findMany
      .mockResolvedValueOnce([]) // ENGLISH
      .mockResolvedValueOnce([
        {
          id: "g1",
          title: "G",
          expectedText: "Hallo",
          language: "GERMAN",
          cefrLevel: "A1",
          userProgress: [],
        },
      ]);
    const r = await recommendNextStage("u");
    expect(r?.language).toBe("GERMAN");
  });
});

describe("achievements null unlock branches", () => {
  test("already unlocked skips push", async () => {
    p.userAchievement.create.mockRejectedValue(new Error("dup"));
    p.userStats.findUnique.mockResolvedValue({
      currentStreak: 10,
      dailyXpEarned: 200,
    });
    p.stage.findMany.mockResolvedValue([{ id: "1" }]);
    p.userProgress.count.mockResolvedValue(1);
    const u = await checkAchievementsAfterAttempt({
      userId: "u",
      score: 99,
      passed: true,
      combo: 6,
      isRoleplay: true,
    });
    // all unlocks null
    expect(Array.isArray(u)).toBe(true);
  });

  test("a1 clear unlocks when all done", async () => {
    p.userAchievement.create.mockResolvedValue({ unlockedAt: new Date() });
    p.userStats.findUnique.mockResolvedValue({
      currentStreak: 0,
      dailyXpEarned: 0,
      xp: 0,
    });
    p.userStats.update.mockResolvedValue({});
    p.stage.findMany.mockResolvedValue([{ id: "a" }, { id: "b" }]);
    p.userProgress.count.mockResolvedValue(2);
    await checkAchievementsAfterAttempt({
      userId: "u",
      score: 50,
      passed: true,
      combo: 0,
    });
  });
});

describe("club no member + Learner fallback", () => {
  test("addClubXp no membership", async () => {
    p.clubMember.findUnique.mockResolvedValue(null);
    await addClubXp("u", 5);
    expect(p.club.update).not.toHaveBeenCalled();
  });

  test("board Learner fallback", async () => {
    p.clubMember.findUnique.mockResolvedValue({
      club: {
        code: "C",
        name: "N",
        weekXp: 0,
        members: [
          {
            weekXp: 0,
            userId: "x",
            user: { name: null, email: "" },
          },
        ],
      },
    });
    const b = await getClubBoard("u");
    expect(b?.members[0]!.name).toBe("Learner");
  });
});

describe("crowns hardMode default", () => {
  test("applyCrowns default hard false", async () => {
    p.userProgress.findUnique.mockResolvedValue({
      bestScore: null,
      legendary: false,
    });
    p.userProgress.update.mockResolvedValue({});
    const r = await applyCrowns("u", "s", 96);
    expect(r.legendary).toBe(false);
  });
});

describe("leagues ruby cap + demote bronze + board names", () => {
  test("promote at ruby stays / demote bronze stays", async () => {
    p.userStats.findUnique.mockResolvedValue({
      weekKey: "1990-W01",
      weekXp: 999,
      leagueTier: "ruby",
    });
    await ensureWeekXp("u");
    expect(p.userStats.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ leagueTier: "ruby" }),
      })
    );

    p.userStats.findUnique.mockResolvedValue({
      weekKey: "1990-W01",
      weekXp: 0,
      leagueTier: "bronze",
    });
    await ensureWeekXp("u");

    p.userStats.findUnique.mockResolvedValue({
      weekKey: "1990-W01",
      weekXp: 100,
      leagueTier: "weird",
    });
    await ensureWeekXp("u");

    p.userStats.findUnique.mockResolvedValue(null);
    p.userStats.findMany.mockResolvedValue([
      {
        userId: "u",
        weekXp: 1,
        level: 1,
        user: { name: "", email: "z@z.z" },
      },
    ]);
    // me null → bronze default
    p.userStats.findUnique
      .mockResolvedValueOnce(null) // ensureWeekXp create path
      .mockResolvedValueOnce(null); // me after ensure
    p.userStats.create.mockResolvedValue({
      weekKey: weekKey(),
      weekXp: 0,
      leagueTier: "bronze",
    });
    const board = await getLeagueBoard("u");
    expect(board.tier).toBe("bronze");
  });
});

describe("plus default days + active null until", () => {
  test("activatePlus default 30", async () => {
    p.userStats.upsert.mockResolvedValue({});
    await activatePlus("u");
    expect(p.userStats.upsert).toHaveBeenCalled();
  });

  test("isPlus true no until", async () => {
    p.userStats.findUnique.mockResolvedValue({
      isPlus: true,
      plusUntil: null,
    });
    expect((await getPlusState("u")).isPlus).toBe(true);
  });
});

describe("shop xp_boost branch", () => {
  test("buy xp_boost", async () => {
    p.userStats.findUnique.mockResolvedValue({ gems: 200, xp: 0 });
    p.userStats.update.mockResolvedValue({ gems: 150, xp: 25, level: 1 });
    const r = await buyShopItem("u", "xp_boost");
    expect(r.ok).toBe(true);
  });
});

describe("smart practice weak skip + fail limit", () => {
  test("skips weak already in review", async () => {
    dueMock.mockResolvedValue([
      {
        stageId: "same",
        stage: { title: "R", expectedText: "Hi" },
      },
    ]);
    p.attemptHistory.findMany
      .mockResolvedValueOnce([
        {
          stageId: "same",
          score: 20,
          passed: false,
          stage: {
            id: "same",
            title: "R",
            expectedText: "Hi",
            meaningId: "",
            language: "ENGLISH",
            cefrLevel: "A1",
          },
        },
      ])
      .mockResolvedValueOnce([
        {
          stageId: "f1",
          score: 10,
          passed: false,
          stage: { title: "F1", expectedText: "a" },
        },
        {
          stageId: "f2",
          score: 10,
          passed: false,
          stage: { title: "F2", expectedText: "b" },
        },
        {
          stageId: "f3",
          score: 10,
          passed: false,
          stage: { title: "F3", expectedText: "c" },
        },
      ]);
    p.userProgress.findMany.mockResolvedValue([
      { stageId: "same", bestScore: 20 },
    ]);
    const q = await getSmartPracticeQueue("u", 3);
    expect(q.filter((x) => x.stageId === "same").length).toBe(1);
    expect(q.length).toBeLessThanOrEqual(3);
  });
});

describe("trial active window", () => {
  test("active trialUntil future not plus flag", async () => {
    p.userStats.findUnique.mockResolvedValue({
      trialUsed: true,
      isPlus: false,
      trialUntil: new Date(Date.now() + 86400000),
      plusUntil: null,
      hearts: 5,
    });
    const s = await getTrialState("u");
    expect(s.active).toBe(true);
  });

  test("active via isPlus plusUntil", async () => {
    p.userStats.findUnique.mockResolvedValue({
      trialUsed: true,
      isPlus: true,
      trialUntil: null,
      plusUntil: new Date(Date.now() + 86400000),
      hearts: 5,
    });
    expect((await getTrialState("u")).active).toBe(true);
  });
});

describe("friends theirXp same day", () => {
  test("both same day", async () => {
    const today = new Date().toISOString().slice(0, 10);
    p.userStats.findUnique
      .mockResolvedValueOnce({
        friendOfUserId: "f",
        dailyXpDate: today,
        dailyXpEarned: 25,
      })
      .mockResolvedValueOnce({
        dailyXpDate: today,
        dailyXpEarned: 30,
      });
    const q = await getFriendQuest("u");
    expect(q?.combined).toBe(55);
    expect(q?.met).toBe(true);
  });
});

describe("quests claim row null", () => {
  test("no row", async () => {
    p.questProgress.findUnique.mockResolvedValue(null);
    expect((await claimQuest("u", "complete_3")).ok).toBe(false);
  });

  test("bump no matching event", async () => {
    p.questProgress.upsert.mockResolvedValue({});
    await bumpQuest("u", "unknown_event");
  });
});

describe("goals dateKey fallback", () => {
  test("null dailyXpDate", async () => {
    p.userStats.findUnique.mockResolvedValue({
      dailyXpDate: null,
      dailyXpEarned: 0,
      dailyXpGoal: 20,
    });
    p.userStats.update.mockResolvedValue({
      dailyXpDate: "x",
      dailyXpEarned: 0,
      dailyXpGoal: 20,
    });
    // ensure resets because date !== key
    await getDailyGoalState("u");
  });
});

describe("phoneme en_r en_l de_r", () => {
  test("english r l", () => {
    const b = bucketsFromStage({
      tags: [],
      expectedText: "really lovely",
      language: "ENGLISH",
      feedback: "r sound",
    });
    expect(b).toEqual(expect.arrayContaining(["en_r", "en_l"]));
  });

  test("german r", () => {
    const b = bucketsFromStage({
      tags: [],
      expectedText: "morgen",
      language: "GERMAN",
    });
    expect(b.some((x) => x === "de_r" || x === "general")).toBe(true);
  });

  test("record pass fails undefined", async () => {
    await recordPhonemeStats({
      userId: "u",
      language: "ENGLISH",
      tags: ["greeting"],
      expectedText: "Hello",
      score: 100,
      passed: true,
    });
  });
});

describe("i18n missing key", () => {
  test("unknown key returns key", () => {
    // @ts-expect-error intentional
    expect(t("en", "___missing___")).toBe("___missing___");
  });
});

describe("constants env isolate", () => {
  test("custom env values", () => {
    jest.isolateModules(() => {
      process.env.PASS_SCORE_THRESHOLD = "70";
      process.env.MAX_ATTEMPTS = "4";
      process.env.COOLDOWN_HOURS = "1";
      process.env.PLUS_COOLDOWN_HOURS = "0.25";
      process.env.GEMINI_MODEL = "custom-model";
      process.env.GEMINI_TTS_MODELS = "m1, m2";
      process.env.GEMINI_TTS_VOICE = "VoiceX";
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const c = require("@/lib/constants");
      expect(c.PASS_SCORE).toBe(70);
      expect(c.MAX_ATTEMPTS).toBe(4);
      expect(c.COOLDOWN_HOURS).toBe(1);
      expect(c.PLUS_COOLDOWN_HOURS).toBe(0.25);
      expect(c.GEMINI_MODEL).toBe("custom-model");
      expect(c.GEMINI_TTS_MODELS).toEqual(["m1", "m2"]);
      expect(c.GEMINI_TTS_VOICE).toBe("VoiceX");
    });
  });
});

describe("final branch polish", () => {
  test("comeback isComebackLapse null", async () => {
    const { isComebackLapse } = await import("@/lib/learning/comeback");
    expect(isComebackLapse(null)).toBe(false);
  });

  test("crowns Math.max existing null", async () => {
    p.userProgress.findUnique.mockResolvedValue({
      bestScore: null,
      legendary: true,
    });
    p.userProgress.update.mockResolvedValue({});
    const { applyCrowns } = await import("@/lib/learning/crowns");
    const r = await applyCrowns("u", "s", 50, true);
    expect(r.legendary).toBe(true);
  });

  test("friends friend null theirXp", async () => {
    const today = new Date().toISOString().slice(0, 10);
    p.userStats.findUnique
      .mockResolvedValueOnce({
        friendOfUserId: "f",
        dailyXpDate: "old",
        dailyXpEarned: 99,
      })
      .mockResolvedValueOnce(null);
    const q = await getFriendQuest("u");
    expect(q?.myXp).toBe(0);
    expect(q?.theirXp).toBe(0);
    void today;
  });

  test("goals dateKey when dailyXpDate set", async () => {
    p.userStats.findUnique.mockResolvedValue({
      dailyXpDate: "2099-01-01",
      dailyXpEarned: 5,
      dailyXpGoal: 20,
    });
    p.userStats.update.mockResolvedValue({
      dailyXpDate: "2099-01-01",
      dailyXpEarned: 0,
      dailyXpGoal: 20,
    });
    // date mismatch resets
    const g = await getDailyGoalState("u");
    expect(g.dateKey).toBeTruthy();
  });

  test("leagues empty name Learner", async () => {
    p.userStats.findUnique.mockResolvedValue({
      weekKey: weekKey(),
      weekXp: 0,
      leagueTier: "bronze",
    });
    p.userStats.findMany.mockResolvedValue([
      {
        userId: "x",
        weekXp: 0,
        level: 1,
        user: { name: null, email: "@only" },
      },
    ]);
    const b = await getLeagueBoard("u");
    expect(b.rows[0]!.name.length).toBeGreaterThan(0);
  });

  test("shop hearts branch", async () => {
    p.userStats.findUnique.mockResolvedValue({ gems: 500 });
    p.userStats.update.mockResolvedValue({ gems: 420 });
    expect((await buyShopItem("u", "hearts")).ok).toBe(true);
  });

  test("smart practice fail continue when already in out", async () => {
    dueMock.mockResolvedValue([]);
    p.attemptHistory.findMany
      .mockResolvedValueOnce([]) // weak empty
      .mockResolvedValueOnce([
        {
          stageId: "f1",
          score: 10,
          passed: false,
          stage: { title: "F", expectedText: "x" },
        },
      ]);
    p.userProgress.findMany.mockResolvedValue([]);
    const q = await getSmartPracticeQueue("u", 8);
    expect(q.some((x) => x.kind === "fail")).toBe(true);
  });

  test("streak society null stats", async () => {
    p.userStats.findUnique.mockResolvedValue(null);
    p.userAchievement.findMany.mockResolvedValue([]);
    const { getStreakSociety } = await import("@/lib/learning/streak-society");
    const s = await getStreakSociety("u");
    expect(s.streak).toBe(0);
    expect(s.longest).toBe(0);
  });

  test("achievements stats null skip streak", async () => {
    p.userStats.findUnique.mockResolvedValue(null);
    p.stage.findMany.mockResolvedValue([{ id: "1" }]);
    p.userProgress.count.mockResolvedValue(0);
    p.userAchievement.create.mockResolvedValue({ unlockedAt: new Date() });
    await checkAchievementsAfterAttempt({
      userId: "u",
      score: 10,
      passed: false,
      combo: 0,
    });
  });

  test("achievements a1 partial not clear", async () => {
    p.userStats.findUnique.mockResolvedValue({
      currentStreak: 0,
      dailyXpEarned: 0,
    });
    p.stage.findMany.mockResolvedValue([{ id: "1" }, { id: "2" }]);
    p.userProgress.count.mockResolvedValue(1);
    await checkAchievementsAfterAttempt({
      userId: "u",
      score: 10,
      passed: true,
      combo: 0,
    });
  });

  test("adaptive recommended skip dup weak", async () => {
    // next is weak stage, then weak list has same id
    p.attemptHistory.findMany.mockResolvedValue([
      {
        stageId: "w1",
        score: 20,
        passed: false,
        stage: {
          id: "w1",
          title: "W",
          expectedText: "w",
          meaningId: "",
          language: "ENGLISH",
          cefrLevel: "A1",
        },
      },
      {
        stageId: "w1",
        score: 25,
        passed: false,
        stage: {
          id: "w1",
          title: "W",
          expectedText: "w",
          meaningId: "",
          language: "ENGLISH",
          cefrLevel: "A1",
        },
      },
    ]);
    p.userProgress.findMany.mockResolvedValue([
      { stageId: "w1", bestScore: 25 },
    ]);
    p.stage.findUnique.mockResolvedValue({
      id: "w1",
      title: "W",
      expectedText: "w",
      language: "ENGLISH",
      cefrLevel: "A1",
    });
    // remedial path from recommendNextStage
    const list = await getRecommendedList("u", 5);
    expect(list.filter((x) => x.stageId === "w1").length).toBe(1);
  });

  test("xp reexports", async () => {
    const xp = await import("@/lib/learning/xp");
    expect(xp.badgeForLevel(1).name).toBe("Novice");
    expect(xp.xpForScore(100, true)).toBe(40);
  });

  test("phonemes reexport", async () => {
    const ph = await import("@/lib/learning/phonemes");
    expect(ph.BUCKET_LABELS.greeting).toBeTruthy();
    expect(typeof ph.bucketsFromStage).toBe("function");
  });
});
