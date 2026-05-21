import { defineFunction } from '@aws-amplify/backend';
import type { Backend } from '../../backend';

const branchName = process.env.AWS_BRANCH ?? 'sandbox';

export const lognutrition = defineFunction({
  entry: './index.js',
  name: `lognutrition-${branchName}`,
  timeoutSeconds: 25,
  memoryMB: 128,
  environment: { ENV: `${branchName}` },
  runtime: 22,
});

export function applyEscapeHatches(backend: Backend) {
  backend.lognutrition.resources.cfnResources.cfnFunction.functionName = `lognutrition-${branchName}`;
  backend.lognutrition.addEnvironment(
    'API_FITNESSTRACKER_GRAPHQLAPIIDOUTPUT',
    backend.data.apiId
  );
  backend.lognutrition.addEnvironment(
    'API_FITNESSTRACKER_MEALTABLE_ARN',
    backend.data.resources.tables['Meal'].tableArn
  );
  backend.lognutrition.addEnvironment(
    'API_FITNESSTRACKER_MEALTABLE_NAME',
    backend.data.resources.tables['Meal'].tableName
  );
  backend.lognutrition.addEnvironment(
    'REGION',
    backend.lognutrition.stack.region
  );
  backend.data.resources.tables['Meal'].grant(
    backend.lognutrition.resources.lambda,
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
}
