import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/user";
import { getStagesWithProgress } from "@/lib/db/progress";
import { getUserStats } from "@/lib/db/streak";
import { getRecentAttempts } from "@/lib/db/history";
import { getDailyChallenge } from "@/lib/db/daily";
import { getReviewQueueCount } from "@/lib/learning/srs";
import { getRecommendedList, getWeakSpots } from "@/lib/learning/adaptive";
import {
  getLeaderboard,
  getMyLeaderboardFlag,
} from "@/lib/learning/leaderboard";
import { StageList } from "@/components/curriculum/StageList";
import { StreakCard } from "@/components/dashboard/StreakCard";
import {
  DailyChallengeCard,
  type DailyChallengeView,
} from "@/components/dashboard/DailyChallengeCard";
import {
  HistoryList,
  type HistoryItem,
} from "@/components/dashboard/HistoryList";
import { XpCard } from "@/components/dashboard/XpCard";
import { WeakSpotList } from "@/components/dashboard/WeakSpotList";
import { LeaderboardPanel } from "@/components/dashboard/LeaderboardPanel";
import { HeatmapCard } from "@/components/dashboard/HeatmapCard";
import { AoMoodBanner } from "@/components/dashboard/AoMoodBanner";
import { HeartsCard } from "@/components/dashboard/HeartsCard";
import { DailyGoalCard } from "@/components/dashboard/DailyGoalCard";
import {
  QuestsCard,
  type QuestView,
} from "@/components/dashboard/QuestsCard";
import { LeagueCard } from "@/components/dashboard/LeagueCard";
import { SuperTrialBanner } from "@/components/dashboard/SuperTrialBanner";
import { ComebackBanner } from "@/components/dashboard/ComebackBanner";
import { getSkillHeatmap } from "@/lib/learning/phonemes";
import { refreshAoMood, type AoMood } from "@/lib/learning/mood";
import { getHeartsState } from "@/lib/learning/hearts";
import { getDailyGoalState } from "@/lib/learning/goals";
import { getDailyQuests } from "@/lib/learning/quests";
import type { StageView } from "@/types/stage";
import { NeoBadge, NeoLink } from "@/components/ui/neo";
import { ErrorState } from "@/components/ui/EmptyState";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireUser();
  if (!user) redirect("/api/auth/login?post_login_redirect_url=/dashboard");

  let english: StageView[] = [];
  let german: StageView[] = [];
  let french: StageView[] = [];
  let dbError: string | null = null;
  let stats = await getUserStats(user.id).catch(() => ({
    currentStreak: 0,
    longestStreak: 0,
    totalAttempts: 0,
    totalPassed: 0,
    lastActiveDate: null as string | null,
    xp: 0,
    level: 1,
    placementDone: false,
    placementCefr: null as string | null,
    passBoost: 0,
    leaderboardOptIn: false,
    hearts: 5,
    dailyXpGoal: 20,
    dailyXpEarned: 0,
    streakFreezes: 1,
    combo: 0,
    learningWhy: null as string | null,
    isPlus: false,
    plusUntil: null as string | null,
    leagueTier: "bronze",
    weekXp: 0,
    aoMood: "neutral",
  }));
  let daily: DailyChallengeView | null = null;
  let history: HistoryItem[] = [];
  let recommended: Awaited<ReturnType<typeof getRecommendedList>> = [];
  let weak: Awaited<ReturnType<typeof getWeakSpots>> = [];
  let reviewCount = 0;
  let leaderboardRows: Awaited<ReturnType<typeof getLeaderboard>> = [];
  let leaderboardOptIn = false;
  let heat: Awaited<ReturnType<typeof getSkillHeatmap>> = [];
  let aoMood: AoMood = "neutral";
  let heartsState = {
    hearts: 5,
    max: 5,
    isPlus: false,
    nextHeartAt: null as string | null,
  };
  let dailyGoal = { goal: 20, earned: 0, pct: 0, met: false };
  let quests: QuestView[] = [];

  try {
    english = (await getStagesWithProgress(
      user.id,
      "ENGLISH"
    )) as StageView[];
    german = (await getStagesWithProgress(user.id, "GERMAN")) as StageView[];
    french = (await getStagesWithProgress(user.id, "FRENCH")) as StageView[];
    stats = await getUserStats(user.id);
    daily = (await getDailyChallenge(user.id)) as DailyChallengeView | null;
    history = (await getRecentAttempts(user.id, 10)) as HistoryItem[];
    recommended = await getRecommendedList(user.id, 5);
    weak = await getWeakSpots(user.id, 6);
    reviewCount = await getReviewQueueCount(user.id);
    leaderboardOptIn = await getMyLeaderboardFlag(user.id);
    if (leaderboardOptIn) {
      leaderboardRows = await getLeaderboard(20);
    }
    heat = await getSkillHeatmap(user.id);
    aoMood = await refreshAoMood(user.id);
    heartsState = await getHeartsState(user.id);
    dailyGoal = await getDailyGoalState(user.id);
    quests = (await getDailyQuests(user.id)) as QuestView[];
  } catch (e) {
    dbError =
      e instanceof Error
        ? e.message
        : "Database unavailable. Set DATABASE_URL and run migrations.";
  }

  if (!dbError && !stats.placementDone) {
    redirect("/placement");
  }

  const recommendedStage = recommended[0];
  const fallbackStage = [...english, ...german, ...french].find(
    (stage) => stage.unlocked && !stage.isCompleted
  );
  const continueHref = recommendedStage
    ? `/learn/${recommendedStage.stageId}`
    : fallbackStage
      ? `/learn/${fallbackStage.id}`
      : "/path";
  const continueTitle =
    recommendedStage?.title ?? fallbackStage?.title ?? "Explore your path";

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-3 py-4 sm:space-y-8 sm:px-6 sm:py-10">
      <div className="space-y-3">
        <NeoBadge tone="danger">Dashboard</NeoBadge>
        <h1 className="text-3xl font-black tracking-tight text-neo-ink sm:text-4xl">
          Hi{user.name ? `, ${user.name.split(" ")[0]}` : ""}!
        </h1>
        <p className="max-w-xl text-sm font-medium text-neo-muted">
          Adaptive CEFR path · streak · reviews · smart daily. Placement:{" "}
          {stats.placementCefr ?? "A1"}
          {stats.passBoost > 0
            ? ` · difficulty +${stats.passBoost}`
            : ""}
        </p>
        <div className="space-y-2">
          <NeoLink
            href={continueHref}
            tone="primary"
            className="w-full justify-between text-base sm:max-w-xl"
          >
            <span>Continue learning</span>
            <span className="normal-case tracking-normal">{continueTitle} →</span>
          </NeoLink>
          <div className="grid grid-cols-2 gap-2 sm:flex">
            <NeoLink href="/review" tone="warning" className="w-full sm:w-auto">
              Review{reviewCount ? ` · ${reviewCount}` : ""}
            </NeoLink>
            <NeoLink href="/practice" tone="info" className="w-full sm:w-auto">
              Practice
            </NeoLink>
          </div>
        </div>
      </div>

      {dbError ? (
        <ErrorState title="Setup required" body={dbError} />
      ) : (
        <>
          <AoMoodBanner mood={aoMood} />
          <ComebackBanner />
          <SuperTrialBanner />

          <div className="grid gap-4 sm:grid-cols-3">
            <StreakCard
              currentStreak={stats.currentStreak}
              longestStreak={stats.longestStreak}
              totalPassed={stats.totalPassed}
              totalAttempts={stats.totalAttempts}
            />
            <XpCard xp={stats.xp} level={stats.level} />
            <DailyGoalCard
              earned={dailyGoal.earned}
              goal={dailyGoal.goal}
              pct={dailyGoal.pct}
              met={dailyGoal.met}
            />
          </div>

          <details className="neo-border rounded-2xl bg-neo-white p-4">
            <summary className="cursor-pointer text-sm font-black uppercase tracking-wide">
              More progress and activities
            </summary>
            <div className="mt-4 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <HeartsCard
                  hearts={heartsState.hearts}
                  max={heartsState.max}
                  isPlus={heartsState.isPlus}
                  nextHeartAt={heartsState.nextHeartAt}
                />
                <LeagueCard
                  tier={stats.leagueTier ?? "bronze"}
                  weekXp={stats.weekXp ?? 0}
                />
                <QuestsCard initial={quests} />
                <DailyChallengeCard daily={daily} />
              </div>
              <HeatmapCard items={heat} />
              <WeakSpotList items={weak} />
              <StageList language="ENGLISH" stages={english} />
              <StageList language="GERMAN" stages={german} />
              <StageList language="FRENCH" stages={french} />
              <HistoryList items={history} />
              <LeaderboardPanel
                initialOptIn={leaderboardOptIn}
                initialRows={leaderboardRows}
              />
            </div>
          </details>
        </>
      )}
    </div>
  );
}
