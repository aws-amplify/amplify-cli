import { defineFunction } from '@aws-amplify/backend';

const branchName = process.env.AWS_BRANCH ?? 'sandbox';

export const moodboardKinesisReader = defineFunction({
  entry: './index.js',
  name: `moodboardKinesisReader-${branchName}`,
  timeoutSeconds: 25,
  memoryMB: 128,
  environment: {
    ENV: `${branchName}`,
    REGION: 'us-east-1',
    ANALYTICS_MOODBOARDKINESIS_KINESISSTREAMARN:
      'arn:aws:kinesis:us-east-1:123456789012:stream/moodboardKinesis-main',
  },
  runtime: 22,
});
