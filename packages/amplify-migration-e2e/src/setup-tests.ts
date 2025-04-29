const removeYarnPaths = () => {
  // Remove yarn's temporary PATH modifications as they affect the yarn version used by jest tests when building the lambda functions
  process.env.PATH = process.env.PATH.split(':')
    .filter((p) => !p.includes('/xfs-') && !p.includes('\\Temp\\xfs-'))
    .join(':');
};

removeYarnPaths();

const JEST_TIMEOUT = 1000 * 60 * 60; // 1 hour
jest.setTimeout(JEST_TIMEOUT);
if (process.env.CIRCLECI) {
  jest.retryTimes(1);
}

beforeEach(async () => {
  if (process.env.CLI_REGION) {
    console.log(`CLI_REGION set to: ${process.env.CLI_REGION}. Overwriting AWS_REGION and AWS_DEFAULT_REGION`);
    process.env.AWS_REGION = process.env.CLI_REGION;
    process.env.AWS_DEFAULT_REGION = process.env.CLI_REGION;
  } else {
    console.log('No CLI_REGION variable found');
  }
});
