import { defineFunction } from '@aws-amplify/backend';
import { DynamoEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import { StartingPosition } from 'aws-cdk-lib/aws-lambda';
import { Table } from 'aws-cdk-lib/aws-dynamodb';
import type { Backend } from '../../backend';

const branchName = process.env.AWS_BRANCH ?? 'sandbox';

export const recorduseractivity = defineFunction({
  entry: './index.js',
  name: `recorduseractivity-${branchName}`,
  timeoutSeconds: 25,
  memoryMB: 128,
  environment: { ENV: `${branchName}`, REGION: 'us-east-1' },
  runtime: 22,
});

export function applyEscapeHatches(backend: Backend, activity: Table) {
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
  const tableTopic = backend.data.resources.tables['Topic'];
  backend.recorduseractivity.resources.lambda.addEventSource(
    new DynamoEventSource(tableTopic, {
      startingPosition: StartingPosition.LATEST,
      batchSize: 100,
    })
  );
  tableTopic.grantStreamRead(backend.recorduseractivity.resources.lambda.role!);
  tableTopic.grantTableListStreams(
    backend.recorduseractivity.resources.lambda.role!
  );
  const tablePost = backend.data.resources.tables['Post'];
  backend.recorduseractivity.resources.lambda.addEventSource(
    new DynamoEventSource(tablePost, {
      startingPosition: StartingPosition.LATEST,
      batchSize: 100,
    })
  );
  tablePost.grantStreamRead(backend.recorduseractivity.resources.lambda.role!);
  tablePost.grantTableListStreams(
    backend.recorduseractivity.resources.lambda.role!
  );
  const tableComment = backend.data.resources.tables['Comment'];
  backend.recorduseractivity.resources.lambda.addEventSource(
    new DynamoEventSource(tableComment, {
      startingPosition: StartingPosition.LATEST,
      batchSize: 100,
    })
  );
  tableComment.grantStreamRead(
    backend.recorduseractivity.resources.lambda.role!
  );
  tableComment.grantTableListStreams(
    backend.recorduseractivity.resources.lambda.role!
  );
}
