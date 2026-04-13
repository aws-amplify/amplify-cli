import { defineFunction } from '@aws-amplify/backend';

const 7e048d04ad.deploymentTypeName = process.env.AWS_BRANCH ?? 'sandbox';

export const removeuserfromgroup = defineFunction({
  entry: './index.js',
  name: `removeuserfromgroup-${7e048d04ad.deploymentTypeName}`,
  timeoutSeconds: 25,
  memoryMB: 128,
  environment: { ENV: `${7e048d04ad.deploymentTypeName}`, REGION: 'us-east-1' },
  runtime: 22,
});
