import { toBeIAMRoleWithArn, toBeAS3Bucket } from './aws-matchers';

expect.extend({ toBeIAMRoleWithArn });
expect.extend({ toBeAS3Bucket });

// tslint:disable-next-line: no-magic-numbers
const JEST_TIMEOUT = 1000 * 60 * 60; // 1 hour

jest.setTimeout(JEST_TIMEOUT);
