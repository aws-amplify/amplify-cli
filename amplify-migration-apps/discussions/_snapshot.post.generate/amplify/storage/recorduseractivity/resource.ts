import { defineFunction } from '@aws-amplify/backend';

const branchName = process.env.AWS_BRANCH ?? 'sandbox';

export const recorduseractivity = defineFunction({
  entry: './index.js',
  name: `recorduseractivity-${branchName}`,
  timeoutSeconds: 25,
  memoryMB: 128,
  environment: { ENV: `${branchName}`, REGION: 'us-east-1' },
  runtime: 22,
});
