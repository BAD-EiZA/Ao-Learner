/**
 * Exhaustive branch coverage push toward ≥98% on learning libs.
 */
import { prisma } from "@/lib/db/prisma";
import { getDueReviews } from "@/lib/learning/srs";
import {
  ensureFriendCode,
  linkFriend,
  getFriendQuest,
  claimFriendQuest,
} from "@/lib/learning/friends";
import {
  getCheckpointStatus,
  getCheckpointQuiz,
  submitCheckpoint,
} from "@/lib/learning/checkpoint";
import { getSmartPracticeQueue } from "@/lib/learning/smart-practice";
import {
  claimStreakMilestone,
  getStreakSociety,
} from "@/lib/learning/streak-society";
import { buyShopItem, claimPathChest } from "@/lib/learning/shop";
import {
  ensureWeekXp,
  addWeekXp,
  getLeagueBoard,
  weekKey,
} from "@/lib/learning/leagues";
import { createClub, joinClub, addClubXp, getClubBoard } from "@/lib/learning/club";
import {
  addToWordBank,
  listWordBank,
  removeWordBank,
  maybeBankPassedPhrase,
} from "@/lib/learning/bank";
import {
  getTrialState,
  startSuperTrial,
  shouldShowTrialBanner,
} from "@/lib/learning/trial";
import {
  claimComeback,
  getComebackState,
  markComebackPending,
} from "@/lib/learning/comeback";
import { activatePlus, getPlusState } from "@/lib/learning/plus";
import {
  ensureDailyXpBucket,
  setDailyXpGoal,
  getDailyGoalState,
} from "@/lib/learning/goals";
import {
  ensureDailyQuests,
  getDailyQuests,
  bumpQuest,
  claimQuest,
} from "@/lib/learning/quests";
import {
  unlockAchievement,
  getUserAchievements,
  checkAchievementsAfterAttempt,
} from "@/lib/learning/achievements";
import { getMatchDeck } from "@/lib/learning/match";
import { refillHeartsForPlus, consumeHeart, getHeartsState } from "@/lib/learning/hearts";
import {
  alignWordHeat,
  heatClass,
  tokenizePhrase,
} from "@/lib/learning/word-heat";
import {
  updateDifficultyBoost,
  getWeakSpots,
  recommendNextStage,
  getRecommendedList,
} from "@/lib/learning/adaptive";
import { t } from "@/lib/i18n/messages";
import { PASS_SCORE, GEMINI_TTS_MODELS, GEMINI_MODEL } from "@/lib/constants";
import { bucketsFromStage } from "@/lib/learning/phoneme-labels";
import { recordPhonemeStats } from "@/lib/learning/phonemes";
import { gemsForScore, spendGems, getGems, awardGems } from "@/lib/learning/gems";
import { applyCrowns } from "@/lib/learning/crowns";

jest.mock("@/lib/learning/srs", () => ({
  getDueReviews: jest.fn().mockResolvedValue([]),
}));

const p = prisma as unknown as jest.Mocked<typeof prisma>;
const dueMock = getDueReviews as jest.Mock;

