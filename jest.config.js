module.exports = {
  preset: 'ts-jest',
  bail: false,
  verbose: true,
  collectCoverage: true,
  testRunner: 'jest-circus/runner',
  projects: ['<rootDir>/packages/*'],
};
