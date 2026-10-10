import { defineFunction } from '@aws-amplify/backend';
import { KinesisEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import { StartingPosition } from 'aws-cdk-lib/aws-lambda';
import { Stream } from 'aws-cdk-lib/aws-kinesis';
import type { Backend } from '../../backend';
import type { MoodboardKinesis } from '../../analytics/moodboardkinesis-construct';

const branchName = process.env.AWS_BRANCH ?? 'sandbox';

export const moodboardKinesisTrigger = defineFunction({
  entry: './index.js',
  name: `moodboardKinesisTrigger-${branchName}`,
  timeoutSeconds: 25,
  memoryMB: 128,
  environment: { ENV: `${branchName}`, REGION: process.env.AWS_REGION ?? '' },
  runtime: 22,
});

export function applyEscapeHatches(
  backend: Backend,
  analytics: MoodboardKinesis
) {
  backend.moodboardKinesisTrigger.resources.cfnResources.cfnFunction.functionName = `moodboardKinesisTrigger-${branchName}`;
  backend.moodboardKinesisTrigger.addEnvironment(
    'API_MOODBOARD_GRAPHQLAPIKEYOUTPUT',
    backend.data.apiKey!
  );
  backend.moodboardKinesisTrigger.addEnvironment(
    'API_MOODBOARD_GRAPHQLAPIENDPOINTOUTPUT',
    backend.data.graphqlUrl
  );
  backend.moodboardKinesisTrigger.addEnvironment(
    'API_MOODBOARD_GRAPHQLAPIIDOUTPUT',
    backend.data.apiId
  );
  backend.data.resources.graphqlApi.grantMutation(
    backend.moodboardKinesisTrigger.resources.lambda
  );
  const kinesisStream = Stream.fromStreamArn(
    backend.moodboardKinesisTrigger.resources.lambda.stack,
    'KinesisStream',
    analytics.kinesisStreamArn
  );
  backend.moodboardKinesisTrigger.resources.lambda.addEventSource(
    new KinesisEventSource(kinesisStream, {
      startingPosition: StartingPosition.LATEST,
    })
  );
}
