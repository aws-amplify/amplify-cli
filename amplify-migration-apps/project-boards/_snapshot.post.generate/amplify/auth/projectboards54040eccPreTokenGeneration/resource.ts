import { defineFunction } from '@aws-amplify/backend';

const branchName = process.env.AWS_BRANCH ?? 'sandbox';

export const projectboards54040eccPreTokenGeneration = defineFunction({
  entry: './index.js',
  name: `projectboards54040eccPreTokenGeneration-${branchName}`,
  timeoutSeconds: 25,
  memoryMB: 128,
  environment: {
    MODULES: 'alter-claims',
    ENV: `${branchName}`,
    REGION: 'us-east-1',
  },
  runtime: 22,
});
