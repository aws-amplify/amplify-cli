import { auth } from './auth/resource';
import { data } from './data/resource';
import { storage } from './storage/resource';
import { moodboardGetRandomEmoji } from './function/moodboardGetRandomEmoji/resource';
import { moodboardKinesisReader } from './function/moodboardKinesisReader/resource';
import { moodboardKinesisTrigger } from './function/moodboardKinesisTrigger/resource';
import { KinesisEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import { StartingPosition } from 'aws-cdk-lib/aws-lambda';
import { Stream } from 'aws-cdk-lib/aws-kinesis';
import { defineBackend } from '@aws-amplify/backend';
import { defineAnalytics } from './analytics/resource';
import { CfnResource, Duration, aws_iam } from 'aws-cdk-lib';
import { CfnUserPool } from 'aws-cdk-lib/aws-cognito';
// import { Tags } from 'aws-cdk-lib';

const backend = defineBackend({
  auth,
  data,
  storage,
  moodboardGetRandomEmoji,
  moodboardKinesisReader,
  moodboardKinesisTrigger,
});
const analytics = defineAnalytics(backend);
(
  backend.auth.resources.userPool.node.defaultChild as CfnUserPool
).deletionProtection = 'ACTIVE';
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
const cfnGraphqlApi = backend.data.resources.cfnResources.cfnGraphqlApi;
cfnGraphqlApi.additionalAuthenticationProviders = [
  {
    authenticationType: 'AMAZON_COGNITO_USER_POOLS',
    userPoolConfig: {
      userPoolId: backend.auth.resources.userPool.userPoolId,
      awsRegion: backend.auth.stack.region,
    },
  },
];
const s3Bucket = backend.storage.resources.cfnResources.cfnBucket;
// Use this bucket name post refactor
// s3Bucket.bucketName = 'moodboard20e29595008142e3ad16f01c4066e1c4x-x';
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
const branchName = process.env.AWS_BRANCH ?? 'sandbox';
backend.moodboardGetRandomEmoji.resources.cfnResources.cfnFunction.functionName = `moodboardGetRandomEmoji-${branchName}`;
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
for (const cfnResource of backend.auth.stack.node
  .findAll()
  .filter(
    (c) =>
      CfnResource.isCfnResource(c) &&
      [
        'AWS::Cognito::UserPool',
        'AWS::Cognito::IdentityPool',
        'AWS::Cognito::UserPoolClient',
        'AWS::Cognito::IdentityPoolRoleAttachment',
        'AWS::Cognito::UserPoolDomain',
        'AWS::Cognito::UserPoolGroup',
      ].includes(c.cfnResourceType)
  )) {
  (cfnResource as CfnResource).addOverride('UpdateReplacePolicy', 'Retain');
  (cfnResource as CfnResource).addOverride('DeletionPolicy', 'Retain');
}
for (const cfnResource of backend.storage.stack.node
  .findAll()
  .filter(
    (c) =>
      CfnResource.isCfnResource(c) && c.cfnResourceType === 'AWS::S3::Bucket'
  )) {
  (cfnResource as CfnResource).addOverride('UpdateReplacePolicy', 'Retain');
  (cfnResource as CfnResource).addOverride('DeletionPolicy', 'Retain');
}
for (const cfnResource of analytics.node
  .findAll()
  .filter(
    (c) =>
      CfnResource.isCfnResource(c) &&
      c.cfnResourceType === 'AWS::Kinesis::Stream'
  )) {
  (cfnResource as CfnResource).addOverride('UpdateReplacePolicy', 'Retain');
  (cfnResource as CfnResource).addOverride('DeletionPolicy', 'Retain');
}

// Uncomment post refactor to force a redeployment
// Tags.of(backend.stack).add('gen2-migration/post-refactor', 'true');
