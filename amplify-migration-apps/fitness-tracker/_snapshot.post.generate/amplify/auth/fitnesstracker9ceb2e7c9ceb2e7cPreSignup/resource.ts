import { defineFunction } from '@aws-amplify/backend';

const branchName = process.env.AWS_BRANCH ?? 'sandbox';

export const fitnesstracker9ceb2e7c9ceb2e7cPreSignup = defineFunction({
  entry: './index.js',
  name: `fitnesstracker9ceb2e7c9ceb2e7cPreSignup-${branchName}`,
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
