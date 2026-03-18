import { defineFunction } from '@aws-amplify/backend';

const branchName = process.env.AWS_BRANCH ?? 'sandbox';

export const fitnesstracker969d5a9e969d5a9ePreSignup = defineFunction({
  entry: './index.js',
  name: `fitnesstracker969d5a9e969d5a9ePreSignup-${branchName}`,
  timeoutSeconds: 25,
  memoryMB: 128,
  environment: {
    MODULES: 'email-filter-allowlist',
    DOMAINALLOWLIST: 'amazon.com',
    DOMAINBLACKLIST: '',
    ENV: `${branchName}`,
    REGION: 'us-east-1',
  },
  runtime: 22,
});