beforeEach(() => {
  dueMock.mockResolvedValue([]);
  p.userStats.findUnique.mockReset();
  p.userStats.findFirst.mockReset();
  p.userStats.findMany.mockReset().mockResolvedValue([]);
  p.userStats.update.mockReset().mockResolvedValue({});
  p.userStats.upsert.mockReset().mockResolvedValue({});
  p.userStats.create.mockReset().mockResolvedValue({});
  p.userProgress.findMany.mockReset().mockResolvedValue([]);
  p.userProgress.count.mockReset().mockResolvedValue(0);
  p.userProgress.findUnique.mockReset();
  p.userProgress.update.mockReset().mockResolvedValue({});
  p.stage.findMany.mockReset().mockResolvedValue([]);
  p.stage.findUnique.mockReset();
  p.analyticsEvent.findFirst.mockReset().mockResolvedValue(null);
  p.analyticsEvent.create.mockReset().mockResolvedValue({});
  p.userAchievement.findUnique.mockReset().mockResolvedValue(null);
  p.userAchievement.findMany.mockReset().mockResolvedValue([]);
  p.userAchievement.create.mockReset().mockResolvedValue({ unlockedAt: new Date() });
  p.questProgress.findUnique.mockReset();
  p.questProgress.findMany.mockReset().mockResolvedValue([]);
  p.questProgress.upsert.mockReset().mockResolvedValue({});
  p.questProgress.update.mockReset().mockResolvedValue({});
  p.checkpointRun.findUnique.mockReset().mockResolvedValue(null);
  p.checkpointRun.upsert.mockReset().mockResolvedValue({});
  p.wordBankItem.create.mockReset().mockResolvedValue({ id: "w1" });
  p.wordBankItem.findMany.mockReset().mockResolvedValue([]);
  p.wordBankItem.deleteMany.mockReset().mockResolvedValue({});
  p.club.create.mockReset().mockResolvedValue({ id: "c1", code: "ABC" });
  p.club.findUnique.mockReset();
  p.club.update.mockReset().mockResolvedValue({});
  p.clubMember.findUnique.mockReset();
  p.clubMember.create.mockReset().mockResolvedValue({});
  p.clubMember.deleteMany.mockReset().mockResolvedValue({});
  p.clubMember.update.mockReset().mockResolvedValue({});
  p.clubMember.updateMany.mockReset().mockResolvedValue({});
  p.attemptHistory.findMany.mockReset().mockResolvedValue([]);
  p.phonemeStat.upsert.mockReset().mockResolvedValue({});
  p.phonemeStat.findMany.mockReset().mockResolvedValue([]);
});

describe("friends full", () => {
  test("ensureFriendCode generates when missing", async () => {
    p.userStats.findUnique.mockResolvedValue(null);
    p.userStats.upsert.mockResolvedValue({ friendCode: "XYZ123" });
    const c = await ensureFriendCode("u1");
    expect(c).toMatch(/^[A-Z0-9]+$/);
    expect(p.userStats.upsert).toHaveBeenCalled();
  });

  test("linkFriend not found / self / mutual", async () => {
    p.userStats.findFirst.mockResolvedValue(null);
    expect((await linkFriend("u1", "NOPE")).ok).toBe(false);

    p.userStats.findFirst.mockResolvedValue({
      userId: "u1",
      friendOfUserId: null,
    });
    expect((await linkFriend("u1", "SELF")).ok).toBe(false);

    p.userStats.findFirst.mockResolvedValue({
      userId: "u2",
      friendOfUserId: "u3",
    });
    p.userStats.update.mockResolvedValue({});
    const r = await linkFriend("u1", "ABC");
    expect(r.ok).toBe(true);
    // only one update when other already has friend
    expect(p.userStats.update).toHaveBeenCalledTimes(1);

    p.userStats.findFirst.mockResolvedValue({
      userId: "u2",
      friendOfUserId: null,
    });
    await linkFriend("u1", "ABC");
    expect(p.userStats.update).toHaveBeenCalledTimes(3); // 1 + 2
  });

  test("getFriendQuest null / xp days", async () => {
    p.userStats.findUnique.mockResolvedValue(null);
    expect(await getFriendQuest("u1")).toBeNull();

    const today = new Date().toISOString().slice(0, 10);
    p.userStats.findUnique
      .mockResolvedValueOnce({
        friendOfUserId: "u2",
        dailyXpDate: today,
        dailyXpEarned: 30,
      })
      .mockResolvedValueOnce({
        dailyXpDate: "1999-01-01",
        dailyXpEarned: 99,
      });
    const q = await getFriendQuest("u1");
    expect(q?.theirXp).toBe(0);
    expect(q?.myXp).toBe(30);
    expect(q?.met).toBe(false);
  });

  test("claimFriendQuest paths", async () => {
    p.userStats.findUnique.mockResolvedValue(null);
    expect((await claimFriendQuest("u1")).ok).toBe(false);

    const today = new Date().toISOString().slice(0, 10);
    p.userStats.findUnique
      .mockResolvedValueOnce({
        friendOfUserId: "u2",
        dailyXpDate: today,
        dailyXpEarned: 40,
      })
      .mockResolvedValueOnce({
        dailyXpDate: today,
        dailyXpEarned: 20,
      });
    p.analyticsEvent.findFirst.mockResolvedValue({ id: "x" });
    expect((await claimFriendQuest("u1")).ok).toBe(false);

    p.userStats.findUnique
      .mockResolvedValueOnce({
        friendOfUserId: "u2",
        dailyXpDate: today,
        dailyXpEarned: 40,
        xp: 0,
      })
      .mockResolvedValueOnce({
        dailyXpDate: today,
        dailyXpEarned: 20,
      })
      .mockResolvedValue({ xp: 0 });
    p.analyticsEvent.findFirst.mockResolvedValue(null);
    p.userStats.update.mockResolvedValue({ xp: 30, level: 1 });
    p.userStats.upsert.mockResolvedValue({ gems: 15 });
    expect((await claimFriendQuest("u1")).ok).toBe(true);
  });
});

