import { defineFunction } from '@aws-amplify/backend';
import { DynamoEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import { StartingPosition } from 'aws-cdk-lib/aws-lambda';
import { Table } from 'aws-cdk-lib/aws-dynamodb';
import type { Backend } from '../../backend';

const branchName = process.env.AWS_BRANCH ?? 'sandbox';

export const activityTrigger = defineFunction({
  entry: './index.js',
  name: `activityTrigger-${branchName}`,
  timeoutSeconds: 25,
  memoryMB: 128,
  environment: { ENV: `${branchName}`, REGION: process.env.AWS_REGION ?? '' },
  runtime: 22,
});

export function applyEscapeHatches(backend: Backend, activity: Table) {
  backend.activityTrigger.resources.cfnResources.cfnFunction.functionName = `activityTrigger-${branchName}`;
  backend.activityTrigger.addEnvironment(
    'STORAGE_ACTIVITY_STREAMARN',
    activity.tableStreamArn!
  );
  backend.activityTrigger.addEnvironment(
    'STORAGE_ACTIVITY_ARN',
    activity.tableArn
  );
  backend.activityTrigger.addEnvironment(
    'STORAGE_ACTIVITY_NAME',
    activity.tableName
  );
  activity.grant(
    backend.activityTrigger.resources.lambda,
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
  backend.activityTrigger.resources.lambda.addEventSource(
    new DynamoEventSource(activity, {
      startingPosition: StartingPosition.LATEST,
    })
  );
  activity.grantStreamRead(backend.activityTrigger.resources.lambda.role!);
  activity.grantTableListStreams(
    backend.activityTrigger.resources.lambda.role!
  );
}
