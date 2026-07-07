/** @type {import('jest').Config} */
export default {
  testMatch: ['<rootDir>/tests/**/*.test.ts'],
  modulePathIgnorePatterns: ['<rootDir>/_snapshot', '<rootDir>/amplify'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  extensionsToTreatAsEsm: ['.ts'],
  transform: {
    '^.+\\.[tj]s$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: {
          target: 'ES2022',
          module: 'ES2022',
          moduleResolution: 'node',
          esModuleInterop: true,
          allowJs: true,
          noEmit: true,
          strict: true,
          skipLibCheck: true,
          types: ['node', 'jest'],
        },
      },
    ],
  },
  testTimeout: 30_000,
  setupFilesAfterEnv: ['<rootDir>/tests/jest.setup.ts'],
};
