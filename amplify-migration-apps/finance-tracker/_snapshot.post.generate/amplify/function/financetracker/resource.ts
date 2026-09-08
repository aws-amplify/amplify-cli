import { defineFunction } from '@aws-amplify/backend';
import type { Backend } from '../../backend';

const branchName = process.env.AWS_BRANCH ?? 'sandbox';

export const financetracker = defineFunction({
  entry: './index.js',
  name: `financetracker-${branchName}`,
  timeoutSeconds: 25,
  memoryMB: 128,
  environment: {
    ENV: `${branchName}`,
    BUDGET_ALERT_TOPIC_ARN:
      'arn:aws:sns:us-east-1:123456789012:amplify-financetracker-x-x-customcustomfinance-x-BudgetAlertTopicF20DF526-DFMxF2RX1UKQ',
    MONTHLY_REPORT_TOPIC_ARN:
      'arn:aws:sns:us-east-1:123456789012:amplify-financetracker-x-x-customcustomfinance-x-MonthlyReportTopic8D223100-nR4J630BiqQZ',
  },
  runtime: 22,
});

export function applyEscapeHatches(backend: Backend) {
  backend.financetracker.resources.cfnResources.cfnFunction.functionName = `financetracker-${branchName}`;
  backend.financetracker.addEnvironment(
    'API_FINANCETRACKER_GRAPHQLAPIIDOUTPUT',
    backend.data.apiId
  );
  backend.financetracker.addEnvironment(
    'API_FINANCETRACKER_TRANSACTIONTABLE_ARN',
    backend.data.resources.tables['Transaction'].tableArn
  );
  backend.financetracker.addEnvironment(
    'API_FINANCETRACKER_TRANSACTIONTABLE_NAME',
    backend.data.resources.tables['Transaction'].tableName
  );
  backend.financetracker.addEnvironment(
    'REGION',
    backend.financetracker.stack.region
  );
  backend.data.resources.tables['Transaction'].grant(
    backend.financetracker.resources.lambda,
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
