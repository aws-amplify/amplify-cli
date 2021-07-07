module.exports = {
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.+(ts|tsx|js)', '**/?(*.)+(spec|test).+(ts|tsx|js)'],
  testPathIgnorePatterns: ['src/__tests__/'],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
};