describe("checkpoint status full", () => {
  test("builds units with done and run", async () => {
    const stages = Array.from({ length: 10 }, (_, i) => ({
      id: `s${i + 1}`,
      order: i + 1,
      userProgress: i < 5 ? [{ isCompleted: true }] : [],
    }));
    p.stage.findMany.mockResolvedValue(stages);
    p.checkpointRun.findUnique
      .mockResolvedValueOnce({ passed: true })
      .mockResolvedValueOnce(null)
      .mockResolvedValue(null);
    const units = await getCheckpointStatus("u1", "ENGLISH");
    expect(units.length).toBeGreaterThanOrEqual(2);
    expect(units[0]!.allDone).toBe(true);
    expect(units[0]!.checkpointPassed).toBe(true);
  });

  test("submit fail no rewards", async () => {
    p.checkpointRun.upsert.mockResolvedValue({});
    const r = await submitCheckpoint({
      userId: "u",
      language: "ENGLISH",
      unitKey: "u1",
      scores: [],
    });
    expect(r.passed).toBe(false);
    expect(r.avg).toBe(0);
  });

  test("quiz unit parse fallback", async () => {
    p.stage.findMany.mockResolvedValue([
      {
        id: "1",
        expectedText: "A",
        meaningId: "m",
        title: "t",
        referenceAudio: "/a",
      },
    ]);
    const q = await getCheckpointQuiz("u", "ENGLISH", "bad");
    expect(q).toHaveLength(1);
  });
});

describe("smart practice full queue", () => {
  test("reviews weak fails dedupe limit", async () => {
    dueMock.mockResolvedValue([
      {
        stageId: "r1",
        stage: { title: "R", expectedText: "Hi" },
      },
    ]);
    p.attemptHistory.findMany
      .mockResolvedValueOnce([
        {
          stageId: "w1",
          score: 40,
          passed: false,
          stage: {
            id: "w1",
            title: "W",
            expectedText: "X",
            meaningId: "",
            language: "ENGLISH",
            cefrLevel: "A1",
          },
        },
      ])
      .mockResolvedValueOnce([
        {
          stageId: "f1",
          score: 20,
          passed: false,
          stage: { title: "F", expectedText: "Y" },
        },
        {
          stageId: "r1",
          score: 10,
          passed: false,
          stage: { title: "dup", expectedText: "Z" },
        },
        {
          stageId: "f2",
          score: 15,
          passed: false,
          stage: { title: "F2", expectedText: "Q" },
        },
      ]);
    p.userProgress.findMany.mockResolvedValue([
      { stageId: "w1", bestScore: 40 },
    ]);
    const q = await getSmartPracticeQueue("u", 2);
    expect(q.length).toBeLessThanOrEqual(2);
    expect(q.some((x) => x.kind === "review")).toBe(true);
  });
});

