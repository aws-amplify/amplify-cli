module.exports = {
  preset: 'ts-jest',
  verbose: false,
  testRunner: '@aws-amplify/amplify-e2e-core/runner',
  testEnvironment: '@aws-amplify/amplify-e2e-core/environment',
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        diagnostics: false,
      },
    ],
  },
  testEnvironmentOptions: {
    url: 'http://localhost',
  },
  testRegex: '(src/__tests__/.*|\\.(test|spec))\\.(ts|tsx|js)$',
  collectCoverage: false,
  collectCoverageFrom: ['src/**/*.ts', '!**/node_modules/**', '!src/__tests__/**', '!**/*.d.ts'],
  reporters: [
    'default',
    'jest-junit',
    [
      '@aws-amplify/amplify-e2e-core/reporter',
      {
        publicPath: './console-integration-reports',
        filename: 'index.html',
        expand: true,
      },
    ],
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  setupFilesAfterEnv: ['<rootDir>/src/setup-tests.ts'],
  moduleNameMapper: {
    '^uuid$': require.resolve('uuid'),
    '^yaml$': require.resolve('yaml'),
  },
};
