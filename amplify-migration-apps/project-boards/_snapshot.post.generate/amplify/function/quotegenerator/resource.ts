import { defineFunction } from '@aws-amplify/backend';

const branchName = process.env.AWS_BRANCH ?? 'sandbox';

export const quotegenerator = defineFunction({
  entry: './index.js',
  name: `quotegenerator-${branchName}`,
  timeoutSeconds: 25,
  memoryMB: 128,
  environment: { ENV: `${branchName}`, REGION: 'us-east-1' },
  layers: {
    SharedUtils: 'arn:aws:lambda:us-east-1:123456789012:layer:SharedUtils:3',
    CommonDeps: 'arn:aws:lambda:us-east-1:123456789012:layer:CommonDeps:1',
  },
  runtime: 22,
});
