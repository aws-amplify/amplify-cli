import type { Config } from 'jest';

const config: Config = {
  testMatch: ['<rootDir>/tests/**/*.test.ts'],
  modulePathIgnorePatterns: ['<rootDir>/_snapshot'],
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: {
        target: 'ES2022',
        module: 'CommonJS',
        moduleResolution: 'node',
        esModuleInterop: true,
        noEmit: true,
        strict: true,
        skipLibCheck: true,
        types: ['node', 'jest'],
      },
    }],
  },
  testTimeout: 30_000,
  maxWorkers: 1,
};

export default config;
