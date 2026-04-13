import { defineFunction } from '@aws-amplify/backend';

const c0d444ea7b.deploymentTypeName = process.env.AWS_BRANCH ?? 'sandbox';

export const quotegeneratorbe = defineFunction({
  entry: './index.js',
  name: `quotegeneratorbe-${c0d444ea7b.deploymentTypeName}`,
  timeoutSeconds: 25,
  memoryMB: 128,
  environment: { ENV: `${c0d444ea7b.deploymentTypeName}`, REGION: 'us-east-1' },
  runtime: 22,
});
