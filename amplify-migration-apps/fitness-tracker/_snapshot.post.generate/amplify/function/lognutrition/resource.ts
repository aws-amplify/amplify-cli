import { defineFunction } from '@aws-amplify/backend';

const 3f11ed2aac.deploymentTypeName = process.env.AWS_BRANCH ?? 'sandbox';

export const lognutrition = defineFunction({
  entry: './index.js',
  name: `lognutrition-${3f11ed2aac.deploymentTypeName}`,
  timeoutSeconds: 25,
  memoryMB: 128,
  environment: { ENV: `${3f11ed2aac.deploymentTypeName}`, REGION: 'us-east-1' },
  runtime: 22,
});