describe("streak society get", () => {
  test("getStreakSociety maps claims", async () => {
    p.userStats.findUnique.mockResolvedValue({
      currentStreak: 7,
      longestStreak: 10,
    });
    p.userAchievement.findMany.mockResolvedValue([
      { code: "streak_3" },
      { code: "streak_7" },
    ]);
    const s = await getStreakSociety("u1");
    expect(s.streak).toBe(7);
    expect(s.milestones.find((m) => m.days === 7)?.claimed).toBe(true);
    expect(s.milestones.find((m) => m.days === 14)?.claimed).toBe(false);
  });

  test("claim already claimed", async () => {
    p.userStats.findUnique.mockResolvedValue({ currentStreak: 10 });
    p.userAchievement.findUnique.mockResolvedValue({ id: "x" });
    expect((await claimStreakMilestone("u", 7)).ok).toBe(false);
  });
});

describe("shop chest edges", () => {
  test("no stats / claimed / locked / order", async () => {
    p.userStats.findUnique.mockResolvedValue(null);
    expect((await claimPathChest("u", 0)).ok).toBe(false);

    p.userStats.findUnique.mockResolvedValue({ chestsClaimed: 2 });
    expect((await claimPathChest("u", 1)).ok).toBe(false);

    p.userStats.findUnique.mockResolvedValue({ chestsClaimed: 0 });
    p.userProgress.count.mockResolvedValue(3);
    expect((await claimPathChest("u", 0)).ok).toBe(false);

    p.userStats.findUnique.mockResolvedValue({ chestsClaimed: 0 });
    p.userProgress.count.mockResolvedValue(20);
    // index 1 but claimed 0 → order
    expect((await claimPathChest("u", 1)).ok).toBe(false);
  });

  test("buy no gems", async () => {
    p.userStats.findUnique.mockResolvedValue({ gems: 0 });
    expect((await buyShopItem("u", "freeze")).ok).toBe(false);
  });
});

describe("leagues full", () => {
  test("create / rollover promote demote board", async () => {
    p.userStats.findUnique.mockResolvedValue(null);
    p.userStats.create.mockResolvedValue({ weekKey: weekKey(), weekXp: 0 });
    await ensureWeekXp("u1");

    p.userStats.findUnique.mockResolvedValue({
      weekKey: "1999-W01",
      weekXp: 250,
      leagueTier: "bronze",
    });
    p.userStats.update.mockResolvedValue({});
    await ensureWeekXp("u1");
    expect(p.userStats.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ leagueTier: "silver" }),
      })
    );

    p.userStats.findUnique.mockResolvedValue({
      weekKey: "1999-W01",
      weekXp: 10,
      leagueTier: "silver",
    });
    await ensureWeekXp("u1");

    p.userStats.findUnique.mockResolvedValue({
      weekKey: weekKey(),
      weekXp: 5,
      leagueTier: "gold",
    });
    await ensureWeekXp("u1"); // same week

    p.userStats.findUnique.mockResolvedValue({
      weekKey: weekKey(),
      weekXp: 0,
      leagueTier: "bronze",
    });
    p.userStats.findMany.mockResolvedValue([
      {
        userId: "u1",
        weekXp: 10,
        level: 2,
        user: { name: null, email: "a@b.com" },
      },
      {
        userId: "u2",
        weekXp: 5,
        level: 1,
        user: { name: "Bob", email: "b@b.com" },
      },
    ]);
    const board = await getLeagueBoard("u1");
    expect(board.rows[0]!.name).toBe("a");
    expect(board.rows[0]!.isMe).toBe(true);

    await addWeekXp("u1", 3);
  });
});

