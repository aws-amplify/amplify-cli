import { toBeIAMRoleWithArn, toHaveValidPolicyConditionMatchingIdpId, toBeAS3Bucket } from './aws-matchers';

const removeYarnPaths = () => {
  process.env.PATH = process.env.PATH.split(':')
    .filter((p) => !p.includes('/tmp/xfs-') && !p.includes('\\Temp\\xfs-'))
    .join(':');
};

removeYarnPaths();

expect.extend({ toBeIAMRoleWithArn });
expect.extend({ toHaveValidPolicyConditionMatchingIdpId });
expect.extend({ toBeAS3Bucket });

process.env.YARN_ENABLE_INLINE_BUILDS = undefined;

const JEST_TIMEOUT = 1000 * 60 * 60; // 1 hour
jest.setTimeout(JEST_TIMEOUT);
if (process.env.CIRCLECI) {
  jest.retryTimes(1);
}
