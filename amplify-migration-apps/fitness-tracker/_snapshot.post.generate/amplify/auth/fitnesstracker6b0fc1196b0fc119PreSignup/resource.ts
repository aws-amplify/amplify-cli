import { defineFunction } from '@aws-amplify/backend';

const branchName = process.env.AWS_BRANCH ?? 'sandbox';

export const fitnesstracker6b0fc1196b0fc119PreSignup = defineFunction({
  entry: './index.js',
  name: `fitnesstracker6b0fc1196b0fc119PreSignup-${branchName}`,
  timeoutSeconds: 25,
  memoryMB: 128,
  environment: {
    ENV: `${branchName}`,
    MODULES: 'email-filter-allowlist',
    REGION: 'us-east-1',
    DOMAINALLOWLIST: 'amazon.com',
    DOMAINBLACKLIST: '',
  },
  runtime: 22,
});
