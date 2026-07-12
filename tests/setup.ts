/** Mock Prisma + heavy deps so pure unit tests don't load generated client */
jest.mock("@/lib/db/prisma", () => ({
  prisma: {
    userStats: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
      update: jest.fn(),
      upsert: jest.fn(),
      create: jest.fn(),
    },
    userProgress: {
      findUnique: jest.fn(),
      update: jest.fn(),
      upsert: jest.fn(),
      count: jest.fn().mockResolvedValue(0),
      findMany: jest.fn().mockResolvedValue([]),
    },
    stage: {
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn(),
    },
    analyticsEvent: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    userAchievement: {
      findUnique: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
      create: jest.fn(),
    },
    questProgress: {
      findUnique: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
      upsert: jest.fn(),
      update: jest.fn(),
    },
    checkpointRun: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
    wordBankItem: {
      create: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
      deleteMany: jest.fn(),
    },
    club: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    clubMember: {
      findUnique: jest.fn(),
      create: jest.fn(),
      deleteMany: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    attemptHistory: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    reviewItem: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    phonemeStat: {
      findMany: jest.fn().mockResolvedValue([]),
      upsert: jest.fn(),
    },
    user: {
      upsert: jest.fn(),
      findUnique: jest.fn(),
    },
  },
  dbConnectionString: () => "postgresql://test",
}));

jest.mock("@/lib/learning/srs", () => ({
  getDueReviews: jest.fn().mockResolvedValue([]),
  getReviewQueueCount: jest.fn().mockResolvedValue(0),
  upsertReviewFromAttempt: jest.fn(),
}));
