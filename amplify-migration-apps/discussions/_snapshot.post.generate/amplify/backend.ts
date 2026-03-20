import { auth } from './auth/resource';
import { data } from './data/resource';
import { storage } from './storage/resource';
import { fetchuseractivity } from './storage/fetchuseractivity/resource';
import { recorduseractivity } from './storage/recorduseractivity/resource';
import { DynamoEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import { StartingPosition } from 'aws-cdk-lib/aws-lambda';
import {
  Table,
  AttributeType,
  BillingMode,
  StreamViewType,
} from 'aws-cdk-lib/aws-dynamodb';
import { defineBackend } from '@aws-amplify/backend';
import { Duration } from 'aws-cdk-lib';

const backend = defineBackend({
  auth,
  data,
  storage,
  fetchuseractivity,
  recorduseractivity,
});
const storageActivityStack = backend.createStack('storageactivity');
const activity = new Table(storageActivityStack, 'activity', {
  partitionKey: { name: 'id', type: AttributeType.STRING },
  billingMode: BillingMode.PROVISIONED,
  readCapacity: 5,
  writeCapacity: 5,
  stream: StreamViewType.NEW_IMAGE,
  sortKey: { name: 'userId', type: AttributeType.STRING },
});
// Add this property to the Table above post refactor: tableName: 'activity-maintwo'
activity.addGlobalSecondaryIndex({
  indexName: 'byUserId',
  partitionKey: { name: 'userId', type: AttributeType.STRING },
  sortKey: { name: 'timestamp', type: AttributeType.STRING },
  readCapacity: 5,
  writeCapacity: 5,
});
const storageBookmarksStack = backend.createStack('storagebookmarks');
const bookmarks = new Table(storageBookmarksStack, 'bookmarks', {
  partitionKey: { name: 'userId', type: AttributeType.STRING },
  billingMode: BillingMode.PROVISIONED,
  readCapacity: 5,
  writeCapacity: 5,
  stream: StreamViewType.NEW_IMAGE,
  sortKey: { name: 'postId', type: AttributeType.STRING },
});
// Add this property to the Table above post refactor: tableName: 'bookmarks-maintwo'
bookmarks.addGlobalSecondaryIndex({
  indexName: 'byPost',
  partitionKey: { name: 'postId', type: AttributeType.STRING },
  readCapacity: 5,
  writeCapacity: 5,
});
const cfnUserPool = backend.auth.resources.cfnResources.cfnUserPool;
cfnUserPool.usernameAttributes = ['phone_number'];
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
const cfnIdentityPool = backend.auth.resources.cfnResources.cfnIdentityPool;
cfnIdentityPool.allowUnauthenticatedIdentities = false;
const userPool = backend.auth.resources.userPool;
userPool.addClient('NativeAppClient', {
  refreshTokenValidity: Duration.days(120),
  enableTokenRevocation: true,
  enablePropagateAdditionalUserContextData: false,
  authSessionValidity: Duration.minutes(3),
  disableOAuth: true,
  generateSecret: false,
});
const branchName = process.env.AWS_BRANCH ?? 'sandbox';
backend.fetchuseractivity.resources.cfnResources.cfnFunction.functionName = `fetchuseractivity-${branchName}`;
backend.fetchuseractivity.addEnvironment(
  'STORAGE_ACTIVITY_STREAMARN',
  activity.tableStreamArn!
);
backend.fetchuseractivity.addEnvironment(
  'STORAGE_ACTIVITY_ARN',
  activity.tableArn
);
backend.fetchuseractivity.addEnvironment(
  'STORAGE_ACTIVITY_NAME',
  activity.tableName
);
activity.grant(
  backend.fetchuseractivity.resources.lambda,
  'dynamodb:Get*',
  'dynamodb:BatchGetItem',
  'dynamodb:List*',
  'dynamodb:Describe*',
  'dynamodb:Scan',
  'dynamodb:Query',
  'dynamodb:PartiQLSelect'
);
backend.recorduseractivity.resources.cfnResources.cfnFunction.functionName = `recorduseractivity-${branchName}`;
backend.recorduseractivity.addEnvironment(
  'STORAGE_ACTIVITY_STREAMARN',
  activity.tableStreamArn!
);
backend.recorduseractivity.addEnvironment(
  'STORAGE_ACTIVITY_ARN',
  activity.tableArn
);
backend.recorduseractivity.addEnvironment(
  'STORAGE_ACTIVITY_NAME',
  activity.tableName
);
activity.grant(
  backend.recorduseractivity.resources.lambda,
  'dynamodb:Put*',
  'dynamodb:Create*',
  'dynamodb:BatchWriteItem',
  'dynamodb:PartiQLInsert',
  'dynamodb:Get*',
  'dynamodb:BatchGetItem',
  'dynamodb:List*',
  'dynamodb:Describe*',
  'dynamodb:Scan',
  'dynamodb:Query',
  'dynamodb:PartiQLSelect',
  'dynamodb:Update*',
  'dynamodb:RestoreTable*',
  'dynamodb:PartiQLUpdate',
  'dynamodb:Delete*',
  'dynamodb:PartiQLDelete'
);
for (const model of ['Topic', 'Post', 'Comment']) {
  const table = backend.data.resources.tables[model];
  backend.recorduseractivity.resources.lambda.addEventSource(
    new DynamoEventSource(table, { startingPosition: StartingPosition.LATEST })
  );
  table.grantStreamRead(backend.recorduseractivity.resources.lambda.role!);
  table.grantTableListStreams(
    backend.recorduseractivity.resources.lambda.role!
  );
}
const s3Bucket = backend.storage.resources.cfnResources.cfnBucket;
// Use this bucket name post refactor
// s3Bucket.bucketName = 'discus-avatarsdecb9-maintwo';
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
