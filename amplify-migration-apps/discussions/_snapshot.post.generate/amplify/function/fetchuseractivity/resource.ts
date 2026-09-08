import { defineFunction } from '@aws-amplify/backend';
import { Table } from 'aws-cdk-lib/aws-dynamodb';
import type { Backend } from '../../backend';

const branchName = process.env.AWS_BRANCH ?? 'sandbox';

export const fetchuseractivity = defineFunction({
  entry: './index.js',
  name: `fetchuseractivity-${branchName}`,
  timeoutSeconds: 25,
  memoryMB: 128,
  environment: { ENV: `${branchName}`, REGION: process.env.AWS_REGION ?? '' },
  runtime: 22,
});

export function applyEscapeHatches(backend: Backend, activity: Table) {
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
}
