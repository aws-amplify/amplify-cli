import { defineFunction } from '@aws-amplify/backend';

const dc72c1d108.deploymentTypeName = process.env.AWS_BRANCH ?? 'sandbox';

export const quotegenerator = defineFunction({
  entry: './index.js',
  name: `quotegenerator-${dc72c1d108.deploymentTypeName}`,
  timeoutSeconds: 25,
  memoryMB: 128,
  environment: { ENV: `${dc72c1d108.deploymentTypeName}`, REGION: 'us-east-1' },
  runtime: 22,
});
