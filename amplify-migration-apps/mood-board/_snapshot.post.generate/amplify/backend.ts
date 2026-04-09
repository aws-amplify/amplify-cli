import { auth } from './auth/resource';
import { data } from './data/resource';
import { storage } from './storage/resource';
import { moodboardGetRandomEmoji } from './function/moodboardGetRandomEmoji/resource';
import { moodboardKinesisReader } from './function/moodboardKinesisReader/resource';
import { readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { defineBackend } from '@aws-amplify/backend';
import { defineAnalytics } from './analytics/resource';
import { Duration, aws_iam } from 'aws-cdk-lib';
import * as assets from 'aws-cdk-lib/aws-s3-assets';

const backend = defineBackend({
  auth,
  data,
  storage,
  moodboardGetRandomEmoji,
  moodboardKinesisReader,
});
const analytics = defineAnalytics(backend);
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
const __dirname = dirname(fileURLToPath(import.meta.url));
const resolversDir = join(__dirname, 'data/resolvers');
const resolverFiles = readdirSync(resolversDir).filter(
  (f) => f.endsWith('.req.vtl') || f.endsWith('.res.vtl')
);
for (const file of resolverFiles) {
  const parts = file.replace('.req.vtl', '').replace('.res.vtl', '').split('.');
  const [typeName, fieldName] = parts;
  const isRequest = file.endsWith('.req.vtl');
  const functionId = `${typeName}${
    fieldName.charAt(0).toUpperCase() + fieldName.slice(1)
  }DataResolverFn`;
  const pipelineFunction =
    backend.data.resources.cfnResources.cfnFunctionConfigurations[functionId];
  if (pipelineFunction) {
    const templatePath = join(resolversDir, file);
    const vtlTemplate = new assets.Asset(backend.data, `VTLTemplate-${file}`, {
      path: templatePath,
    });
    if (isRequest) {
      pipelineFunction.requestMappingTemplateS3Location =
        vtlTemplate.s3ObjectUrl;
    } else {
      pipelineFunction.responseMappingTemplateS3Location =
        vtlTemplate.s3ObjectUrl;
    }
  }
}
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
const s3Bucket = backend.storage.resources.cfnResources.cfnBucket;
// Use this bucket name post refactor
// s3Bucket.bucketName = 'moodboarda9dff0b544a64459b29954a5cab78ace5c190-main';
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
