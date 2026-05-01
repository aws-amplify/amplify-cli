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
  environment: { ENV: `${branchName}`, REGION: process.env.AWS_REGION ?? '' },
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
  for (const model of ['Topic', 'Post', 'Comment']) {
    const table = backend.data.resources.tables[model];
    backend.recorduseractivity.resources.lambda.addEventSource(
      new DynamoEventSource(table, {
        startingPosition: StartingPosition.LATEST,
      })
    );
    table.grantStreamRead(backend.recorduseractivity.resources.lambda.role!);
    table.grantTableListStreams(
      backend.recorduseractivity.resources.lambda.role!
    );
  }
}
