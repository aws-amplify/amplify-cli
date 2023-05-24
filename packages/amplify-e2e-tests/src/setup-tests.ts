import { toBeIAMRoleWithArn, toHaveValidPolicyConditionMatchingIdpId, toBeAS3Bucket } from './aws-matchers';

const removeYarnPaths = () => {
  // Remove yarn's temporary PATH modifications as they affect the yarn version used by jest tests when building the lambda functions
  process.env.PATH = process.env.PATH.split(':')
    .filter((p) => !p.includes('/tmp/xfs-') && !p.includes('\\Temp\\xfs-'))
    .join(':');
};

expect.extend({ toBeIAMRoleWithArn });
expect.extend({ toHaveValidPolicyConditionMatchingIdpId });
expect.extend({ toBeAS3Bucket });

removeYarnPaths();

const JEST_TIMEOUT = 1000 * 60 * 60; // 1 hour
jest.setTimeout(JEST_TIMEOUT);
if (process.env.CIRCLECI) {
  jest.retryTimes(1);
}
