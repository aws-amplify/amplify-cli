// tslint:disable-next-line: no-magic-numbers
const JEST_TIMEOUT = 1000 * 60 * 60; // 1 hour

jest.setTimeout(JEST_TIMEOUT);
if (process.env.CIRCLECI) {
  jest.retryTimes(1);
}