describe("club week rollover", () => {
  test("addClubXp resets week", async () => {
    p.clubMember.findUnique.mockResolvedValue({ clubId: "c1" });
    p.club.findUnique.mockResolvedValue({
      id: "c1",
      weekKey: "1999-W01",
    });
    await addClubXp("u1", 10);
    expect(p.club.update).toHaveBeenCalled();
    expect(p.clubMember.updateMany).toHaveBeenCalled();
  });

  test("getClubBoard null / name fallback", async () => {
    p.clubMember.findUnique.mockResolvedValue(null);
    expect(await getClubBoard("u")).toBeNull();

    p.clubMember.findUnique.mockResolvedValue({
      club: {
        code: "C",
        name: "N",
        weekXp: 1,
        members: [
          {
            weekXp: 1,
            userId: "u",
            user: { name: null, email: "x@y.z" },
          },
        ],
      },
    });
    const b = await getClubBoard("u");
    expect(b?.members[0]!.name).toBe("x");
  });

  test("createClub empty name", async () => {
    p.club.create.mockResolvedValue({ code: "ZZ" });
    await createClub("u", "");
    expect(p.club.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ name: "Ao Club" }),
      })
    );
  });

  test("join not found", async () => {
    p.club.findUnique.mockResolvedValue(null);
    expect((await joinClub("u", "NO")).ok).toBe(false);
  });
});

describe("bank edges", () => {
  test("duplicate / remove / low score", async () => {
    p.wordBankItem.create.mockRejectedValue(new Error("dup"));
    expect(
      await addToWordBank({
        userId: "u",
        phrase: "Hi",
        language: "ENGLISH",
      })
    ).toBeNull();

    await removeWordBank("u", "id1");
    expect(p.wordBankItem.deleteMany).toHaveBeenCalled();

    await maybeBankPassedPhrase({
      userId: "u",
      stageId: "s",
      score: 50,
      passed: true,
    });
    await maybeBankPassedPhrase({
      userId: "u",
      stageId: "s",
      score: 90,
      passed: false,
    });
    p.stage.findUnique.mockResolvedValue(null);
    await maybeBankPassedPhrase({
      userId: "u",
      stageId: "s",
      score: 90,
      passed: true,
    });
  });
});

describe("trial full", () => {
  test("no stats / expired plus / used / plus", async () => {
    p.userStats.findUnique.mockResolvedValue(null);
    const empty = await getTrialState("u");
    expect(empty.eligible).toBe(true);

    p.userStats.findUnique.mockResolvedValue({
      trialUsed: false,
      isPlus: true,
      plusUntil: new Date(Date.now() - 1000),
      trialUntil: new Date(Date.now() - 1000),
      hearts: 0,
    });
    // isPlus true but expired trialUntil
    const st = await getTrialState("u");
    expect(st.isPlus).toBe(true);

    p.userStats.findUnique.mockResolvedValue(null);
    expect((await startSuperTrial("u")).ok).toBe(false);
    p.userStats.findUnique.mockResolvedValue({
      trialUsed: true,
      isPlus: false,
    });
    expect((await startSuperTrial("u")).ok).toBe(false);
    p.userStats.findUnique.mockResolvedValue({
      trialUsed: false,
      isPlus: true,
    });
    expect((await startSuperTrial("u")).ok).toBe(false);

    p.userStats.findUnique.mockResolvedValue({
      trialUsed: true,
      isPlus: false,
      hearts: 0,
    });
    expect(await shouldShowTrialBanner("u")).toBe(false);
  });
});

