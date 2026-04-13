import { defineFunction } from '@aws-amplify/backend';

const 40f1c9f949.deploymentTypeName = process.env.AWS_BRANCH ?? 'sandbox';

export const S3Trigger1ef46783 = defineFunction({
  entry: './index.js',
  name: `S3Trigger1ef46783-${40f1c9f949.deploymentTypeName}`,
  timeoutSeconds: 25,
  memoryMB: 128,
  environment: { ENV: `${40f1c9f949.deploymentTypeName}`, REGION: 'us-east-1' },
  runtime: 22,
});
