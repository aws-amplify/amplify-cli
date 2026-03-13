import { auth } from './auth/resource';
import { data } from './data/resource';
import { storage } from './storage/resource';
import { moodboardGetRandomEmoji } from './function/moodboardGetRandomEmoji/resource';
import { moodboardKinesisReader } from './function/moodboardKinesisReader/resource';
import { defineBackend } from '@aws-amplify/backend';
import { defineAnalytics } from './analytics/resource';
import { aws_iam } from 'aws-cdk-lib';
import { Duration } from 'aws-cdk-lib';

const backend = defineBackend({
  auth,
  data,
  storage,
  moodboardGetRandomEmoji,
  moodboardKinesisReader,
});
const analytics = defineAnalytics(backend);
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
const cfnUserPool = backend.auth.resources.cfnResources.cfnUserPool;
cfnUserPool.usernameAttributes = ['email'];
cfnUserPool.policies = {
  passwordPolicy: {
    minimumLength: 8,
    requireUppercase: false,
    requireLowercase: false,
    requireNumbers: false,
    requireSymbols: false,
    temporaryPasswordValidityDays: 7,
  },
};
const userPool = backend.auth.resources.userPool;
userPool.addClient('NativeAppClient', {
  refreshTokenValidity: Duration.days(30),
  enableTokenRevocation: true,
  enablePropagateAdditionalUserContextData: false,
  authSessionValidity: Duration.minutes(3),
  disableOAuth: true,
  generateSecret: false,
});
const s3Bucket = backend.storage.resources.cfnResources.cfnBucket;
// Use this bucket name post refactor
// s3Bucket.bucketName = 'moodboard20e29595008142e3ad16f01c4066e1c41959a-main';
s3Bucket.bucketEncryption = {
  serverSideEncryptionConfiguration: [
    {
      serverSideEncryptionByDefault: {
        sseAlgorithm: 'AES256',
      },
      bucketKeyEnabled: false,
    },
  ],
};
const cfnGraphqlApi = backend.data.resources.cfnResources.cfnGraphqlApi;
cfnGraphqlApi.additionalAuthenticationProviders = [
  {
    authenticationType: 'AMAZON_COGNITO_USER_POOLS',
    userPoolConfig: {
      userPoolId: backend.auth.resources.userPool.userPoolId,
    },
  },
];
const branchName = process.env.AWS_BRANCH ?? 'sandbox';
backend.moodboardGetRandomEmoji.resources.cfnResources.cfnFunction.functionName = `moodboardGetRandomEmoji-${branchName}`;
backend.moodboardKinesisReader.resources.cfnResources.cfnFunction.functionName = `moodboardKinesisReader-${branchName}`;
backend.moodboardKinesisReader.addEnvironment(
  'ANALYTICS_MOODBOARDKINESIS_KINESISSTREAMARN',
  analytics.kinesisStreamArn
);