describe("comeback full", () => {
  test("pending eligible / claim paths / mark skip", async () => {
    p.userStats.findUnique.mockResolvedValue({
      lastActiveDate: new Date(),
    });
    p.analyticsEvent.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: "p" });
    const s = await getComebackState("u");
    expect(s.eligible).toBe(true);
    expect(s.active).toBe(true);

    p.userStats.findUnique.mockResolvedValue(null);
    p.analyticsEvent.findFirst.mockResolvedValue(null);
    expect((await claimComeback("u")).ok).toBe(false);

    p.userStats.findUnique.mockResolvedValue({ lastActiveDate: new Date() });
    p.analyticsEvent.findFirst
      .mockResolvedValueOnce({ id: "c" }) // claimed today
      .mockResolvedValueOnce(null);
    // getComebackState inside claim
    expect((await claimComeback("u")).ok).toBe(false);

    // not eligible no pending
    p.userStats.findUnique.mockResolvedValue({
      lastActiveDate: new Date(),
      xp: 0,
    });
    p.analyticsEvent.findFirst.mockResolvedValue(null);
    const r = await claimComeback("u");
    expect(r.ok).toBe(false);

    await markComebackPending("u", 1); // skip
    expect(p.analyticsEvent.create).not.toHaveBeenCalled();
  });
});

describe("plus expire", () => {
  test("expired plus clears", async () => {
    p.userStats.findUnique.mockResolvedValue({
      isPlus: true,
      plusUntil: new Date(Date.now() - 5000),
    });
    p.userStats.update.mockResolvedValue({});
    const s = await getPlusState("u");
    expect(s.isPlus).toBe(false);
    expect(p.userStats.update).toHaveBeenCalled();
  });

  test("null stats", async () => {
    p.userStats.findUnique.mockResolvedValue(null);
    expect((await getPlusState("u")).isPlus).toBe(false);
  });
});

describe("goals create bucket", () => {
  test("no stats create / same day / invalid goal", async () => {
    p.userStats.findUnique.mockResolvedValue(null);
    p.userStats.create.mockResolvedValue({
      dailyXpDate: "x",
      dailyXpEarned: 0,
      dailyXpGoal: 20,
    });
    await ensureDailyXpBucket("u");
    expect(p.userStats.create).toHaveBeenCalled();

    p.userStats.findUnique.mockResolvedValue({
      dailyXpDate: new Date().toISOString().slice(0, 10),
      dailyXpEarned: 3,
      dailyXpGoal: 20,
    });
    await ensureDailyXpBucket("u");

    p.userStats.upsert.mockResolvedValue({ dailyXpGoal: 20 });
    await setDailyXpGoal("u", 99);
    expect(p.userStats.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ dailyXpGoal: 20 }),
      })
    );

    p.userStats.findUnique.mockResolvedValue({
      dailyXpDate: new Date().toISOString().slice(0, 10),
      dailyXpEarned: 0,
      dailyXpGoal: 0,
    });
    p.userStats.update.mockResolvedValue({
      dailyXpDate: new Date().toISOString().slice(0, 10),
      dailyXpEarned: 0,
      dailyXpGoal: 0,
    });
    const g = await getDailyGoalState("u");
    expect(g.goal).toBe(20);
  });
});

describe("quests edges", () => {
  test("bump skip completed / claim unknown not done claimed", async () => {
    p.questProgress.upsert.mockResolvedValue({});
    p.questProgress.findUnique.mockResolvedValue({
      id: "1",
      progress: 3,
      target: 3,
      completed: true,
    });
    await bumpQuest("u", "stage_passed");
    expect(p.questProgress.update).not.toHaveBeenCalled();

    expect((await claimQuest("u", "nope")).ok).toBe(false);
    p.questProgress.findUnique.mockResolvedValue({
      completed: false,
      claimed: false,
    });
    expect((await claimQuest("u", "complete_3")).ok).toBe(false);
    p.questProgress.findUnique.mockResolvedValue({
      id: "1",
      completed: true,
      claimed: true,
    });
    expect((await claimQuest("u", "complete_3")).ok).toBe(false);

    p.questProgress.findMany.mockResolvedValue([
      {
        questCode: "complete_3",
        progress: 1,
        completed: false,
        claimed: false,
      },
    ]);
    const list = await getDailyQuests("u");
    expect(list[0]!.progress).toBe(1);
  });
});

