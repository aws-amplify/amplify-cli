import { defineFunction } from '@aws-amplify/backend';

const da5e56ee3d.deploymentTypeName = process.env.AWS_BRANCH ?? 'sandbox';

export const fetchuseractivity = defineFunction({
  entry: './index.js',
  name: `fetchuseractivity-${da5e56ee3d.deploymentTypeName}`,
  timeoutSeconds: 25,
  memoryMB: 128,
  environment: { ENV: `${da5e56ee3d.deploymentTypeName}`, REGION: 'us-east-1' },
  runtime: 22,
});
