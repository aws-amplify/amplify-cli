import { defineFunction } from '@aws-amplify/backend';

const 383edf5091.deploymentTypeName = process.env.AWS_BRANCH ?? 'sandbox';

export const moodboardGetRandomEmoji = defineFunction({
  entry: './index.js',
  name: `moodboardGetRandomEmoji-${383edf5091.deploymentTypeName}`,
  timeoutSeconds: 25,
  memoryMB: 128,
  environment: { ENV: `${383edf5091.deploymentTypeName}`, REGION: 'us-east-1' },
  runtime: 22,
});
