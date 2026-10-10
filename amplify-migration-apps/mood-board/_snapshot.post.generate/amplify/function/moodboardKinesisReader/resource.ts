import { defineFunction } from '@aws-amplify/backend';
import { aws_iam } from 'aws-cdk-lib';
import type { Backend } from '../../backend';
import type { MoodboardKinesis } from '../../analytics/moodboardkinesis-construct';

const branchName = process.env.AWS_BRANCH ?? 'sandbox';

export const moodboardKinesisReader = defineFunction({
  entry: './index.js',
  name: `moodboardKinesisReader-${branchName}`,
  timeoutSeconds: 25,
  memoryMB: 128,
  environment: { ENV: `${branchName}`, REGION: process.env.AWS_REGION ?? '' },
  runtime: 22,
});

export function applyEscapeHatches(
  backend: Backend,
  analytics: MoodboardKinesis
) {
  backend.moodboardKinesisReader.resources.cfnResources.cfnFunction.functionName = `moodboardKinesisReader-${branchName}`;
  backend.moodboardKinesisReader.addEnvironment(
    'ANALYTICS_MOODBOARDKINESIS_KINESISSTREAMARN',
    analytics.kinesisStreamArn
  );
  backend.moodboardKinesisReader.resources.lambda.addToRolePolicy(
    new aws_iam.PolicyStatement({
      actions: [
        'kinesis:ListShards',
        'kinesis:ListStreams',
        'kinesis:ListStreamConsumers',
        'kinesis:DescribeStream',
        'kinesis:DescribeStreamSummary',
        'kinesis:DescribeStreamConsumer',
        'kinesis:GetRecords',
        'kinesis:GetShardIterator',
        'kinesis:SubscribeToShard',
        'kinesis:DescribeLimits',
        'kinesis:ListTagsForStream',
      ],
      resources: [analytics.kinesisStreamArn],
    })
  );
}
