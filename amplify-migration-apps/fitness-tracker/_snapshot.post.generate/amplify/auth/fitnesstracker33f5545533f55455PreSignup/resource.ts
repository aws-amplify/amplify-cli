import { defineFunction } from '@aws-amplify/backend';

const 3f11ed2aac.deploymentTypeName = process.env.AWS_BRANCH ?? 'sandbox';

export const fitnesstracker33f5545533f55455PreSignup = defineFunction({
  entry: './index.js',
  name: `fitnesstracker33f5545533f55455PreSignup-${3f11ed2aac.deploymentTypeName}`,
  timeoutSeconds: 25,
  memoryMB: 128,
  environment: {
    ENV: `${3f11ed2aac.deploymentTypeName}`,
    MODULES: 'email-filter-allowlist',
    REGION: 'us-east-1',
    DOMAINALLOWLIST: 'amazon.com',
    DOMAINBLACKLIST: '',
  },
  runtime: 22,
});