describe("achievements get + shadow path", () => {
  test("getUserAchievements + check shadow not used", async () => {
    p.userAchievement.findMany.mockResolvedValue([
      { code: "first_perfect", unlockedAt: new Date() },
    ]);
    const list = await getUserAchievements("u");
    expect(list.find((a) => a.code === "first_perfect")?.unlocked).toBe(true);

    p.userStats.findUnique.mockResolvedValue({
      currentStreak: 0,
      dailyXpEarned: 0,
    });
    p.stage.findMany.mockResolvedValue([]);
    p.userAchievement.create.mockRejectedValue(new Error("x"));
    await checkAchievementsAfterAttempt({
      userId: "u",
      score: 50,
      passed: false,
      combo: 0,
      isShadow: true,
    });

    expect(await unlockAchievement("u", "no_such")).toBeNull();
  });
});

describe("match default n", () => {
  test("getMatchDeck default", async () => {
    p.stage.findMany.mockResolvedValue(
      Array.from({ length: 10 }, (_, i) => ({
        id: String(i),
        expectedText: `p${i}`,
        meaningId: `m${i}`,
        language: "ENGLISH",
      }))
    );
    const d = await getMatchDeck("ENGLISH");
    expect(d.length).toBeLessThanOrEqual(6);
  });
});

describe("hearts refill + nextHeartAt", () => {
  test("refill and next heart", async () => {
    p.userStats.update.mockResolvedValue({});
    await refillHeartsForPlus("u");
    expect(p.userStats.update).toHaveBeenCalled();

    p.userStats.findUnique.mockResolvedValue({
      hearts: 3,
      heartsUpdatedAt: new Date(),
      isPlus: false,
      plusUntil: null,
    });
    const s = await getHeartsState("u");
    expect(s.nextHeartAt).toBeTruthy();
  });
});

describe("word-heat remaining branches", () => {
  test("null wordScores / empty word / warm cold heatClass", () => {
    const h = alignWordHeat("Hello world", null, 40);
    expect(h).toHaveLength(2);
    expect(h[0]!.score).toBe(40);

    const h2 = alignWordHeat("A B", [{ word: "", score: 10 }, { score: 20 }]);
    expect(h2[0]!.score).toBe(10); // positional after empty key skip

    expect(heatClass(75)).toContain("yellow");
    expect(heatClass(55)).toContain("warning");
    expect(tokenizePhrase("  ")).toEqual([]);
  });
});

describe("adaptive remaining", () => {
  test("weak sort + recommended weak fill + next normal reason", async () => {
    p.attemptHistory.findMany.mockResolvedValue([
      {
        stageId: "a",
        score: 30,
        passed: false,
        stage: {
          id: "a",
          title: "A",
          expectedText: "a",
          meaningId: "",
          language: "ENGLISH",
          cefrLevel: "A1",
        },
      },
      {
        stageId: "b",
        score: 70,
        passed: true,
        stage: {
          id: "b",
          title: "B",
          expectedText: "b",
          meaningId: "",
          language: "ENGLISH",
          cefrLevel: "A1",
        },
      },
    ]);
    p.userProgress.findMany.mockResolvedValue([
      { stageId: "a", bestScore: 30 },
      { stageId: "b", bestScore: 70 },
    ]);
    const weak = await getWeakSpots("u", 5);
    expect(weak.length).toBeGreaterThan(0);

    // next without hot prev
    p.attemptHistory.findMany.mockResolvedValue([]);
    p.userProgress.findMany.mockResolvedValue([]);
    p.stage.findMany.mockResolvedValue([
      {
        id: "n",
        title: "Next",
        expectedText: "Go",
        language: "ENGLISH",
        cefrLevel: "A1",
        userProgress: [],
      },
    ]);
    const rec = await recommendNextStage("u", "ENGLISH");
    expect(rec?.reason).toMatch(/Continue/);

    // recommended list weak only when next null
    p.stage.findMany.mockResolvedValue([
      {
        id: "done",
        title: "D",
        expectedText: "d",
        language: "ENGLISH",
        cefrLevel: "A1",
        userProgress: [{ isCompleted: true, bestScore: 80 }],
      },
    ]);
    p.attemptHistory.findMany.mockResolvedValue([
      {
        stageId: "w",
        score: 40,
        passed: false,
        stage: {
          id: "w",
          title: "W",
          expectedText: "w",
          meaningId: "",
          language: "ENGLISH",
          cefrLevel: "A1",
        },
      },
    ]);
    p.userProgress.findMany.mockResolvedValue([
      { stageId: "w", bestScore: 40 },
    ]);
    p.stage.findUnique.mockResolvedValue(null);
    const list = await getRecommendedList("u", 3);
    expect(list.some((x) => x.kind === "weak" || x.kind === "review")).toBe(
      true
    );
  });

  test("boost no change pass mid", async () => {
    p.userStats.findUnique.mockResolvedValue({
      consecutivePasses: 0,
      passBoost: 0,
    });
    p.userStats.update.mockResolvedValue({});
    await updateDifficultyBoost("u", 80, true);
  });
});

