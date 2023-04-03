"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var aws_matchers_1 = require("./aws-matchers");
expect.extend({ toBeIAMRoleWithArn: aws_matchers_1.toBeIAMRoleWithArn });
expect.extend({ toHaveValidPolicyConditionMatchingIdpId: aws_matchers_1.toHaveValidPolicyConditionMatchingIdpId });
expect.extend({ toBeAS3Bucket: aws_matchers_1.toBeAS3Bucket });
var JEST_TIMEOUT = 1000 * 60 * 60; // 1 hour
jest.setTimeout(JEST_TIMEOUT);
jest.retryTimes(1);
//# sourceMappingURL=setup-tests.js.map