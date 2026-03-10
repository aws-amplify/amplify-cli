import { auth } from './auth/resource';
import { data } from './data/resource';
import { fetchuseractivity } from './storage/fetchuseractivity/resource';
import { recorduseractivity } from './storage/recorduseractivity/resource';
import {
  Table,
  AttributeType,
  BillingMode,
  StreamViewType,
} from 'aws-cdk-lib/aws-dynamodb';
import { DynamoEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import { StartingPosition } from 'aws-cdk-lib/aws-lambda';
import { defineBackend } from '@aws-amplify/backend';
import { Duration } from 'aws-cdk-lib';

const backend = defineBackend({
  auth,
  data,
  fetchuseractivity,
  recorduseractivity,
});
const storageStack = backend.createStack('storage');
const activity = new Table(storageStack, 'activity', {
  partitionKey: { name: 'id', type: AttributeType.STRING },
  billingMode: BillingMode.PROVISIONED,
  readCapacity: 5,
  writeCapacity: 5,
  stream: StreamViewType.NEW_IMAGE,
  sortKey: { name: 'userId', type: AttributeType.STRING },
});
// Add this property to the Table above post refactor: tableName: 'activity-main'
activity.addGlobalSecondaryIndex({
  indexName: 'byUserId',
  partitionKey: { name: 'userId', type: AttributeType.STRING },
  sortKey: { name: 'timestamp', type: AttributeType.STRING },
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
  'STORAGE_ACTIVITY_ARN',
  activity.tableArn
);
backend.fetchuseractivity.addEnvironment(
  'STORAGE_ACTIVITY_STREAMARN',
  activity.tableStreamArn!
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
  'STORAGE_ACTIVITY_ARN',
  activity.tableArn
);
backend.recorduseractivity.addEnvironment(
  'STORAGE_ACTIVITY_STREAMARN',
  activity.tableStreamArn!
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
