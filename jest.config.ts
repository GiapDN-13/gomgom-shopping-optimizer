import type { Config } from "jest";
import nextJest from "next/jest.js";

const createJestConfig = nextJest({ dir: "./" });

const config: Config = {
  testEnvironment: "jest-environment-jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  collectCoverageFrom: [
    "app/api/**/*.ts",
    "lib/**/*.ts",
    "!**/*.d.ts",
  ],
  // NFR-32: >= 70% line coverage on API handlers and optimizer utilities.
  coverageThreshold: {
    global: { lines: 70 },
  },
};

export default createJestConfig(config);
