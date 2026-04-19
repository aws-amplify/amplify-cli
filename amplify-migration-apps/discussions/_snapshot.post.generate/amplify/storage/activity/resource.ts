import type { Backend } from '../../backend';
import {
  Table,
  AttributeType,
  BillingMode,
  StreamViewType,
  CfnTable,
} from 'aws-cdk-lib/aws-dynamodb';

export function defineStorageActivity(backend: Backend) {
  const storageActivityStack = backend.createStack('storageactivity');
  const activity = new Table(storageActivityStack, 'activity', {
    partitionKey: { name: 'id', type: AttributeType.STRING },
    billingMode: BillingMode.PROVISIONED,
    readCapacity: 5,
    writeCapacity: 5,
    stream: StreamViewType.NEW_IMAGE,
    sortKey: { name: 'userId', type: AttributeType.STRING },
  });
  activity.addGlobalSecondaryIndex({
    indexName: 'byUserId',
    partitionKey: { name: 'userId', type: AttributeType.STRING },
    sortKey: { name: 'timestamp', type: AttributeType.STRING },
    readCapacity: 5,
    writeCapacity: 5,
  });

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
}

export function postRefactor(backend: Backend) {
  const activity = backend.stack.node.findChild('') as CfnTable;
  activity.tableName = 'activity-x';
}
