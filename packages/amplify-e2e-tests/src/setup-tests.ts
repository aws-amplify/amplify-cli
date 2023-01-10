import { toBeIAMRoleWithArn, toHaveValidPolicyConditionMatchingIdpId, toBeAS3Bucket } from './aws-matchers';

expect.extend({ toBeIAMRoleWithArn });
expect.extend({ toHaveValidPolicyConditionMatchingIdpId });
expect.extend({ toBeAS3Bucket });

const JEST_TIMEOUT = 1000 * 60 * 60; // 1 hour

jest.setTimeout(JEST_TIMEOUT);