describe("phoneme german + record pass", () => {
  test("de buckets and pass upsert", async () => {
    const b = bucketsFromStage({
      tags: [],
      expectedText: "nicht können für",
      language: "GERMAN",
      feedback: "umlaut",
    });
    expect(b.length).toBeGreaterThan(0);

    p.phonemeStat.upsert.mockResolvedValue({});
    await recordPhonemeStats({
      userId: "u",
      language: "GERMAN",
      tags: [],
      expectedText: "Guten Tag",
      score: 90,
      passed: true,
    });
  });
});

describe("gems spend null", () => {
  test("null stats spend", async () => {
    p.userStats.findUnique.mockResolvedValue(null);
    expect((await spendGems("u", 1)).ok).toBe(false);
    expect(await getGems("u")).toBe(0);
  });
});

describe("crowns apply no legendary", () => {
  test("normal pass", async () => {
    p.userProgress.findUnique.mockResolvedValue({
      bestScore: 70,
      legendary: false,
    });
    p.userProgress.update.mockResolvedValue({});
    const r = await applyCrowns("u", "s", 80, false);
    expect(r.legendary).toBe(false);
    expect(r.crowns).toBeGreaterThanOrEqual(2);
  });
});

describe("i18n fallback + constants env", () => {
  test("t fallback and models", () => {
    expect(t("en", "nav_learn")).toBeTruthy();
    expect(GEMINI_TTS_MODELS.length).toBeGreaterThan(0);
    expect(GEMINI_MODEL).toBeTruthy();
    expect(PASS_SCORE).toBeGreaterThan(0);
  });
});

describe("activatePlus", () => {
  test("calls upsert", async () => {
    p.userStats.upsert.mockResolvedValue({ isPlus: true });
    await activatePlus("u", 14);
    expect(p.userStats.upsert).toHaveBeenCalled();
  });
});

describe("listWordBank", () => {
  test("returns findMany", async () => {
    p.wordBankItem.findMany.mockResolvedValue([{ id: "1" }]);
    expect(await listWordBank("u")).toHaveLength(1);
  });
});

describe("ensureDailyQuests", () => {
  test("upserts all", async () => {
    p.questProgress.upsert.mockResolvedValue({});
    await ensureDailyQuests("u");
    expect(p.questProgress.upsert).toHaveBeenCalledTimes(3);
  });
});

describe("consumeHeart write", () => {
  test("ok path already covered lightly", async () => {
    p.userStats.findUnique.mockResolvedValue({
      hearts: 2,
      heartsUpdatedAt: new Date(),
      isPlus: false,
      plusUntil: null,
    });
    p.userStats.update.mockResolvedValue({ hearts: 1 });
    const r = await consumeHeart("u");
    expect(r.ok).toBe(true);
  });
});

describe("awardGems zero via gems", () => {
  test("already in gems", async () => {
    p.userStats.findUnique.mockResolvedValue({ gems: 9 });
    expect(await awardGems("u", -1)).toBe(9);
    expect(gemsForScore(99, false)).toBe(0);
  });
});
