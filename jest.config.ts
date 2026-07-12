import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/tests"],
  testMatch: ["**/tests/unit/**/*.test.ts"],
  setupFilesAfterEnv: ["<rootDir>/tests/setup.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  clearMocks: true,
  collectCoverageFrom: [
    "src/lib/learning/word-heat.ts",
    "src/lib/learning/crowns.ts",
    "src/lib/learning/gems.ts",
    "src/lib/learning/xp.ts",
    "src/lib/learning/xp-math.ts",
    "src/lib/learning/hearts.ts",
    "src/lib/learning/leagues.ts",
    "src/lib/learning/streak-society.ts",
    "src/lib/learning/comeback.ts",
    "src/lib/learning/checkpoint.ts",
    "src/lib/learning/shop.ts",
    "src/lib/learning/goals.ts",
    "src/lib/learning/quests.ts",
    "src/lib/learning/achievements.ts",
    "src/lib/learning/plus.ts",
    "src/lib/learning/adaptive.ts",
    "src/lib/learning/phonemes.ts",
    "src/lib/learning/phoneme-labels.ts",
    "src/lib/learning/bank.ts",
    "src/lib/learning/friends.ts",
    "src/lib/learning/club.ts",
    "src/lib/learning/trial.ts",
    "src/lib/learning/smart-practice.ts",
    "src/lib/learning/match.ts",
    "src/lib/learning/report.ts",
    "src/lib/constants.ts",
    "src/lib/i18n/messages.ts",
  ],
  coveragePathIgnorePatterns: ["/node_modules/"],
  // Pure logic suites aim high; async prisma paths covered via mocks in unit tests
  coverageThreshold: {
    global: {
      branches: 98,
      functions: 98,
      lines: 98,
      statements: 98,
    },
  },
};

export default config;
