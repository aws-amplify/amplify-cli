import { defineFunction } from '@aws-amplify/backend';
import { Backend } from '../../backend';

const branchName = process.env.AWS_BRANCH ?? 'sandbox';

export const lognutrition = defineFunction({
  entry: './index.js',
  name: `lognutrition-${branchName}`,
  timeoutSeconds: 25,
  memoryMB: 128,
  environment: { ENV: `${branchName}`, REGION: 'us-east-1' },
  runtime: 22,
});

export const escape = (backend: Backend) => {

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

};
